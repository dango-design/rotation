import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { dayWear, dayWearId, putOn, settle, takeOff, wornOn, wornOutfits } from './wear';

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

describe('planned days count as worn once they pass', () => {
  const a = { ...items[0], id: 'a', wears: 3, lastWorn: '2026-10-01' };
  const b = { ...items[1], id: 'b', wears: 0, lastWorn: undefined };
  const plan = (date: string, slots: Record<string, string> = { top: 'a', bottom: 'b' }) => ({ date, name: 'Plan', slots });

  it('logs a planned day before today, once, under the day\'s own id', () => {
    const { items: next, added } = settle([a, b], [plan('2026-10-12'), plan('2026-10-14')], [], '2026-10-14');
    expect(added.map((w) => w.id)).toEqual([dayWearId('2026-10-12')]);
    expect(next.map((i) => [i.wears, i.lastWorn])).toEqual([
      [4, '2026-10-12'],
      [1, '2026-10-12'],
    ]);
    expect(settle(next, [plan('2026-10-12')], added, '2026-10-15').added).toEqual([]);
  });

  it('leaves a day already logged as an outfit, or piece by piece', () => {
    const outfit = { id: 'x', date: '2026-10-12', slots: { top: 'a', bottom: 'c' } };
    expect(settle([a, b], [plan('2026-10-12')], [outfit], '2026-10-14').added).toEqual([]);
    const pieces = [
      { id: 'y', date: '2026-10-12', slots: { top: 'a' } },
      { id: 'z', date: '2026-10-12', slots: { bottom: 'b' } },
    ];
    expect(settle([a, b], [plan('2026-10-12')], pieces, '2026-10-14').added).toEqual([]);
  });

  it("still logs a planned day when only one other piece was logged that day", () => {
    const lone = { id: 'y', date: '2026-10-12', slots: { acc: 'c' } };
    expect(settle([a, b], [plan('2026-10-12')], [lone], '2026-10-14').added).toHaveLength(1);
  });
});

describe('taking a wear back', () => {
  const a = { ...items[0], id: 'a', wears: 3, lastWorn: '2026-10-01' };

  it('puts the count and last worn day back as they were', () => {
    const { items: worn, entry } = putOn([a], { id: dayWearId('2026-10-12'), date: '2026-10-12', slots: { top: 'a' } });
    expect(worn[0]).toMatchObject({ wears: 4, lastWorn: '2026-10-12' });
    expect(takeOff(worn, entry, [])[0]).toMatchObject({ wears: 3, lastWorn: '2026-10-01' });
  });

  it('keeps a later last worn day, and falls back to the latest other wear', () => {
    const entry = { id: 'e', date: '2026-10-05', slots: { top: 'a' } };
    expect(takeOff([{ ...a, lastWorn: '2026-10-09' }], entry, [])[0]).toMatchObject({ wears: 2, lastWorn: '2026-10-09' });
    const other = { id: 'o', date: '2026-10-03', slots: { top: 'a' } };
    expect(takeOff([{ ...a, lastWorn: '2026-10-05' }], entry, [other])[0]).toMatchObject({ lastWorn: '2026-10-03' });
    expect(takeOff([{ ...a, lastWorn: '2026-10-05' }], entry, [])[0].lastWorn).toBeUndefined();
  });
});

describe("a day's outfit", () => {
  it("prefers the day's own record, then an outfit, then a lone piece", () => {
    const lone = { id: '1', date: '2026-10-12', slots: { top: 'a' } };
    const outfit = { id: '2', date: '2026-10-12', slots: { top: 'a', bottom: 'b' } };
    const own = { id: dayWearId('2026-10-12'), date: '2026-10-12', slots: { top: 'c', bottom: 'd' } };
    expect(dayWear([lone], '2026-10-12')?.id).toBe('1');
    expect(dayWear([outfit, lone], '2026-10-12')?.id).toBe('2');
    expect(dayWear([own, outfit, lone], '2026-10-12')?.id).toBe(own.id);
  });
});
