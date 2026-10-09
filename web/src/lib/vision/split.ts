/* Splits one outlined object into pieces of different colors, for flat lays where the pieces touch (a sweater lying
   on jeans). Texture and stripes are blurred away first, so a striped shirt stays one piece. A two-tone piece, like a
   sneaker with a white sole, can split too; that only means the person is asked, with the whole piece offered first. */

import { components } from './masks';

/** sRGB (0..255) to CIE Lab. */
export function lab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** Lightness counts for less than hue: folds and shadows change it across one piece. */
const L_WEIGHT = 0.6;
/** Colors closer than this (ΔE) are one piece. */
const SAME = 16;
/** A piece needs this share of the object. */
const MIN_SHARE = 0.12;

/**
 * Partition the cells of `object` (w×h) into pieces of distinct color. `rgba` is the photo at the same size.
 * Returns one mask per piece, largest first; a single mask means the object looks like one piece.
 */
export function colorPieces(rgba: Uint8ClampedArray, object: Uint8Array, w: number, h: number): Uint8Array[] {
  const n = w * h;
  const idx: number[] = [];
  for (let i = 0; i < n; i++) if (object[i]) idx.push(i);
  if (idx.length < 50) return [object];

  // Blur within the object (radius 2) so stripes, prints and fabric texture average out.
  const feats = new Float32Array(n * 3);
  for (const i of idx) {
    const x = i % w;
    const y = (i - x) / w;
    let [r, g, b, k] = [0, 0, 0, 0];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !object[ny * w + nx]) continue;
        const j = (ny * w + nx) * 4;
        [r, g, b, k] = [r + rgba[j], g + rgba[j + 1], b + rgba[j + 2], k + 1];
      }
    const [L, A, B] = lab(r / k, g / k, b / k);
    feats.set([L * L_WEIGHT, A, B], i * 3);
  }

  // k-means with farthest-point seeds (deterministic), k = 4.
  const dist = (i: number, c: number[]) => (feats[i * 3] - c[0]) ** 2 + (feats[i * 3 + 1] - c[1]) ** 2 + (feats[i * 3 + 2] - c[2]) ** 2;
  const mean = [0, 0, 0];
  for (const i of idx) for (let d = 0; d < 3; d++) mean[d] += feats[i * 3 + d] / idx.length;
  const centers: number[][] = [];
  let far = idx[0];
  for (const i of idx) if (dist(i, mean) > dist(far, mean)) far = i;
  centers.push([...feats.subarray(far * 3, far * 3 + 3)]);
  while (centers.length < 4) {
    let best = idx[0];
    let bestD = -1;
    for (const i of idx) {
      const d = Math.min(...centers.map((c) => dist(i, c)));
      if (d > bestD) [best, bestD] = [i, d];
    }
    if (bestD < SAME * SAME) break;
    centers.push([...feats.subarray(best * 3, best * 3 + 3)]);
  }
  const label = new Int8Array(n).fill(-1);
  const counts = centers.map(() => 0);
  for (let iter = 0; iter < 10; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    counts.fill(0);
    for (const i of idx) {
      let k = 0;
      for (let c = 1; c < centers.length; c++) if (dist(i, centers[c]) < dist(i, centers[k])) k = c;
      label[i] = k;
      for (let d = 0; d < 3; d++) sums[k][d] += feats[i * 3 + d];
      counts[k]++;
    }
    centers.forEach((c, k) => counts[k] && c.splice(0, 3, ...sums[k].map((v) => v / counts[k])));
  }

  // Merge clusters of nearly the same color, closest pair first, each merge moving to the weighted mean. A small
  // cluster of blended edge colors joins one side instead of bridging two different pieces.
  const groups = centers.map((c, k) => ({ c, n: counts[k], members: [k] })).filter((g) => g.n);
  for (;;) {
    let best: [number, number] | undefined;
    let bestD = SAME;
    for (let a = 0; a < groups.length; a++)
      for (let b = a + 1; b < groups.length; b++) {
        const d = Math.hypot(groups[a].c[0] - groups[b].c[0], groups[a].c[1] - groups[b].c[1], groups[a].c[2] - groups[b].c[2]);
        if (d < bestD) [best, bestD] = [[a, b], d];
      }
    if (!best) break;
    const [ga, gb] = [groups[best[0]], groups[best[1]]];
    const total = ga.n + gb.n;
    ga.c = ga.c.map((v, d) => (v * ga.n + gb.c[d] * gb.n) / total);
    ga.n = total;
    ga.members.push(...gb.members);
    groups.splice(best[1], 1);
  }
  const groupOf = new Int8Array(centers.length);
  groups.forEach((g, gi) => g.members.forEach((k) => (groupOf[k] = gi)));
  for (const i of idx) label[i] = groupOf[label[i]];

  // Pieces are big connected areas of one color; small areas join the nearest piece.
  const seeds: Uint8Array[] = [];
  for (const k of new Set(idx.map((i) => label[i]))) {
    const on = new Uint8Array(n);
    for (const i of idx) if (label[i] === k) on[i] = 1;
    const c = components(on, w, h);
    c.sizes.forEach((s, l) => {
      if (l === 0 || s < MIN_SHARE * idx.length) return;
      const m = new Uint8Array(n);
      for (const i of idx) if (c.labels[i] === l) m[i] = 1;
      seeds.push(m);
    });
  }
  if (seeds.length < 2) return [object];

  // Grow the pieces over the rest of the object (breadth-first), so together they cover it.
  const owner = new Int16Array(n).fill(-1);
  let frontier: number[] = [];
  seeds.forEach((m, s) => {
    for (const i of idx) {
      if (!m[i] || owner[i] >= 0) continue;
      owner[i] = s;
      frontier.push(i);
    }
  });
  while (frontier.length) {
    const next: number[] = [];
    for (const p of frontier) {
      const x = p % w;
      for (const q of [p - w, p + w, x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1]) {
        if (q < 0 || q >= n || !object[q] || owner[q] >= 0) continue;
        owner[q] = owner[p];
        next.push(q);
      }
    }
    frontier = next;
  }
  const pieces = seeds.map((_, s) => {
    const m = new Uint8Array(n);
    for (const i of idx) if (owner[i] === s) m[i] = 1;
    return m;
  });
  const size = (m: Uint8Array) => m.reduce((a, v) => a + v, 0);
  return pieces.sort((a, b) => size(b) - size(a));
}
