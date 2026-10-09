import { describe, expect, it } from 'vitest';
import { colorPieces, lab } from './split';

const W = 64;
const H = 64;

/** A W×H photo painted by a function of (x, y) → [r, g, b], plus the object mask where the painter returns a color. */
function paint(fn: (x: number, y: number) => [number, number, number] | null) {
  const rgba = new Uint8ClampedArray(W * H * 4);
  const object = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = fn(x, y);
      const i = y * W + x;
      const [r, g, b] = c ?? [250, 250, 250];
      rgba.set([r, g, b, 255], i * 4);
      if (c) object[i] = 1;
    }
  return { rgba, object };
}

const count = (m: Uint8Array) => m.reduce((a, v) => a + v, 0);

describe('lab', () => {
  it('maps white and black to the ends of lightness', () => {
    expect(lab(255, 255, 255)[0]).toBeCloseTo(100, 0);
    expect(lab(0, 0, 0)[0]).toBeCloseTo(0, 0);
  });
});

describe('colorPieces', () => {
  it('keeps a single-color piece whole, shading and all', () => {
    const { rgba, object } = paint((x, y) => (x > 8 && x < 56 && y > 8 && y < 56 ? [70 + (x % 7), 90 + y / 4, 140] : null));
    expect(colorPieces(rgba, object, W, H)).toHaveLength(1);
  });

  it('keeps a striped shirt as one piece', () => {
    const { rgba, object } = paint((x, y) => (x > 8 && x < 56 && y > 8 && y < 56 ? (y % 4 < 2 ? [240, 238, 230] : [30, 40, 80]) : null));
    expect(colorPieces(rgba, object, W, H)).toHaveLength(1);
  });

  it('splits a sweater lying on jeans into two pieces', () => {
    // Grey sweater on the left, blue jeans on the right, touching.
    const { rgba, object } = paint((x, y) => (y < 8 || y > 56 || x < 4 || x > 60 ? null : x < 30 ? [150, 150, 148] : [60, 90, 150]));
    const pieces = colorPieces(rgba, object, W, H);
    expect(pieces).toHaveLength(2);
    // Together they cover the object, and each is about half of it.
    expect(count(pieces[0]) + count(pieces[1])).toBe(count(object));
    expect(count(pieces[1]) / count(object)).toBeGreaterThan(0.4);
  });

  it('splits a black hat lying on brown pants, even with shading on the pants', () => {
    const { rgba, object } = paint((x, y) => {
      if (x < 6 || x > 58 || y < 6 || y > 58) return null;
      if ((x - 40) ** 2 + (y - 26) ** 2 < 14 ** 2) return [22, 22, 24];
      const shade = (x + y) % 9 < 4 ? 0 : 25;
      return [110 - shade, 60 - shade / 2, 40 - shade / 2];
    });
    expect(colorPieces(rgba, object, W, H)).toHaveLength(2);
  });

  it('leaves small details, like a logo, as part of the piece', () => {
    const { rgba, object } = paint((x, y) => {
      if (x < 8 || x > 56 || y < 8 || y > 56) return null;
      return x > 28 && x < 34 && y > 20 && y < 26 ? [200, 30, 30] : [235, 235, 230];
    });
    expect(colorPieces(rgba, object, W, H)).toHaveLength(1);
  });
});
