import { describe, expect, it } from 'vitest';
import { asHex, backgroundOf, hexOf, isDark, isNeutral, PALETTE } from './backgrounds';

describe('outfit backgrounds', () => {
  it("uses the outfit's own, then the default from Settings, then linen", () => {
    expect(backgroundOf('#141414', 'stone')).toBe('#141414');
    expect(backgroundOf(undefined, 'stone')).toBe('stone');
    expect(backgroundOf(undefined, undefined)).toBe('linen');
  });
  it('tells the neutrals from colors', () => {
    expect(isNeutral('mist')).toBe(true);
    expect(isNeutral('#d2dfe8')).toBe(false);
    expect(hexOf('linen')).toBe('#ece7df');
    expect(hexOf('#d2dfe8')).toBe('#d2dfe8');
  });
  it('knows which backgrounds are dark', () => {
    expect(isDark('white')).toBe(false);
    expect(isDark('stone')).toBe(false);
    expect(isDark('#141414')).toBe(true);
    expect(isDark('#2c3a5a')).toBe(true);
    expect(isDark('#f1e4b8')).toBe(false);
  });
  it('keeps the palette to valid colors', () => {
    for (const [hex] of PALETTE) expect(asHex(hex)).toBe(hex);
  });
  it('accepts only #rrggbb from the color picker', () => {
    expect(asHex('#7A2E3B')).toBe('#7a2e3b');
    expect(asHex('red')).toBeUndefined();
    expect(asHex('#fff')).toBeUndefined();
  });
});
