import { describe, expect, it } from 'vitest';
import { applyGuided, components, dilate, guidedCoefficients, plainBorder, resize } from './masks';

describe('components', () => {
  it('labels separate blobs with their sizes and boxes', () => {
    // 6×4: a 2×2 blob top-left and a diagonal pair (8-connected) bottom-right.
    const on = Uint8Array.from([1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]);
    const c = components(on, 6, 4);
    expect(c.count).toBe(2);
    expect(c.sizes.slice(1)).toEqual([4, 2]);
    expect(c.boxes[2]).toEqual([4, 2, 5, 3]);
  });
});

describe('dilate', () => {
  it('grows a mask by r cells in every direction', () => {
    const on = new Uint8Array(25);
    on[12] = 1;
    expect(Array.from(dilate(on, 5, 5, 1))).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]);
  });
});

describe('resize', () => {
  it('keeps a constant map constant and interpolates a ramp', () => {
    expect(Array.from(resize(new Float32Array(4).fill(0.5), 2, 2, 3, 3))).toEqual(new Array(9).fill(0.5));
    const up = resize(Float32Array.from([0, 1]), 2, 1, 4, 1);
    expect(Array.from(up).map((v) => +v.toFixed(2))).toEqual([0, 0.25, 0.75, 1]);
  });
});

describe('guided filter', () => {
  it('snaps a blurry mask to the edge in the photo', () => {
    // Photo: dark left half, light right half. Mask: a soft ramp across the middle.
    const W = 40;
    const H = 10;
    const rgba = new Uint8ClampedArray(W * H * 4);
    const p = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const v = x < 20 ? 30 : 220;
        rgba.set([v, v, v, 255], (y * W + x) * 4);
        p[y * W + x] = Math.min(1, Math.max(0, (x - 12) / 16));
      }
    const alpha = applyGuided(guidedCoefficients(rgba, p, W, H, 4, 1e-4), rgba, W, H);
    const row = (m: Float32Array, x: number) => m[5 * W + x];
    // Across the photo's edge the mask now jumps instead of ramping.
    expect(row(alpha, 20) - row(alpha, 19)).toBeGreaterThan(0.3);
    expect(row(p, 20) - row(p, 19)).toBeLessThan(0.1);
  });
});

describe('plainBorder', () => {
  it('tells a studio background from a busy one', () => {
    const W = 50;
    const studio = new Uint8ClampedArray(W * W * 4).fill(245);
    expect(plainBorder(studio, W, W).plain).toBe(true);
    const busy = studio.map((v, i) => (i % 4 === 3 ? 255 : (i * 37) % 256));
    expect(plainBorder(busy, W, W).plain).toBe(false);
  });
});
