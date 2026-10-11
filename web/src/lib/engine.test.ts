import { describe, expect, it, vi } from 'vitest';
import { CATALOG, pieceById } from './catalog';
import { demoData } from './demo';
import { TYPES } from './catalog-meta';
import { check, duplicate, fitsBoard, isComplete, rankPieces, slotOf, totalOutfits, unlock, whyLine } from './engine';
import { garmentSvg } from './garments';
import type { GarmentType, Item } from './types';

/** The demo closet dates its wears back from the clock, so it's built as of a fixed day; otherwise its wear
    history would depend on the day the tests run. */
const TODAY = '2026-10-07';
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
const { items } = demoData();
vi.useRealTimers();
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

describe('Outfit Unlock on the demo closet', () => {
  it('finds 199 outfits', () => {
    expect(totalOutfits(items)).toBe(199);
  });
  it('light straight chinos unlock 39 outfits', () => {
    expect(unlock(pieceById('p-chino-khaki')!, items)).toBe(39);
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
    expect(whyLine(pieceById('p-chino-khaki')!, items)).toBe("Pairs with 10 of your 10 tops and 4 of your 4 pairs of shoes. You don't own chinos yet.");
  });
});

describe('dresses', () => {
  it('count as complete outfits with shoes', () => {
    expect(totalOutfits([byShort('d1'), byShort('s1')])).toBe(1);
  });
  it('add outfits to the demo closet', () => {
    expect(totalOutfits(items)).toBeGreaterThan(totalOutfits(items.filter((i) => i.cat !== 'dress')));
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

describe('one-pieces, bags and jewelry', () => {
  const make = (type: GarmentType, extra: Partial<Item> = {}): Item => ({
    id: `x-${type}`, name: TYPES[type].label, brand: '', source: 'manual', type, cat: TYPES[type].cat,
    color: '#232323', colorName: 'Black', tone: 'neutral', f: TYPES[type].f, wears: 0, createdAt: '', ...extra,
  });
  it('treats a jumpsuit like a dress: it covers the bottom', () => {
    expect(check([make('jumpsuit'), byShort('b2')]).ok).toBe(false);
    expect(isComplete({ top: 'x-jumpsuit', shoes: byShort('s1').id }, (id) => (id === 'x-jumpsuit' ? make('jumpsuit') : items.find((i) => i.id === id)))).toBe(true);
  });
  it('leaves bags and jewelry out of the dressiness check', () => {
    expect(check([byShort('t6'), make('clutch'), make('necklace', { f: 3 })]).ok).toBe(true);
  });
  it('gives bags and jewelry their own outfit slots', () => {
    expect(slotOf(make('crossbody'))).toBe('bag');
    expect(slotOf(make('earrings'))).toBe('jewelry');
    expect(slotOf(make('belt'))).toBe('acc');
  });
  it('draws every garment type', () => {
    const tee = garmentSvg('tee', '#232323');
    for (const t of Object.keys(TYPES).filter((t) => t !== 'tee')) expect(garmentSvg(t, '#232323')).not.toBe(tee);
  });
});
