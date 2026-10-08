import { describe, expect, it } from 'vitest';
import { CATALOG, pieceById } from './catalog';
import { demoData } from './demo';
import { check, duplicate, fitsBoard, rankPieces, totalOutfits, unlock, whyLine } from './engine';
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
