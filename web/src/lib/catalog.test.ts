import { describe, expect, it, vi } from 'vitest';
import { pieceById, sizeHint } from './catalog';
import { demoData } from './demo';

vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-07T12:00:00'));
const { items } = demoData();
vi.useRealTimers();

describe('size hints', () => {
  const chinos = pieceById('p-chino-khaki')!;
  it('uses the size bought at that store', () => {
    expect(sizeHint('Gap', chinos, items)).toBe('Your size: 32 × 30, from your closet');
  });
  it("doesn't carry a skirt's letter size over to chinos sold by waist and length", () => {
    expect(sizeHint('J.Crew', chinos, items)).toBe('Likely 32 × 30, based on your other pieces like this');
  });
});
