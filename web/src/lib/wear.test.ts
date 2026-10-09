import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { wornOn } from './wear';

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
