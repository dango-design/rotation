import { describe, expect, it } from 'vitest';
import { CATALOG, pieceById } from './catalog';
import { demoData } from './demo';
import { check, duplicate, fitsBoard, rankPieces, totalOutfits, unlock, whyLine } from './engine';
import { nextStep, piecesFor } from './planning';
import { RANGE } from './today';
import { daysBetween } from './dates';
import type { Item } from './types';

const { items } = demoData();
const byShort = (s: string) => items.find((i) => i.id === `demo-${s}`)!;

describe('pairing rules', () => {
  it('rejects two different non-neutral tones', () => {
    expect(check([byShort('t8'), byShort('t9')]).ok).toBe(false);
  });
  it('allows harmonious tones', () => {
    const rust = { ...byShort('a2'), cat: 'top' as const };
    expect(check([rust, byShort('t8')]).ok).toBe(true);
  });
  it('rejects same-wash denim on denim', () => {
    expect(check([byShort('o1'), byShort('b1')]).ok).toBe(false);
    expect(check([byShort('o1'), byShort('b2')]).ok).toBe(true);
  });
  it('rejects formality gaps over one step', () => {
    expect(check([byShort('o4'), byShort('b4')]).ok).toBe(false);
  });
  it('does not let a dress share an outfit with a bottom', () => {
    expect(check([pieceById('p-dress-black')!, byShort('b2')]).ok).toBe(false);
  });
});

describe('Outfit Unlock on the demo closet (matches the prototype)', () => {
  it('finds 100 outfits', () => {
    expect(totalOutfits(items)).toBe(100);
  });
  it('light straight chinos unlock 26 outfits', () => {
    expect(unlock(pieceById('p-chino-khaki')!, items)).toBe(26);
  });
  it('layers that add nothing score zero', () => {
    expect(unlock(pieceById('p-chore-olive')!, items)).toBe(0);
    expect(unlock(pieceById('p-coat-camel')!, items)).toBe(0);
  });
  it('ranks the chinos first and never ranks an exact duplicate', () => {
    const picks = rankPieces(CATALOG, items);
    expect(picks[0].piece.id).toBe('p-chino-khaki');
    expect(picks.find((p) => p.piece.id === 'p-hoodie-grey')!.score).toBe(0);
  });
  it('flags exact duplicates and close cousins', () => {
    expect(duplicate(pieceById('p-hoodie-grey')!, items).level).toBe(1);
    expect(duplicate(pieceById('p-oxford-white')!, items).level).toBe(0.35);
  });
  it('explains a pick in plain words', () => {
    expect(whyLine(pieceById('p-chino-khaki')!, items)).toBe("Pairs with 9 of your 9 tops and 3 of your 3 pairs of shoes. You don't own chinos yet.");
  });
});

describe('dresses', () => {
  it('count as complete outfits with shoes', () => {
    const dress: Item = { ...pieceById('p-dress-black')!, brand: 'Zara', source: 'manual', wears: 0, createdAt: '' };
    expect(totalOutfits([...items, dress])).toBeGreaterThan(100);
  });
});

describe('fitting pieces to the board', () => {
  const byId = (id: string) => items.find((i) => i.id === id) ?? pieceById(id);
  it('rejects a piece that clashes with the rest of the board', () => {
    expect(fitsBoard(byShort('o1'), { bottom: byShort('b1').id }, byId)).toBe(false);
    expect(fitsBoard(byShort('o1'), { bottom: byShort('b2').id }, byId)).toBe(true);
  });
  it('ignores the piece it would replace', () => {
    expect(fitsBoard(byShort('b2'), { bottom: byShort('b1').id, outer: byShort('o1').id }, byId)).toBe(true);
  });
  it('lets a dress replace the bottom', () => {
    expect(fitsBoard(pieceById('p-dress-black')!, { bottom: byShort('b2').id }, byId)).toBe(true);
  });
});

describe('planning a day piece by piece', () => {
  const byId = (id: string) => items.find((i) => i.id === id) ?? pieceById(id);
  const opts = { occasion: 'work' as const, today: '2026-10-07' };
  it('suggests two pieces that work with the picks so far', () => {
    const slots = { top: byShort('t8').id };
    const rows = piecesFor('bottom', slots, items, byId, opts);
    const suggested = rows.filter((r) => r.suggested);
    expect(suggested).toHaveLength(2);
    expect(suggested.every((r) => r.fits)).toBe(true);
    expect(rows.findIndex((r) => !r.fits)).toBeGreaterThan(rows.findLastIndex((r) => r.fits));
  });
  it('asks for the required pieces first, then the optional ones', () => {
    expect(nextStep({}, byId)).toBe('top');
    expect(nextStep({ top: byShort('t8').id }, byId)).toBe('bottom');
    expect(nextStep({ top: byShort('t8').id, bottom: byShort('b2').id, shoes: byShort('s1').id }, byId)).toBe('outer');
  });
  it('skips the bottom when a dress is picked', () => {
    expect(nextStep({ top: 'p-dress-black' }, byId)).toBe('shoes');
  });
});

describe('the occasion shapes suggestions', () => {
  const byId = (id: string) => items.find((i) => i.id === id) ?? pieceById(id);
  const top = (occasion: 'casual' | 'work' | 'dressy') =>
    piecesFor('top', {}, items, byId, { occasion, today: '2026-10-07' }).filter((r) => r.suggested).map((r) => r.item.f);
  it("suggests tops at the occasion's own formality", () => {
    for (const occasion of ['casual', 'work', 'dressy'] as const) {
      const [lo, hi] = RANGE[occasion];
      const fs = top(occasion);
      if (occasion !== 'dressy') expect(fs).toHaveLength(2);
      expect(fs.every((f) => f >= lo && f <= hi) || occasion === 'dressy').toBe(true);
    }
    expect(top('casual')).not.toEqual(top('work'));
  });
});

describe('suggestions follow the season, not just the calendar', () => {
  const byId = (id: string) => items.find((i) => i.id === id) ?? pieceById(id);
  const suggestedTops = (temp?: number) =>
    piecesFor('top', {}, items, byId, { occasion: 'work', today: '2026-10-07', temp }).filter((r) => r.suggested).map((r) => r.item);
  it("doesn't push a sweater on a hot day just because it hasn't been worn", () => {
    expect(suggestedTops(84).some((i) => i.type === 'sweater')).toBe(false);
  });
  it('suggests something warm on a cold day', () => {
    expect(suggestedTops(48).some((i) => i.type === 'sweater')).toBe(true);
  });
  it("doesn't suggest a piece worn this week", () => {
    expect(suggestedTops().every((i) => !i.lastWorn || daysBetween(i.lastWorn, '2026-10-07') >= 7)).toBe(true);
  });
});
