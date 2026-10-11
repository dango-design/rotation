/* The web app's piece finder, running in a hidden web view (finder/entry.ts, bundled into src/lib/finder-bundle.ts).
   It works in Expo Go and on any phone. Photos are handed to it on the phone and never uploaded; the models are
   downloaded once from the CDN, starting as soon as the finder is mounted, and then cached. For product links, the
   page asks for each store photo and the app downloads it, since the page can't read store images itself. */

import { File, Paths } from 'expo-file-system';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Hint } from '@core/garment-hints';
import type { TextLine } from '@core/page-text';
import type { FinderReply, FoundPiece } from '../../finder/protocol';
import { forFinder } from '@/lib/cutout';
import { FINDER_JS } from '@/lib/finder-bundle';
import { READER_HEADERS } from '@/lib/product-link';

/** The models, from this repository at a fixed commit, so the cached copies never go stale. */
const MODELS = 'https://cdn.jsdelivr.net/gh/dango-design/rotation@eaaac184a41d814f2a2dd28575c9ce5bec7c88ab/web/public/models/';
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><script>window.ROTATION_MODELS=${JSON.stringify(MODELS)};</script><script>${FINDER_JS.replace(/<\/script/gi, '<\\/script')}</script></head><body></body></html>`;
/** The first photo can wait on about 23 MB of downloads; a product page has several photos to check. */
const TIMEOUT = { warm: 120_000, find: 120_000, product: 180_000, productPhoto: 120_000, warmText: 120_000, text: 120_000 };

export type Found = { sure: boolean; guess?: number; pieces: FoundPiece[] };

/** A reply to a request (everything but the page's own messages). */
type Reply = Exclude<FinderReply, { type: 'loaded' | 'photo' | 'progress' }>;
type Request =
  | { type: 'warm' }
  | { type: 'find'; image: string }
  | { type: 'product'; urls: string[]; hint?: Hint }
  | { type: 'productPhoto'; url: string; index: number; hint?: Hint }
  | { type: 'warmText' }
  | { type: 'text'; image: string };
type Pending = { done: (r: Reply | null) => void; progress?: (done: number, total: number) => void };

export type Finder = {
  available: boolean;
  /** 'loading' until the models are downloaded and started. */
  status: 'loading' | 'ready' | 'failed';
  /** The pieces in a photo (a data URL), each cut out. Null if the finder couldn't run. */
  find: (image: string) => Promise<Found | null>;
  /** The product in a product page's photos: the best cutouts, then the best photo as it is. */
  findProduct: (urls: string[], hint: Hint | undefined, onProgress?: (done: number, total: number) => void) => Promise<Found | null>;
  /** The product in one of the page's photos, picked by the person. */
  findProductPhoto: (url: string, index: number, hint: Hint | undefined) => Promise<Found | null>;
  /** Start loading the text reader (about 7 MB the first time), e.g. while someone picks a photo. */
  warmText: () => void;
  /** The lines of text in a photo (a data URL). Null if the reader couldn't run. */
  readText: (image: string) => Promise<TextLine[] | null>;
  /** Mount this once, anywhere in the screen. */
  host: React.ReactElement;
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

let downloads = 0;

/** A store's photo, downloaded on the phone and sized for the finder. Null if it can't be loaded. */
async function storePhoto(url: string): Promise<string | null> {
  try {
    const dest = new File(Paths.cache, `store-photo-${Date.now().toString(36)}-${++downloads}`);
    const file = await File.downloadFileAsync(url, dest, { headers: { ...READER_HEADERS, accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5' }, idempotent: true });
    return await forFinder({ uri: file.uri });
  } catch {
    return null;
  }
}

export function usePieceFinder(): Finder {
  const ref = useRef({ view: null as WebView | null, pending: new Map<string, Pending>(), loaded: null as ReturnType<typeof deferred> | null, n: 0 });
  const [status, setStatus] = useState<Finder['status']>('loading');
  const loaded = () => (ref.current.loaded ??= deferred());
  const inject = (js: string) => ref.current.view?.injectJavaScript(`${js};true;`);

  const ask = (msg: Request, progress?: Pending['progress']) =>
    new Promise<Reply | null>((resolve) => {
      const web = ref.current;
      const id = `m${++web.n}`;
      const timer = setTimeout(() => done(null), TIMEOUT[msg.type]);
      const done = (r: Reply | null) => {
        clearTimeout(timer);
        web.pending.delete(id);
        resolve(r);
      };
      web.pending.set(id, { done, progress });
      loaded().promise.then(() => inject(`window.rotationFinder&&window.rotationFinder.handle(${JSON.stringify({ ...msg, id })})`));
    });

  const onMessage = (e: WebViewMessageEvent) => {
    let m: FinderReply;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (m.type) {
      case 'loaded':
        loaded().resolve();
        // Start the downloads now, so they're done by the time a photo is picked.
        ask({ type: 'warm' }).then((r) => setStatus(r && r.ok ? 'ready' : 'failed'));
        return;
      case 'photo':
        storePhoto(m.url).then((data) => inject(`window.rotationFinder&&window.rotationFinder.photo(${JSON.stringify(m.rid)},${JSON.stringify(data)})`));
        return;
      case 'progress':
        ref.current.pending.get(m.id)?.progress?.(m.done, m.total);
        return;
      default:
        ref.current.pending.get(m.id)?.done(m);
    }
  };

  const found = (r: Reply | null): Found | null => {
    if (!r || !r.ok || !('pieces' in r)) return null;
    setStatus('ready');
    return { sure: r.sure, guess: r.guess, pieces: r.pieces };
  };

  const host = (
    <View pointerEvents="none" style={styles.host}>
      <WebView
        ref={(v) => {
          ref.current.view = v;
        }}
        source={{ html: PAGE, baseUrl: 'https://cdn.jsdelivr.net/' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        // iOS can end a hidden web view's process to free memory; start it again.
        onContentProcessDidTerminate={() => ref.current.view?.reload()}
        javaScriptEnabled
      />
    </View>
  );

  return {
    available: true,
    status,
    find: async (image) => found(await ask({ type: 'find', image })),
    findProduct: async (urls, hint, onProgress) => found(await ask({ type: 'product', urls, hint }, onProgress)),
    findProductPhoto: async (url, index, hint) => found(await ask({ type: 'productPhoto', url, index, hint })),
    warmText: () => void ask({ type: 'warmText' }),
    readText: async (image) => {
      const r = await ask({ type: 'text', image });
      return r && r.ok && r.type === 'text' ? r.lines : null;
    },
    host,
  };
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: -10, top: 0, width: 1, height: 1, opacity: 0 },
});
