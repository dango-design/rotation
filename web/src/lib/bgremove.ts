/* In-browser background removal with U²-Net (u2netp, Apache-2.0), run by ONNX Runtime Web.
   Photos never leave the device. Pre- and post-processing follow rembg's u2netp pipeline. */

import type * as Ort from 'onnxruntime-web';

const ORT_VERSION = '1.30.0';
const SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let session: Promise<{ ort: typeof Ort; sess: Ort.InferenceSession }> | null = null;

function load() {
  if (!session) {
    session = (async () => {
      const ort = await import('onnxruntime-web/wasm');
      ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
      ort.env.wasm.numThreads = 1;
      const sess = await ort.InferenceSession.create('/models/u2netp.onnx', { executionProviders: ['wasm'] });
      return { ort, sess };
    })();
    session.catch(() => (session = null));
  }
  return session;
}

/** Start downloading the model early, e.g. when the add dialog opens. */
export const warmUp = () => void load().catch(() => {});

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export interface Cutout {
  blob: Blob;
  /** Average color of the garment, for suggesting a swatch. */
  rgb: [number, number, number];
}

export async function removeBackground(file: Blob, maxSide = 1200): Promise<Cutout> {
  const { ort, sess } = await load();
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * scale);
  const H = Math.round(bmp.height * scale);

  // Model input: 320×320, divided by the max value, then ImageNet-normalized, CHW.
  const inC = canvas(SIZE, SIZE);
  const inCtx = inC.getContext('2d')!;
  inCtx.drawImage(bmp, 0, 0, SIZE, SIZE);
  const px = inCtx.getImageData(0, 0, SIZE, SIZE).data;
  let max = 1e-6;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const input = new Float32Array(3 * SIZE * SIZE);
  for (let i = 0, p = 0; i < px.length; i += 4, p++)
    for (let ch = 0; ch < 3; ch++) input[ch * SIZE * SIZE + p] = (px[i + ch] / max - MEAN[ch]) / STD[ch];

  const out = await sess.run({ [sess.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) });
  const pred = out[sess.outputNames[0]].data as Float32Array;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) [lo, hi] = [Math.min(lo, v), Math.max(hi, v)];

  // Mask at model resolution, then scaled to the photo.
  const maskC = canvas(SIZE, SIZE);
  const maskCtx = maskC.getContext('2d')!;
  const mask = maskCtx.createImageData(SIZE, SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const a = (pred[p] - lo) / (hi - lo || 1);
    mask.data[p * 4 + 3] = Math.round(Math.min(1, Math.max(0, (a - 0.08) / 0.84)) * 255);
  }
  maskCtx.putImageData(mask, 0, 0);

  const outC = canvas(W, H);
  const ctx = outC.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(maskC, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // Crop to the garment, keep a small margin, and measure its average color.
  const data = ctx.getImageData(0, 0, W, H).data;
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  let [r, g, b, n] = [0, 0, 0, 0];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = data[i + 3];
      if (a > 24) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      if (a > 200 && (x + y) % 3 === 0) [r, g, b, n] = [r + data[i], g + data[i + 1], b + data[i + 2], n + 1];
    }
  if (x1 <= x0 || y1 <= y0) [x0, y0, x1, y1] = [0, 0, W - 1, H - 1];
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  const cx = Math.max(0, x0 - pad);
  const cy = Math.max(0, y0 - pad);
  const cw = Math.min(W, x1 + pad) - cx;
  const ch = Math.min(H, y1 + pad) - cy;
  const crop = canvas(cw, ch);
  crop.getContext('2d')!.drawImage(outC, cx, cy, cw, ch, 0, 0, cw, ch);
  const blob = await new Promise<Blob>((res, rej) => crop.toBlob((bl) => (bl ? res(bl) : rej(new Error('encode failed'))), 'image/png'));
  return { blob, rgb: n ? [r / n, g / n, b / n] : [200, 200, 200] };
}

/** A small JPEG of an image on a white background, as base64, for AI tagging. */
export async function toJpegBase64(blob: Blob, maxSide = 640): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = canvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}

/** Average color of an image's opaque, non-white pixels (for product photos on white). */
export async function averageColor(blob: Blob): Promise<[number, number, number]> {
  const bmp = await createImageBitmap(blob);
  const c = canvas(64, 64);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, 64, 64);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let [r, g, b, n] = [0, 0, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200 || (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235)) continue;
    [r, g, b, n] = [r + d[i], g + d[i + 1], b + d[i + 2], n + 1];
  }
  return n ? [r / n, g / n, b / n] : [200, 200, 200];
}
