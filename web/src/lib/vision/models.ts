/* The two on-device models, run by ONNX Runtime Web. Photos never leave the device.
   - U²-Net (u2netp, Apache-2.0): outlines the main object. Pre- and post-processing follow rembg.
   - SegFormer B0 fine-tuned for clothes (mattmdjaga/segformer_b0_clothes, MIT; ONNX by Xenova): labels each pixel
     as hat, hair, top, skirt, pants, dress, belt, shoes, skin, bag or scarf. */

import type * as Ort from 'onnxruntime-web';
import { LABEL_GROUP, PARTS } from './analyze';
import type { ParserPart } from '../garment-hints';

const ORT_VERSION = '1.30.0';
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let runtime: Promise<typeof Ort> | null = null;
const sessions = new Map<string, Promise<Ort.InferenceSession>>();

function ort() {
  if (!runtime) {
    runtime = import('onnxruntime-web/wasm').then((m) => {
      m.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
      m.env.wasm.numThreads = 1;
      return m;
    });
    runtime.catch(() => (runtime = null));
  }
  return runtime;
}

function session(path: string) {
  let s = sessions.get(path);
  if (!s) {
    s = ort().then((o) => o.InferenceSession.create(path, { executionProviders: ['wasm'] }));
    sessions.set(path, s);
    s.catch(() => sessions.delete(path));
  }
  return s;
}

const U2NET = '/models/u2netp.onnx';
const PARSER = '/models/segformer_b0_clothes_quantized.onnx';

/** Start downloading both models early, e.g. when the add dialog opens. */
export const warmUp = () => void Promise.all([session(U2NET), session(PARSER)]).catch(() => {});

function pixels(img: CanvasImageSource, size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}

/** CHW float input, ImageNet-normalized after dividing by `div`. */
function tensor(o: typeof Ort, px: Uint8ClampedArray, size: number, div: number) {
  const input = new Float32Array(3 * size * size);
  for (let i = 0, p = 0; i < px.length; i += 4, p++)
    for (let ch = 0; ch < 3; ch++) input[ch * size * size + p] = (px[i + ch] / div - MEAN[ch]) / STD[ch];
  return new o.Tensor('float32', input, [1, 3, size, size]);
}

export const SALIENT_SIZE = 320;

/** Salient-object mask at 320×320, scaled to 0..1. */
export async function salient(img: CanvasImageSource): Promise<Float32Array> {
  const [o, sess] = await Promise.all([ort(), session(U2NET)]);
  const px = pixels(img, SALIENT_SIZE);
  let max = 1e-6;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const out = await sess.run({ [sess.inputNames[0]]: tensor(o, px, SALIENT_SIZE, max) });
  const pred = out[sess.outputNames[0]].data as Float32Array;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) [lo, hi] = [Math.min(lo, v), Math.max(hi, v)];
  return pred.map((v) => (v - lo) / (hi - lo || 1));
}

const PARSER_INPUT = 512;

export interface Parsed {
  w: number;
  h: number;
  labels: Uint8Array;
  prob: Record<ParserPart, Float32Array>;
  /** Probability of anything but background: clothing or a person. */
  fg: Float32Array;
}

/** Clothing labels and per-part probabilities on the parser's 128×128 output grid. */
export async function parse(img: CanvasImageSource): Promise<Parsed> {
  const [o, sess] = await Promise.all([ort(), session(PARSER)]);
  const px = pixels(img, PARSER_INPUT);
  const out = await sess.run({ [sess.inputNames[0]]: tensor(o, px, PARSER_INPUT, 255) });
  const logits = out[sess.outputNames[0]];
  const [, classes, h, w] = logits.dims as number[];
  const data = logits.data as Float32Array;
  const n = w * h;
  const labels = new Uint8Array(n);
  const prob = Object.fromEntries(PARTS.map((p) => [p, new Float32Array(n)])) as Record<ParserPart, Float32Array>;
  const fg = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let max = -Infinity;
    let arg = 0;
    for (let c = 0; c < classes; c++) {
      const v = data[c * n + i];
      if (v > max) [max, arg] = [v, c];
    }
    labels[i] = arg;
    let sum = 0;
    for (let c = 0; c < classes; c++) sum += Math.exp(data[c * n + i] - max);
    for (let c = 0; c < classes; c++) {
      const g = LABEL_GROUP[c] as ParserPart;
      if (g in prob) prob[g][i] += Math.exp(data[c * n + i] - max) / sum;
    }
    fg[i] = 1 - Math.exp(data[i] - max) / sum;
  }
  return { w, h, labels, prob, fg };
}
