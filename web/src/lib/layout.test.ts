import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { MIN_W, resizeAround, resolveLayout, restack, stackOrder, trueWidth } from './layout';

const { items } = demoData();
const byShort = (s: string) => items.find((i) => i.id === `demo-${s}`)!;
const byId = (id: string) => items.find((i) => i.id === id);

describe('true-to-life sizes', () => {
  it('draws jeans longer than a tee, a tee bigger than shoes, shoes bigger than earrings', () => {
    expect(trueWidth('jeans')).toBeGreaterThan(trueWidth('tee'));
    expect(trueWidth('tee')).toBeGreaterThan(trueWidth('sneakers'));
    expect(trueWidth('sneakers')).toBeGreaterThan(trueWidth('earrings'));
  });
  it('keeps tiny pieces big enough to see and grab', () => {
    expect(trueWidth('earrings')).toBe(MIN_W);
    expect(trueWidth('bracelet')).toBe(MIN_W);
  });
});

describe('arranging an outfit', () => {
  const slots = { top: byShort('t1').id, bottom: byShort('b1').id, shoes: byShort('s1').id };
  it('places every piece inside the canvas by default', () => {
    const l = resolveLayout(slots, undefined, byId);
    for (const p of Object.values(l)) {
      expect(p!.x).toBeGreaterThanOrEqual(0);
      expect(p!.x + p!.w).toBeLessThanOrEqual(100);
    }
    expect(stackOrder(l)).toEqual(['top', 'bottom', 'shoes']);
  });
  it('keeps a hand-placed piece where it was put', () => {
    const l = resolveLayout(slots, { top: { id: slots.top, x: 5, y: 5, w: 30, z: 9 } }, byId);
    expect(l.top).toEqual({ id: slots.top, x: 5, y: 5, w: 30, z: 9 });
  });
  it('gives a swapped piece the same spot at its own true size', () => {
    const l = resolveLayout({ ...slots, bottom: byShort('b4').id }, { bottom: { id: slots.bottom, x: 40, y: 40, w: 40, z: 1 } }, byId);
    expect(l.bottom!.w).toBe(trueWidth('joggers'));
    expect(l.bottom!.x + l.bottom!.w / 2).toBeCloseTo(60);
  });
  it('moves pieces through the stack', () => {
    const l = resolveLayout(slots, undefined, byId);
    expect(stackOrder(restack(l, 'top', 'front'))).toEqual(['bottom', 'shoes', 'top']);
    expect(stackOrder(restack(l, 'shoes', 'back'))).toEqual(['shoes', 'top', 'bottom']);
    expect(stackOrder(restack(l, 'top', 'forward'))).toEqual(['bottom', 'top', 'shoes']);
  });
  it('resizes around the centre', () => {
    const r = resizeAround({ id: 'x', x: 10, y: 10, w: 20, z: 0 }, 40);
    expect(r.x + r.w / 2).toBeCloseTo(20);
  });
});
