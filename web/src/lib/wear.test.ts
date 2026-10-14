import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { wornOn, wornOutfits } from './wear';

const { items } = demoData();
const tee = { ...items[0], wears: 4, lastWorn: '2026-10-08' };

describe('logging a wear', () => {
  it('moves last worn forward to a later day', () => {
    expect(wornOn(tee, '2026-10-09')).toMatchObject({ wears: 5, lastWorn: '2026-10-09' });
  });
  it('counts an earlier day without moving last worn back', () => {
    expect(wornOn(tee, '2026-10-05')).toMatchObject({ wears: 5, lastWorn: '2026-10-08' });
  });
  it('sets last worn the first time a piece is worn', () => {
    expect(wornOn({ ...tee, wears: 0, lastWorn: undefined }, '2026-10-05')).toMatchObject({ wears: 1, lastWorn: '2026-10-05' });
  });
});

describe('outfits worn before', () => {
  const w = (id: string, date: string, slots: Record<string, string>) => ({ id, date, slots });
  it('lists each set of pieces once, most recent first, with how often it was worn', () => {
    const list = wornOutfits(
      [w('1', '2026-10-01', { top: 'a', bottom: 'b' }), w('2', '2026-10-05', { top: 'c', bottom: 'd' }), w('3', '2026-10-07', { bottom: 'b', top: 'a' })],
      [],
    );
    expect(list.map((o) => [o.slots.top, o.last, o.times])).toEqual([
      ['a', '2026-10-07', 2],
      ['c', '2026-10-05', 1],
    ]);
  });
  it('leaves out a single piece logged on its own', () => {
    expect(wornOutfits([w('1', '2026-10-01', { top: 'a' })], [])).toEqual([]);
  });
  it('keeps the name of the plan it was worn from', () => {
    const [o] = wornOutfits([w('1', '2026-10-01', { top: 'a', bottom: 'b' })], [{ date: '2026-10-01', name: 'Brunch', slots: {} }]);
    expect(o.name).toBe('Brunch');
  });
});
