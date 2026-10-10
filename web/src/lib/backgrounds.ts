/* Outfit backgrounds (decision 016). Each outfit can have its own: one of the four light neutrals from decision 011,
   a color from the palette, or any color. Without one, an outfit uses the default from Settings. */

import type { Background, BoardBg } from './types';

/** The neutrals' light values, as in globals.css (--board-*). */
export const NEUTRAL_HEX: Record<BoardBg, string> = { white: '#fbfbfa', linen: '#ece7df', mist: '#e9e9e7', stone: '#d9d8d5' };

export const NEUTRALS: [BoardBg, string][] = [
  ['white', 'White'],
  ['linen', 'Linen'],
  ['mist', 'Mist'],
  ['stone', 'Stone'],
];

/** Colors to start from: soft ones that flatter most pieces, then deep ones for light pieces. */
export const PALETTE: [`#${string}`, string][] = [
  ['#f2dcd5', 'Blush'],
  ['#f1e4b8', 'Butter'],
  ['#d3dcc7', 'Sage'],
  ['#d2dfe8', 'Sky'],
  ['#ddd5e6', 'Lilac'],
  ['#c7744f', 'Terracotta'],
  ['#6c7046', 'Olive'],
  ['#2c3a5a', 'Navy'],
  ['#3a3633', 'Charcoal'],
  ['#141414', 'Black'],
];

export const isNeutral = (bg: Background): bg is BoardBg => bg in NEUTRAL_HEX;

/** The background an outfit is drawn on. */
export const backgroundOf = (bg: Background | undefined, fallback: BoardBg | undefined): Background => bg ?? fallback ?? 'linen';

export const hexOf = (bg: Background) => (isNeutral(bg) ? NEUTRAL_HEX[bg] : bg);

/** Dark enough that text and outlines on it should turn light. */
export function isDark(bg: Background) {
  const n = parseInt(hexOf(bg).slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.2;
}

/** A valid `#rrggbb`, lower case, or undefined. */
export const asHex = (s: string): `#${string}` | undefined => (/^#[0-9a-f]{6}$/i.test(s) ? (s.toLowerCase() as `#${string}`) : undefined);
