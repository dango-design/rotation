import { describe, expect, it } from 'vitest';
import { decide, isWorn, LABEL_GROUP, PARTS, photoScore, type Maps, type Verdict } from './analyze';

// Parser labels (ATR).
const BG = 0, HAIR = 2, TOP = 4, PANTS = 6, DRESS = 7, SHOE = 9, FACE = 11, ARM = 14;
const N = 40;

/**
 * Model outputs for a synthetic N×N photo. `label` paints parser labels; `salient` marks what the outline model
 * sees (default: everything not background); `color` paints the photo.
 */
function maps(label: (x: number, y: number) => number, opts: { salient?: (x: number, y: number) => boolean; color?: (x: number, y: number) => [number, number, number]; plain?: boolean } = {}): Maps {
  const n = N * N;
  const labels = new Uint8Array(n);
  const prob = Object.fromEntries(PARTS.map((p) => [p, new Float32Array(n)])) as Maps['prob'];
  const salient = new Float32Array(n);
  const rgba = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const l = label(x, y);
      labels[i] = l;
      const g = LABEL_GROUP[l];
      if (g in prob) prob[g as keyof Maps['prob']][i] = 0.95;
      salient[i] = (opts.salient ? opts.salient(x, y) : l !== BG) ? 1 : 0;
      rgba.set([...(opts.color?.(x, y) ?? [120, 120, 120]), 255], i * 4);
    }
  return { w: N, h: N, labels, prob, salient, rgba, plain: opts.plain ?? true };
}

const box = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) => x >= x0 && x < x1 && y >= y0 && y < y1;
const ids = (v: Verdict) => v.regions.map((r) => r.part ?? r.label);

/** Someone in a top and pants, with face, hair and arms. */
const outfit = (x: number, y: number) =>
  box(16, 2, 24, 6)(x, y) ? HAIR : box(16, 6, 24, 10)(x, y) ? FACE : box(10, 10, 14, 20)(x, y) || box(26, 10, 30, 20)(x, y) ? ARM : box(14, 10, 26, 20)(x, y) ? TOP : box(14, 20, 26, 36)(x, y) ? PANTS : box(14, 36, 26, 39)(x, y) ? SHOE : BG;

describe('decide: photos of someone wearing the pieces', () => {
  it('asks which piece when the whole outfit shows', () => {
    const v = decide(maps(outfit));
    expect(v.kind).toBe('worn');
    expect(v.sure).toBe(false);
    expect(ids(v)).toEqual(['bottom', 'top', 'shoes']);
  });

  it('is sure when the product name says which piece', () => {
    const v = decide(maps(outfit), { part: 'top', type: 'shirt' });
    expect(v).toMatchObject({ kind: 'worn', sure: true, matchesHint: true });
    expect(ids(v)[0]).toBe('top');
  });

  it('is sure when one piece fills the photo', () => {
    // A close crop of a shirt, with a sliver of pants at the bottom.
    const v = decide(maps((x, y) => (box(14, 0, 26, 5)(x, y) ? FACE : box(2, 5, 38, 37)(x, y) ? TOP : y >= 37 ? PANTS : BG)));
    expect(v).toMatchObject({ kind: 'worn', sure: true });
    expect(ids(v)[0]).toBe('top');
  });

  it('cuts a dress the parser split into a top and a skirt', () => {
    const v = decide(maps(outfit), { part: 'dress' });
    expect(v.sure).toBe(true);
    expect(v.regions[0].part).toBe('dress');
    expect(v.regions[0].area).toBeCloseTo((12 * 10 + 12 * 16) / (N * N), 2);
  });

  it('finds a dress the parser labeled as a dress', () => {
    const v = decide(maps((x, y) => (box(16, 2, 24, 8)(x, y) ? FACE : box(12, 8, 28, 36)(x, y) ? DRESS : BG)));
    expect(v).toMatchObject({ kind: 'worn', sure: true });
    expect(ids(v)).toEqual(['dress']);
  });
});

/** A full-length shot: a small head over a jacket, pants and shoes, with no other skin showing. */
const fullLength = (x: number, y: number) =>
  box(19, 1, 21, 3)(x, y) ? HAIR : box(19, 3, 21, 5)(x, y) ? FACE : box(16, 5, 24, 16)(x, y) ? TOP : box(17, 16, 23, 34)(x, y) ? PANTS : box(17, 34, 23, 36)(x, y) ? SHOE : BG;

/** A close-up from the waist down that ends mid-leg, so the pants run off the bottom of the photo. */
const waistDown = (x: number, y: number) => (box(12, 0, 28, 6)(x, y) ? TOP : box(16, 6, 18, 9)(x, y) ? ARM : box(12, 6, 28, 40)(x, y) ? PANTS : BG);

describe('decide: full-length shots and close-ups', () => {
  it('treats a full-length shot as someone wearing the pieces, though little skin shows', () => {
    expect(isWorn(maps(fullLength))).toBe(true);
    const v = decide(maps(fullLength), { part: 'bottom', type: 'chinos' });
    expect(v).toMatchObject({ kind: 'worn', sure: true, matchesHint: true });
    expect(ids(v)[0]).toBe('bottom');
  });

  it("doesn't mistake a lone garment for someone wearing it", () => {
    expect(isWorn(maps((x, y) => (box(8, 8, 32, 32)(x, y) ? TOP : BG)))).toBe(false);
  });

  it('treats a waist-down close-up as someone wearing the pieces, from the hands alone', () => {
    expect(isWorn(maps(waistDown))).toBe(true);
  });

  it('marks a piece the photo cuts off', () => {
    const v = decide(maps(waistDown), { part: 'bottom' });
    expect(v).toMatchObject({ kind: 'worn', matchesHint: true });
    expect(v.regions[0]).toMatchObject({ part: 'bottom', clipped: true });
    expect(decide(maps(fullLength), { part: 'bottom' }).regions[0].clipped).toBe(false);
  });
});

