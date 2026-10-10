import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { ASPECT, contentBox, dropAt, EXPORT_H, EXPORT_W, FRAME, heightOf, MIN_W, resizeAround, resolveLayout, restack, stackOrder, trueWidth } from './layout';

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
    expect(trueWidth('bracelet')).toBeCloseTo(MIN_W);
    expect(trueWidth('earrings')).toBeGreaterThanOrEqual(MIN_W);
  });
});

describe('arranging an outfit', () => {
  const slots = { top: byShort('t1').id, bottom: byShort('b1').id, shoes: byShort('s1').id };
  it('places every piece inside the canvas by default', () => {
    const l = resolveLayout(slots, undefined, byId);
    for (const p of Object.values(l)) {
      expect(p!.x).toBeGreaterThanOrEqual(0);
      expect(p!.x + p!.w).toBeLessThanOrEqual(100);
      expect(p!.y).toBeGreaterThanOrEqual(0);
      expect(p!.y + heightOf(p!.w)).toBeLessThanOrEqual(100);
    }
    expect(stackOrder(l)).toEqual(['top', 'bottom', 'shoes']);
  });
  it('keeps a hand-placed piece where it was put', () => {
    const l = resolveLayout(slots, { top: { id: slots.top, x: 5, y: 5, w: 30, z: 9, v: FRAME } }, byId);
    expect(l.top).toEqual({ id: slots.top, x: 5, y: 5, w: 30, z: 9, v: FRAME });
  });
  it('gives a swapped piece the same spot at its own true size', () => {
    const l = resolveLayout({ ...slots, bottom: byShort('b4').id }, { bottom: { id: slots.bottom, x: 30, y: 40, w: 40, z: 1, v: FRAME } }, byId);
    expect(l.bottom!.w).toBe(trueWidth('joggers'));
    expect(l.bottom!.x + l.bottom!.w / 2).toBeCloseTo(50);
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

describe('the phone-shaped canvas', () => {
  const slots = { top: byShort('t1').id, bottom: byShort('b1').id, shoes: byShort('s1').id };
  it('is the shape of the exported image', () => {
    expect(ASPECT).toBeCloseTo(EXPORT_H / EXPORT_W);
    expect(EXPORT_W / EXPORT_H).toBeCloseTo(9 / 19.5, 2);
  });
  it('lays a fresh outfit out top to bottom, the way it is worn', () => {
    const l = resolveLayout(slots, undefined, byId);
    expect(l.top!.y).toBeLessThan(l.bottom!.y);
    expect(l.bottom!.y).toBeLessThan(l.shoes!.y);
  });
  it('moves an outfit arranged on the square canvas to the middle of the phone canvas, same size across', () => {
    // Centred on the old, nearly square canvas: 30% wide, so 30 / 1.02 % tall.
    const old = { id: slots.top, x: 35, y: 50 - 30 / 1.02 / 2, w: 30, z: 0 };
    const p = resolveLayout(slots, { top: old }, byId).top!;
    expect(p).toMatchObject({ x: 35, w: 30, v: FRAME });
    expect(p.y + heightOf(p.w) / 2).toBeCloseTo(50);
    // Moved once: the next time it's drawn it stays put.
    expect(resolveLayout(slots, { top: p }, byId).top).toEqual(p);
  });
  it('drops a piece centred where it landed, on the phone canvas', () => {
    const p = dropAt('x', 'tee', 3, { x: 50, y: 50 });
    expect(p.v).toBe(FRAME);
    expect(p.x + p.w / 2).toBeCloseTo(50);
    expect(p.y + heightOf(p.w) / 2).toBeCloseTo(50);
  });
  it('finds the part of the canvas the pieces cover, for thumbnails', () => {
    const b = contentBox({ top: { id: 'a', x: 20, y: 10, w: 40, z: 0, v: FRAME } }, 0);
    expect(b).toMatchObject({ x: 20, w: 40, h: 40 });
    expect(b.y).toBeCloseTo(10 * ASPECT);
    expect(contentBox({})).toEqual({ x: 0, y: 0, w: 100, h: 100 * ASPECT });
  });
});
