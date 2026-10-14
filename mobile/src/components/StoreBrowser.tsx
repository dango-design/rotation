/* Rotation's own browser, for stores that only show their pages to a full browser. The person opens the store here,
   goes to the piece, and taps Add this piece: the page they're looking at is read with the same reader as a pasted
   link (productFrom in src/lib/product-link.ts). Since they're a real visitor in a real browser, the store's bot
   check lets them in; Rotation never tries to get past one itself. The page's photos are loaded from inside the
   page too, because some stores (Madewell) won't send them to an app either. */

import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { BlockedError, keepPhoto, productFrom, type Product } from '@/lib/product-link';
import { C, F, GUTTER } from '@/theme';
import { Btn, IconBtn, T } from './ui';

/** What the page sends back: the parts of its HTML the reader uses, or its photos as data URLs. */
type Msg = { type: 'page'; url: string; html: string } | { type: 'photos'; photos: (string | null)[] };

const POST = 'var post=function(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))};';

/**
 * The page as the person sees it, after the store's scripts have run: its title, structured data, meta tags, links
 * and images, and a little of its text (an empty page means the store is still checking the browser).
 */
const READ_PAGE = `(function(){${POST}try{
var esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')};
var keep=document.querySelectorAll('script[type="application/ld+json"],meta,link[rel],img'),parts=[];
for(var i=0;i<keep.length;i++)parts.push(keep[i].outerHTML);
var text=document.body?document.body.innerText.slice(0,300):'';
post({type:'page',url:location.href,html:'<html><head><title>'+esc(document.title)+'</title>'+parts.join('')+'</head><body><p>'+esc(text)+'</p></body></html>'});
}catch(e){post({type:'page',url:location.href,html:''})}})()`;

/** The product's photos, loaded by the page itself and sized for the finder. Null for any the page can't load. */
const loadPhotos = (urls: string[]) => `(async function(urls){${POST}
var out=await Promise.all(urls.map(async function(u){try{
var r=await fetch(u);if(!r.ok)return null;
var b=await createImageBitmap(await r.blob()),k=Math.min(1,1200/Math.max(b.width,b.height));
var c=document.createElement('canvas');c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);
var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0,c.width,c.height);
return c.toDataURL('image/jpeg',0.9)}catch(e){return null}}));
post({type:'photos',photos:out})})(${JSON.stringify(urls)})`;

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export function StoreBrowser({ url, note, onProduct, onClose }: { url: string; note?: string; onProduct: (p: Product) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const view = useRef<WebView>(null);
  const waiting = useRef<((m: Msg | null) => void) | null>(null);
  const [nav, setNav] = useState({ url, title: '', canGoBack: false, loading: true });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(note ?? '');

  /** Runs a script in the page and waits for what it sends back. */
  const ask = (js: string, ms: number) =>
    new Promise<Msg | null>((resolve) => {
      waiting.current?.(null);
      const timer = setTimeout(() => done(null), ms);
      const done = (m: Msg | null) => {
        clearTimeout(timer);
        waiting.current = null;
        resolve(m);
      };
      waiting.current = done;
      view.current?.injectJavaScript(`${js};true;`);
    });

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      waiting.current?.(JSON.parse(e.nativeEvent.data));
    } catch {
      /* not ours */
    }
  };

  const add = async () => {
    setBusy(true);
    setMessage('');
    try {
      const page = await ask(READ_PAGE, 10_000);
      if (page?.type !== 'page' || !page.html) throw new Error("Couldn't read this page. Wait for it to finish loading, then try again.");
      let product: Product;
      try {
        product = productFrom(page.html, new URL(page.url));
      } catch (e) {
        throw new Error(e instanceof BlockedError ? 'The store is still checking this browser. Wait for its page to appear, then try again.' : notProduct);
      }
      // A category or home page has a title too, but no price or brand.
      if (product.price === null && !product.brand) throw new Error(notProduct);
      if (product.images.length) {
        const photos = await ask(loadPhotos(product.images), 20_000);
        if (photos?.type === 'photos') photos.photos.forEach((data, i) => data && keepPhoto(product.images[i], data));
      }
      onProduct(product);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : notProduct);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.head, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 10 }]}>
        <IconBtn icon="left" label="Back" size={36} disabled={!nav.canGoBack} onPress={() => view.current?.goBack()} />
        <View style={{ flex: 1 }}>
          <T v="label" numberOfLines={1} style={{ fontFamily: F.semibold }}>
            {nav.title || host(nav.url)}
          </T>
          <T v="tiny" numberOfLines={1}>
            {host(nav.url)}
          </T>
        </View>
        {nav.loading ? <ActivityIndicator color={C.ink3} /> : null}
        <IconBtn icon="x" label="Close" size={36} onPress={onClose} />
      </View>
      <WebView
        ref={view}
        source={{ uri: url }}
        style={{ flex: 1 }}
        onMessage={onMessage}
        onNavigationStateChange={(s) => setNav({ url: s.url, title: s.title ?? '', canGoBack: s.canGoBack, loading: s.loading })}
        // Links that open a new window stay in this one.
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
        // The same name Safari gives, since this is Safari's engine; some stores turn away browsers they don't know.
        applicationNameForUserAgent={Platform.OS === 'ios' ? 'Version/26.0 Mobile/15E148 Safari/604.1' : undefined}
        onContentProcessDidTerminate={() => view.current?.reload()}
        javaScriptEnabled
      />
      <View style={[styles.foot, { paddingBottom: insets.bottom + 12 }]}>
        {message ? <T v="small">{message}</T> : null}
        <Btn kind="primary" icon="plus" label={busy ? 'Reading the page…' : 'Add this piece'} disabled={busy} onPress={add} />
      </View>
    </View>
  );
}

const notProduct = 'This isn’t a product page. Open the piece you want, then tap Add this piece.';

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: GUTTER, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  foot: { gap: 10, paddingHorizontal: GUTTER, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
});
