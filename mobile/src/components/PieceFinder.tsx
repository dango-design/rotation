/* The web app's piece finder, running in a hidden web view (finder/entry.ts, bundled into src/lib/finder-bundle.ts).
   It works in Expo Go and on any phone. Photos are handed to it on the phone and never uploaded; the models are
   downloaded once from the CDN, starting as soon as the finder is mounted, and then cached. */

import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { FinderReply, FoundPiece } from '../../finder/protocol';
import { FINDER_JS } from '@/lib/finder-bundle';

/** The models, from this repository at a fixed commit, so the cached copies never go stale. */
const MODELS = 'https://cdn.jsdelivr.net/gh/dango-design/rotation@eaaac184a41d814f2a2dd28575c9ce5bec7c88ab/web/public/models/';
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><script>window.ROTATION_MODELS=${JSON.stringify(MODELS)};</script><script>${FINDER_JS.replace(/<\/script/gi, '<\\/script')}</script></head><body></body></html>`;
/** The first photo can wait on about 23 MB of downloads. */
const TIMEOUT = 120_000;

export type Found = { sure: boolean; guess?: number; pieces: FoundPiece[] };

/** A reply to a request (everything but the page's own 'loaded'). */
type Reply = Exclude<FinderReply, { type: 'loaded' }>;

export type Finder = {
  available: boolean;
  /** 'loading' until the models are downloaded and started. */
  status: 'loading' | 'ready' | 'failed';
  /** The pieces in a photo (a data URL), each cut out. Null if the finder couldn't run. */
  find: (image: string) => Promise<Found | null>;
  /** Mount this once, anywhere in the screen. */
  host: React.ReactElement;
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

export function usePieceFinder(): Finder {
  const ref = useRef({ view: null as WebView | null, pending: new Map<string, (r: Reply | null) => void>(), loaded: null as ReturnType<typeof deferred> | null, n: 0 });
  const [status, setStatus] = useState<Finder['status']>('loading');
  const loaded = () => (ref.current.loaded ??= deferred());

  const ask = (msg: { type: 'warm' } | { type: 'find'; image: string }) =>
    new Promise<Reply | null>((resolve) => {
      const web = ref.current;
      const id = `m${++web.n}`;
      const timer = setTimeout(() => done(null), TIMEOUT);
      const done = (r: Reply | null) => {
        clearTimeout(timer);
        web.pending.delete(id);
        resolve(r);
      };
      web.pending.set(id, done);
      loaded().promise.then(() => web.view?.injectJavaScript(`window.rotationFinder&&window.rotationFinder.handle(${JSON.stringify({ ...msg, id })});true;`));
    });

  const onMessage = (e: WebViewMessageEvent) => {
    let m: FinderReply;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if ('id' in m) ref.current.pending.get(m.id)?.(m);
    else if (m.type === 'loaded') {
      loaded().resolve();
      // Start the downloads now, so they're done by the time a photo is picked.
      ask({ type: 'warm' }).then((r) => setStatus(r && r.ok ? 'ready' : 'failed'));
    }
  };

  const find = async (image: string) => {
    const r = await ask({ type: 'find', image });
    if (!r || !r.ok || r.type !== 'find') return null;
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

  return { available: true, status, find, host };
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: -10, top: 0, width: 1, height: 1, opacity: 0 },
});
