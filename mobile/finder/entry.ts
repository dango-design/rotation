/* The piece finder that runs in the phone app's hidden web view: the web app's own models and logic
   (web/src/lib/vision), so both apps find and cut out pieces the same way. Photos stay on the phone; only the
   models and ONNX Runtime are downloaded, once, from the CDN. scripts/build-finder.mjs bundles this file into
   src/lib/finder-bundle.ts; ONNX Runtime itself is loaded here, at the version the web app uses. */

import { findInPhoto, findInProduct, findInProductPhoto, type Found, type Piece, type PhotoLoader } from '../../web/src/lib/vision/find';
import { ORT_VERSION, ready, setModelBase } from '../../web/src/lib/vision/models';
import type { TextLine } from '../../web/src/lib/page-text';
import type { FinderReply, FinderRequest, FoundPiece } from './protocol';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(msg: string): void };
    rotationFinder?: { handle(msg: FinderRequest): void; photo(rid: string, data: string | null): void };
    /** Where the model files are; set by the page before this script runs. */
    ROTATION_MODELS?: string;
  }
}

const post = (msg: FinderReply) => window.ReactNativeWebView?.postMessage(JSON.stringify(msg));

const script = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.appendChild(s);
  });

const runtime = script(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.wasm.min.js`);

/* The text reader for screenshots: Tesseract, loaded the first time it's needed. About 7 MB with its English data,
   which it keeps in the page's storage after that. */
const TESSERACT = '7.0.0';
type Box = { x0: number; y0: number; x1: number; y1: number };
type OcrLine = { text: string; confidence: number; bbox: Box };
type OcrWorker = { recognize(image: Blob, options: object, output: object): Promise<{ data: { blocks: { paragraphs: { lines: OcrLine[] }[] }[] | null } }> };
let reader: Promise<OcrWorker> | null = null;
const textReader = () => {
  reader ??= script(`https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT}/dist/tesseract.min.js`).then(() =>
    (window as unknown as { Tesseract: { createWorker(lang: string, oem: number, options: object): Promise<OcrWorker> } }).Tesseract.createWorker('eng', 1, {
      workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT}/dist/worker.min.js`,
      corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT}`,
      langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',
    }),
  );
  reader.catch(() => (reader = null));
  return reader;
};

/** The lines of text in an image, in fractions of its width, leaving out what the reader wasn't sure of. */
async function readText(image: Blob): Promise<TextLine[]> {
  const bmp = await createImageBitmap(image);
  const w = bmp.width;
  bmp.close();
  const { data } = await (await textReader()).recognize(image, {}, { blocks: true });
  return (data.blocks ?? [])
    .flatMap((b) => b.paragraphs.flatMap((p) => p.lines))
    .filter((l) => l.confidence >= 50 && l.text.trim())
    .map((l) => ({ text: l.text.trim(), x: l.bbox.x0 / w, y: l.bbox.y0 / w, w: (l.bbox.x1 - l.bbox.x0) / w, h: (l.bbox.y1 - l.bbox.y0) / w }));
}

if (window.ROTATION_MODELS) setModelBase(window.ROTATION_MODELS);

const dataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Product photos come from the app, which downloads them: the page can't read store images itself. */
const asking = new Map<string, (data: string | null) => void>();
let asks = 0;
const photoFromApp: PhotoLoader = (url) =>
  new Promise((resolve) => {
    const rid = `p${++asks}`;
    asking.set(rid, (data) => {
      asking.delete(rid);
      if (!data) return resolve(null);
      fetch(data)
        .then((r) => r.blob())
        .then(resolve, () => resolve(null));
    });
    post({ type: 'photo', rid, url });
  });

async function send(id: string, type: 'find' | 'product' | 'productPhoto', found: Found) {
  const pieces: FoundPiece[] = [];
  for (const p of found.pieces) pieces.push(await asFound(p));
  const guess = found.pieces.findIndex((p) => p.id === found.guess);
  post({ id, ok: true, type, sure: found.sure, guess: guess >= 0 ? guess : undefined, pieces });
}

const asFound = async (p: Piece): Promise<FoundPiece> => ({
  label: p.label,
  part: p.part,
  rgb: p.rgb,
  cutout: p.cutout,
  together: !!p.together,
  clipped: !!p.clipped,
  photo: p.photo,
  image: await dataUrl(p.blob),
});

async function handle(msg: FinderRequest) {
  try {
    if (msg.type === 'warmText') {
      await textReader();
      return post({ id: msg.id, ok: true, type: 'warmText' });
    }
    if (msg.type === 'text') return post({ id: msg.id, ok: true, type: 'text', lines: await readText(await (await fetch(msg.image)).blob()) });
    await runtime;
    switch (msg.type) {
      case 'warm':
        await ready();
        return post({ id: msg.id, ok: true, type: 'warm' });
      case 'find': {
        const found = await findInPhoto(await (await fetch(msg.image)).blob());
        // The photo as it is comes last; for someone's own photo the app offers that itself.
        return send(msg.id, 'find', { ...found, pieces: found.pieces.filter((p) => p.cutout) });
      }
      case 'product': {
        const found = await findInProduct(msg.urls, msg.hint, (done, total) => post({ type: 'progress', id: msg.id, done, total }), photoFromApp);
        if (!found) return post({ id: msg.id, ok: false, type: 'error', error: "Couldn't load the product's photos." });
        return send(msg.id, 'product', found);
      }
      case 'productPhoto':
        return send(msg.id, 'productPhoto', { sure: false, pieces: await findInProductPhoto(msg.url, msg.index, msg.hint, photoFromApp) });
    }
  } catch (e) {
    post({ id: msg.id, ok: false, type: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}

window.rotationFinder = { handle: (msg) => void handle(msg), photo: (rid, data) => asking.get(rid)?.(data) };
post({ type: 'loaded' });
