/* Finds the pieces in a photo, or the product in a product page's photos, and cuts them out on the device.
   Returns the cutouts best first and whether it is sure; when it isn't, the person picks. */

import type { Hint, Part } from '../garment-hints';
import { decide, GOOD_ENOUGH, isWorn, photoScore, SURE_SCORE, type Maps, type Region, type Verdict } from './analyze';
import { applyGuided, components, dilate, guidedCoefficients, plainBorder, resize } from './masks';
import { parse, salient, SALIENT_SIZE } from './models';

/** Longest side of saved photos. */
const MAX_SIDE = 1200;
/** Longest side the edge refinement is computed at. */
const GUIDE_SIDE = 400;
/** Product page photos checked at most. Stores often put their product shots after several model photos. */
const MAX_PHOTOS = 10;

export interface Piece {
  id: string;
  label: string;
  part?: Part;
  blob: Blob;
  rgb: [number, number, number];
  /** The background is removed. False for a photo used as it is. */
  cutout: boolean;
  /** Several pieces offered together, in case they are one. */
  together?: boolean;
  /** The photo's edge cuts the piece off. */
  clipped?: boolean;
  /** Which of the product page's photos it came from. */
  photo?: number;
}

export interface Found {
  /** Sure the first piece is the one; otherwise the person picks. */
  sure: boolean;
  /** Cutouts best first, then the photo as it is. */
  pieces: Piece[];
  /** Piece to preselect when asking. */
  guess?: string;
}

interface Photo {
  key: string;
  /** Position in the product page's gallery. */
  index?: number;
  W: number;
  H: number;
  canvas: HTMLCanvasElement;
  rgba: Uint8ClampedArray;
  /** Outline of the main objects, salSize × salSize. */
  sal: Float32Array;
  salSize: number;
  maps: Maps;
  verdict: Verdict;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function scaled(src: CanvasImageSource, w: number, h: number) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/** Encode a canvas. Synchronous on purpose: toBlob's callback is throttled in background tabs. */
function encode(c: HTMLCanvasElement, type: string, quality?: number) {
  const url = c.toDataURL(type, quality);
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: url.slice(5, url.indexOf(';')) });
}

/** Decode a photo, run both models and decide what it shows. */
async function load(blob: Blob, key: string, hint?: Hint, index?: number): Promise<Photo> {
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const W = Math.max(1, Math.round(bmp.width * s));
  const H = Math.max(1, Math.round(bmp.height * s));
  const c = canvas(W, H);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  // Product photos are sometimes already transparent PNGs; put them on white so the models see the edges.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, W, H);
  bmp.close();
  const rgba = ctx.getImageData(0, 0, W, H).data;

  // The parser runs first. On a photo of someone, its own foreground is enough and the outline model is skipped.
  const parsed = await parse(c);
  const worn = isWorn(parsed);
  const sal = worn ? parsed.fg : await salient(c);
  const salSize = worn ? parsed.w : SALIENT_SIZE;
  const maps: Maps = {
    ...parsed,
    salient: resize(sal, salSize, salSize, parsed.w, parsed.h),
    rgba: scaled(c, parsed.w, parsed.h),
    plain: plainBorder(scaled(c, 96, 96), 96, 96).plain,
  };
  return { key, index, W, H, canvas: c, rgba, sal, salSize, maps, verdict: decide(maps, hint) };
}

