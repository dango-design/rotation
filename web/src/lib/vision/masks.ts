/* Mask arithmetic for cutting pieces out of photos. Plain typed arrays, no DOM, so it runs in tests too.
   Masks are row-major Float32Arrays of 0..1; images are RGBA Uint8ClampedArrays. */

export type Box = [x0: number, y0: number, x1: number, y1: number];

/** Bilinear resize of a single-channel map. */
export function resize(src: Float32Array, sw: number, sh: number, dw: number, dh: number): Float32Array {
  if (sw === dw && sh === dh) return src.slice();
  const out = new Float32Array(dw * dh);
  const sx = sw / dw;
  const sy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) * sy - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) * sx - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = fx - x0;
      const a = src[y0 * sw + x0] * (1 - tx) + src[y0 * sw + x1] * tx;
      const b = src[y1 * sw + x0] * (1 - tx) + src[y1 * sw + x1] * tx;
      out[y * dw + x] = a * (1 - ty) + b * ty;
    }
  }
  return out;
}

/** Connected regions of a binary mask (8-connected). Labels start at 1; 0 is background. */
export function components(on: Uint8Array, w: number, h: number) {
  const labels = new Int32Array(w * h);
  const sizes: number[] = [0];
  const boxes: Box[] = [[0, 0, 0, 0]];
  const stack = new Int32Array(w * h);
  let next = 1;
  for (let start = 0; start < w * h; start++) {
    if (!on[start] || labels[start]) continue;
    let top = 0;
    stack[top++] = start;
    labels[start] = next;
    let size = 0;
    const box: Box = [w, h, 0, 0];
    while (top) {
      const p = stack[--top];
      size++;
      const x = p % w;
      const y = (p - x) / w;
      if (x < box[0]) box[0] = x;
      if (y < box[1]) box[1] = y;
      if (x > box[2]) box[2] = x;
      if (y > box[3]) box[3] = y;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const q = ny * w + nx;
          if (on[q] && !labels[q]) {
            labels[q] = next;
            stack[top++] = q;
          }
        }
      }
    }
    sizes.push(size);
    boxes.push(box);
    next++;
  }
  return { labels, sizes, boxes, count: next - 1 };
}

/** Grow a binary mask by r cells (square neighborhood). */
export function dilate(on: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return on.slice();
  const rows = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    // Two passes per row: distance to the nearest set cell on the left, then on the right.
    let last = -Infinity;
    for (let x = 0; x < w; x++) {
      if (on[y * w + x]) last = x;
      if (x - last <= r) rows[y * w + x] = 1;
    }
    last = Infinity;
    for (let x = w - 1; x >= 0; x--) {
      if (on[y * w + x]) last = x;
      if (last - x <= r) rows[y * w + x] = 1;
    }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let last = -Infinity;
    for (let y = 0; y < h; y++) {
      if (rows[y * w + x]) last = y;
      if (y - last <= r) out[y * w + x] = 1;
    }
    last = Infinity;
    for (let y = h - 1; y >= 0; y--) {
      if (rows[y * w + x]) last = y;
      if (last - y <= r) out[y * w + x] = 1;
    }
  }
  return out;
}

/** Mean over a (2r+1)² window, clipped at the edges. Separable running sums, O(n). */
function boxMean(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = 0; x <= Math.min(r, w - 1); x++) sum += src[row + x];
    for (let x = 0; x < w; x++) {
      const lo = Math.max(0, x - r);
      const hi = Math.min(w - 1, x + r);
      tmp[row + x] = sum / (hi - lo + 1);
      if (x + r + 1 < w) sum += src[row + x + r + 1];
      if (x - r >= 0) sum -= src[row + x - r];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = 0; y <= Math.min(r, h - 1); y++) sum += tmp[y * w + x];
    for (let y = 0; y < h; y++) {
      const lo = Math.max(0, y - r);
      const hi = Math.min(h - 1, y + r);
      out[y * w + x] = sum / (hi - lo + 1);
      if (y + r + 1 < h) sum += tmp[(y + r + 1) * w + x];
      if (y - r >= 0) sum -= tmp[(y - r) * w + x];
    }
  }
  return out;
}