describe('decide: photos of pieces on their own', () => {
  it('is sure about one piece on a plain background, ignoring what the parser calls it', () => {
    // The parser often mislabels product shots; a shoe here is called pants and a top.
    const v = decide(maps((x, y) => (box(8, 16, 32, 22)(x, y) ? TOP : box(8, 22, 32, 26)(x, y) ? PANTS : BG)), { part: 'shoes', type: 'sneakers' });
    expect(v).toMatchObject({ kind: 'single', sure: true });
    expect(v.regions).toHaveLength(1);
    expect(v.regions[0]).toMatchObject({ id: 'whole', part: 'shoes', whole: true });
  });

  it('asks when there are separate pieces', () => {
    const v = decide(maps((x, y) => (box(2, 2, 18, 18)(x, y) ? TOP : box(22, 2, 38, 38)(x, y) ? PANTS : BG)));
    expect(v).toMatchObject({ kind: 'several', sure: false });
    expect(ids(v)).toEqual(['Piece 1', 'Piece 2']);
  });

  it('leaves out props the parser sees as background', () => {
    // A sweater and a plant: the outline model sees both, the parser only the sweater.
    const v = decide(maps((x, y) => (box(4, 4, 24, 24)(x, y) ? TOP : BG), { salient: (x, y) => box(4, 4, 24, 24)(x, y) || box(28, 6, 36, 34)(x, y) }));
    expect(v).toMatchObject({ kind: 'single', sure: true });
    expect(v.regions[0].label).toBe('Whole piece');
    expect(v.regions[0].area).toBeCloseTo(400 / (N * N), 2);
    expect(v.regions).toHaveLength(2);
  });

  it('asks when touching pieces have different colors, offering them together and apart', () => {
    const v = decide(
      maps((x, y) => (box(4, 4, 36, 36)(x, y) ? TOP : BG), { color: (x) => (x < 20 ? [150, 150, 148] : [60, 90, 150]) }),
    );
    expect(v).toMatchObject({ kind: 'several', sure: false });
    expect(ids(v)).toEqual(['As one piece', 'Piece 1', 'Piece 2']);
  });

  it('splits only the object that holds pieces of different colors', () => {
    // A hat lying on pants (one object, two colors) and a pair of shoes on their own.
    const v = decide(
      maps((x, y) => (box(2, 2, 24, 38)(x, y) ? PANTS : box(28, 10, 38, 30)(x, y) ? SHOE : BG), { color: (x, y) => (box(4, 4, 16, 16)(x, y) ? [20, 20, 22] : [110, 60, 40]) }),
    );
    expect(ids(v)).toEqual(['As one piece', 'Piece 1', 'Piece 2', 'Piece 3']);
    expect(v.regions.filter((r) => r.together)).toHaveLength(1);
  });

  it("doesn't split a product shot from a product page by color", () => {
    const v = decide(maps((x, y) => (box(4, 4, 36, 36)(x, y) ? TOP : BG), { color: (x) => (x < 20 ? [150, 150, 148] : [60, 90, 150]) }), { part: 'top' });
    expect(v).toMatchObject({ kind: 'single', sure: true });
  });

  it('finds nothing in an empty photo or a close-up that fills the frame', () => {
    expect(decide(maps(() => BG)).kind).toBe('none');
    expect(decide(maps(() => TOP)).kind).toBe('none');
  });
});

describe('photoScore', () => {
  const productShot = decide(maps((x, y) => (box(8, 8, 32, 32)(x, y) ? TOP : BG)), { part: 'top' });
  const modelWearingIt = decide(maps(outfit), { part: 'top' });
  const modelWearingOther = decide(maps(outfit), { part: 'shoes' });
  const busy = decide(maps(outfit));

  it('prefers a product shot, then a model wearing the named piece', () => {
    expect(photoScore(productShot, 2)).toBeGreaterThan(photoScore(modelWearingIt, 0));
    expect(photoScore(modelWearingIt, 0)).toBeGreaterThan(photoScore(busy, 0));
  });

  it('prefers earlier gallery photos when they are as good', () => {
    expect(photoScore(productShot, 0)).toBeGreaterThan(photoScore(productShot, 1));
  });

  it('ranks a product shot on a busy background below one on a plain background', () => {
    const scene = decide(maps((x, y) => (box(8, 8, 32, 32)(x, y) ? TOP : BG), { plain: false }), { part: 'top' });
    expect(photoScore(productShot, 0)).toBeGreaterThan(photoScore(scene, 0));
  });

  it('ranks a photo that cuts the piece off below one that shows all of it', () => {
    const cut = decide(maps(waistDown), { part: 'bottom' });
    const whole = decide(maps(fullLength), { part: 'bottom' });
    expect(photoScore(whole, 3)).toBeGreaterThan(photoScore(cut, 0));
  });

  it('prefers a product shot even at the end of the gallery', () => {
    expect(photoScore(productShot, 7)).toBeGreaterThan(photoScore(modelWearingIt, 0));
    expect(photoScore(productShot, 7)).toBeGreaterThan(photoScore(decide(maps(fullLength), { part: 'bottom' }), 0));
  });

  it('never picks a photo with nothing in it', () => {
    expect(photoScore(decide(maps(() => BG)), 0)).toBe(-Infinity);
    expect(modelWearingOther.matchesHint).toBe(true);
  });
});