/** Cut one region out of the photo: coarse mask → snapped to the photo's edges → islands dropped → cropped. */
async function cut(photo: Photo, region: Region): Promise<Piece> {
  const { W, H, maps } = photo;
  const gs = Math.min(1, GUIDE_SIDE / Math.max(W, H));
  const gw = Math.max(1, Math.round(W * gs));
  const gh = Math.max(1, Math.round(H * gs));
  const guide = scaled(photo.canvas, gw, gh);

  const inside = resize(region.mask.map((v) => (v > 0.02 ? 1 : 0)), maps.w, maps.h, gw, gh);
  const sal = resize(photo.sal, photo.salSize, photo.salSize, gw, gh);
  let p: Float32Array;
  if (region.whole) {
    p = sal.map((v, i) => (inside[i] > 0.5 ? v : 0));
  } else {
    p = resize(region.mask, maps.w, maps.h, gw, gh);
    // Where the salient mask covers the garment (a person on a plain background), it also has the sharper outline.
    let cover = 0;
    let n = 0;
    for (let i = 0; i < p.length; i++) {
      if (p[i] <= 0.5) continue;
      cover += sal[i];
      n++;
    }
    if (n && cover / n > 0.6) p = p.map((v, i) => v * Math.min(1, sal[i] * 1.4));
  }

  const r = Math.max(2, Math.round(Math.max(gw, gh) / (region.whole ? 100 : 60)));
  const alpha = applyGuided(guidedCoefficients(guide, p, gw, gh, r, region.whole ? 2e-4 : 1e-3), photo.rgba, W, H);
  for (let i = 0; i < alpha.length; i++) alpha[i] = Math.min(1, Math.max(0, (alpha[i] - 0.2) / 0.6));

  // Keep the main blob (and any of similar size, like the second shoe); drop specks.
  const on = new Uint8Array(W * H);
  for (let i = 0; i < on.length; i++) on[i] = alpha[i] > 0.5 ? 1 : 0;
  const c = components(on, W, H);
  const largest = Math.max(0, ...c.sizes);
  const keepLabel = c.sizes.map((s, i) => i > 0 && s >= 0.08 * largest);
  const keep = new Uint8Array(W * H);
  for (let i = 0; i < keep.length; i++) keep[i] = keepLabel[c.labels[i]] ? 1 : 0;
  const near = dilate(keep, W, H, Math.max(2, Math.round(Math.max(W, H) / 200)));

  const out = new ImageData(W, H);
  const d = out.data;
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  let [rs, gsum, bs, cnt] = [0, 0, 0, 0];
  for (let i = 0; i < W * H; i++) {
    const a = near[i] ? alpha[i] : 0;
    d[i * 4] = photo.rgba[i * 4];
    d[i * 4 + 1] = photo.rgba[i * 4 + 1];
    d[i * 4 + 2] = photo.rgba[i * 4 + 2];
    d[i * 4 + 3] = Math.round(a * 255);
    if (a > 0.1) {
      const x = i % W;
      const y = (i - x) / W;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (a > 0.9 && i % 3 === 0) [rs, gsum, bs, cnt] = [rs + d[i * 4], gsum + d[i * 4 + 1], bs + d[i * 4 + 2], cnt + 1];
  }
  if (x1 <= x0 || y1 <= y0) [x0, y0, x1, y1] = [0, 0, W - 1, H - 1];
  const full = canvas(W, H);
  full.getContext('2d')!.putImageData(out, 0, 0);
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  const cx = Math.max(0, x0 - pad);
  const cy = Math.max(0, y0 - pad);
  const cw = Math.min(W, x1 + pad + 1) - cx;
  const ch = Math.min(H, y1 + pad + 1) - cy;
  const crop = canvas(cw, ch);
  crop.getContext('2d')!.drawImage(full, cx, cy, cw, ch, 0, 0, cw, ch);
  return {
    id: `${photo.key}:${region.id}`,
    label: region.label,
    part: region.part,
    together: region.together,
    clipped: region.clipped,
    photo: photo.index,
    blob: encode(crop, 'image/png'),
    rgb: cnt ? [rs / cnt, gsum / cnt, bs / cnt] : [200, 200, 200],
    cutout: true,
  };
}

/** The photo itself, for when no cutout looks right. */
async function asIs(photo: Photo): Promise<Piece> {
  const { W, H, rgba } = photo;
  let [r, g, b, n] = [0, 0, 0, 0];
  for (let y = Math.round(H * 0.2); y < H * 0.8; y += 3)
    for (let x = Math.round(W * 0.2); x < W * 0.8; x += 3) {
      const i = (y * W + x) * 4;
      [r, g, b, n] = [r + rgba[i], g + rgba[i + 1], b + rgba[i + 2], n + 1];
    }
  return {
    id: `${photo.key}:photo`,
    label: 'Photo as it is',
    blob: encode(photo.canvas, 'image/jpeg', 0.9),
    rgb: n ? [r / n, g / n, b / n] : [200, 200, 200],
    cutout: false,
    photo: photo.index,
  };
}

async function cutAll(photo: Photo, regions: Region[]) {
  const out: Piece[] = [];
  for (const r of regions) out.push(await cut(photo, r));
  return out;
}

/** The pieces in someone's own photo. */
export async function findInPhoto(file: Blob): Promise<Found> {
  const photo = await load(file, 'p');
  const { verdict } = photo;
  const pieces = [...(await cutAll(photo, verdict.regions.slice(0, 5))), await asIs(photo)];
  const sure = verdict.sure && pieces[0].cutout;
  return { sure, pieces, guess: sure ? pieces[0].id : undefined };
}

/**
 * The product in a product page's photos. Checks the photos in gallery order, stopping early at a clean product
 * shot, and cuts the product out of the best one. `hint` is what the product's name says it is.
 */
export async function findInProduct(urls: string[], hint: Hint | undefined, onProgress?: (done: number, total: number) => void): Promise<Found | null> {
  const list = urls.slice(0, MAX_PHOTOS);
  const blobs = list.map(fetchPhoto);
  const checked: { photo: Photo; score: number }[] = [];
  for (let i = 0; i < list.length; i++) {
    onProgress?.(i + 1, list.length);
    const blob = await blobs[i];
    if (!blob) continue;
    try {
      const photo = await load(blob, `p${i}`, hint, i);
      const score = photoScore(photo.verdict, i);
      checked.push({ photo, score });
      if (score >= GOOD_ENOUGH) break;
    } catch {
      /* a photo that can't be decoded or read; try the next */
    }
  }
  if (!checked.length) return null;
  checked.sort((a, b) => b.score - a.score);
  const best = checked[0];
  const sure = best.photo.verdict.sure && best.score >= SURE_SCORE;

  // The best photo's pieces first, then the best guess from the next photos, then the photo as it is.
  const pieces: Piece[] = [];
  for (const [k, c] of checked.slice(0, 3).entries()) {
    const regions = c.photo.verdict.regions.slice(0, k === 0 ? 3 : sure ? 1 : 2);
    for (const r of regions) if (pieces.length < 6) pieces.push(await cut(c.photo, r));
  }
  pieces.push(await asIs(best.photo));
  return { sure: sure && pieces[0].cutout, pieces, guess: best.score >= SURE_SCORE ? pieces[0].id : undefined };
}

/** A store's photo, through Rotation's own image route (store image hosts rarely allow reading them on a canvas). */
export const photoUrl = (url: string) => `/api/image?url=${encodeURIComponent(url)}`;

const fetchPhoto = (url: string) =>
  fetch(photoUrl(url))
    .then((r) => (r.ok ? r.blob() : null))
    .catch(() => null);

/** The product cut out of one photo the person picked from the page, best guess first, then the photo as it is. */
export async function findInProductPhoto(url: string, index: number, hint: Hint | undefined): Promise<Piece[]> {
  const blob = await fetchPhoto(url);
  if (!blob) throw new Error("Couldn't load that photo.");
  const photo = await load(blob, `p${index}`, hint, index);
  return [...(await cutAll(photo, photo.verdict.regions.slice(0, 3))), await asIs(photo)];
}

/** A small JPEG of an image on a white background, as base64, for photo tagging. */
export async function toJpegBase64(blob: Blob, maxSide = 640): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = canvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}

