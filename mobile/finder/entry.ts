/* The piece finder that runs in the phone app's hidden web view: the web app's own models and logic
   (web/src/lib/vision), so both apps find and cut out pieces the same way. Photos stay on the phone; only the
   models and ONNX Runtime are downloaded, once, from the CDN. scripts/build-finder.mjs bundles this file into
   src/lib/finder-bundle.ts; ONNX Runtime itself is loaded here, at the version the web app uses. */

import { findInPhoto } from '../../web/src/lib/vision/find';
import { ORT_VERSION, ready, setModelBase } from '../../web/src/lib/vision/models';
import type { FinderReply, FinderRequest, FoundPiece } from './protocol';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(msg: string): void };
    rotationFinder?: { handle(msg: FinderRequest): void };
    /** Where the model files are; set by the page before this script runs. */
    ROTATION_MODELS?: string;
  }
}

const post = (msg: FinderReply) => window.ReactNativeWebView?.postMessage(JSON.stringify(msg));

const runtime = new Promise<void>((resolve, reject) => {
  const s = document.createElement('script');
  s.src = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.wasm.min.js`;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error("Couldn't load ONNX Runtime"));
  document.head.appendChild(s);
});

if (window.ROTATION_MODELS) setModelBase(window.ROTATION_MODELS);

const dataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

async function handle(msg: FinderRequest) {
  try {
    await runtime;
    if (msg.type === 'warm') {
      await ready();
      return post({ id: msg.id, ok: true, type: 'warm' });
    }
    const found = await findInPhoto(await (await fetch(msg.image)).blob());
    // The photo as it is comes last; the app offers that itself.
    const cutouts = found.pieces.filter((p) => p.cutout);
    const pieces: FoundPiece[] = [];
    for (const p of cutouts)
      pieces.push({ label: p.label, part: p.part, rgb: p.rgb, together: !!p.together, clipped: !!p.clipped, image: await dataUrl(p.blob) });
    const guess = cutouts.findIndex((p) => p.id === found.guess);
    post({ id: msg.id, ok: true, type: 'find', sure: found.sure, guess: guess >= 0 ? guess : undefined, pieces });
  } catch (e) {
    post({ id: msg.id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

window.rotationFinder = { handle: (msg) => void handle(msg) };
post({ type: 'loaded' });