/**
 * Snap a coarse mask to the photo's edges with a color guided filter (He et al.), computed at the mask's working
 * size and applied at full size (the "fast guided filter"), so a 128×128 garment map follows real fabric edges.
 * `guide` is the working-size RGBA photo (gw×gh) and `p` the mask at the same size. Returns coefficients that
 * `applyGuided` evaluates against the full-size photo.
 */
export function guidedCoefficients(guide: Uint8ClampedArray, p: Float32Array, gw: number, gh: number, r: number, eps: number) {
  const n = gw * gh;
  const I = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) I[c][i] = guide[i * 4 + c] / 255;
  const mean = (a: Float32Array) => boxMean(a, gw, gh, r);
  const prod = (a: Float32Array, b: Float32Array) => {
    const o = new Float32Array(n);
    for (let i = 0; i < n; i++) o[i] = a[i] * b[i];
    return o;
  };
  const mI = I.map(mean);
  const mp = mean(p);
  const cov = I.map((Ic, c) => {
    const m = mean(prod(Ic, p));
    for (let i = 0; i < n; i++) m[i] -= mI[c][i] * mp[i];
    return m;
  });
  const v = (a: number, b: number) => {
    const m = mean(prod(I[a], I[b]));
    for (let i = 0; i < n; i++) m[i] -= mI[a][i] * mI[b][i];
    return m;
  };
  const [rr, rg, rb, gg, gb, bb] = [v(0, 0), v(0, 1), v(0, 2), v(1, 1), v(1, 2), v(2, 2)];
  const A = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const B = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Solve (Σ + εU) a = cov with the inverse of a symmetric 3×3 matrix.
    const s00 = rr[i] + eps, s01 = rg[i], s02 = rb[i], s11 = gg[i] + eps, s12 = gb[i], s22 = bb[i] + eps;
    const c00 = s11 * s22 - s12 * s12, c01 = s02 * s12 - s01 * s22, c02 = s01 * s12 - s02 * s11;
    const c11 = s00 * s22 - s02 * s02, c12 = s01 * s02 - s00 * s12, c22 = s00 * s11 - s01 * s01;
    const det = s00 * c00 + s01 * c01 + s02 * c02 || 1e-12;
    const [x, y, z] = [cov[0][i], cov[1][i], cov[2][i]];
    const a0 = (c00 * x + c01 * y + c02 * z) / det;
    const a1 = (c01 * x + c11 * y + c12 * z) / det;
    const a2 = (c02 * x + c12 * y + c22 * z) / det;
    A[0][i] = a0;
    A[1][i] = a1;
    A[2][i] = a2;
    B[i] = mp[i] - a0 * mI[0][i] - a1 * mI[1][i] - a2 * mI[2][i];
  }
  return { a: A.map(mean), b: mean(B), w: gw, h: gh };
}

/** Evaluate guided-filter coefficients against the full-size photo, giving an alpha per pixel. */
export function applyGuided(coef: ReturnType<typeof guidedCoefficients>, rgba: Uint8ClampedArray, W: number, H: number): Float32Array {
  const { w, h } = coef;
  const up = (m: Float32Array) => resize(m, w, h, W, H);
  const [a0, a1, a2, b] = [up(coef.a[0]), up(coef.a[1]), up(coef.a[2]), up(coef.b)];
  const out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const q = a0[i] * (rgba[i * 4] / 255) + a1[i] * (rgba[i * 4 + 1] / 255) + a2[i] * (rgba[i * 4 + 2] / 255) + b[i];
    out[i] = q < 0 ? 0 : q > 1 ? 1 : q;
  }
  return out;
}

/** Whether the photo's border is one plain color, as on a studio product shot, and that color. */
export function plainBorder(rgba: Uint8ClampedArray, w: number, h: number) {
  const band = Math.max(1, Math.round(Math.min(w, h) * 0.03));
  const px: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (x < band || y < band || x >= w - band || y >= h - band) px.push(y * w + x);
  const med = [0, 1, 2].map((c) => {
    const vals = px.map((p) => rgba[p * 4 + c]).sort((a, b) => a - b);
    return vals[vals.length >> 1];
  });
  let near = 0;
  for (const p of px) {
    const d = Math.abs(rgba[p * 4] - med[0]) + Math.abs(rgba[p * 4 + 1] - med[1]) + Math.abs(rgba[p * 4 + 2] - med[2]);
    if (d < 36) near++;
  }
  const share = near / px.length;
  return { plain: share >= 0.85, share, color: med as [number, number, number] };
}
