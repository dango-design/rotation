/* Planning a day piece by piece: the steps, the pieces offered at each step, and which of them to suggest.
   A suggestion works with what is already picked, suits the day's occasion, and is one the person hasn't worn lately. */

import { daysBetween } from './dates';
import { fitsBoard, slotOf } from './engine';
import { RANGE } from './today';
import type { Item, OutfitSlots, Settings, Slot, Wearable } from './types';

/** The order the planner walks through. Every step is a suggestion: any one piece is enough to plan or log a day. */
export const STEPS: { slot: Slot; label: string; plural: string; optional?: boolean }[] = [
  { slot: 'top', label: 'Top', plural: 'tops, dresses or jumpsuits' },
  { slot: 'bottom', label: 'Bottom', plural: 'bottoms' },
  { slot: 'shoes', label: 'Shoes', plural: 'shoes' },
  { slot: 'outer', label: 'Layer', plural: 'layers', optional: true },
  { slot: 'bag', label: 'Bag', plural: 'bags', optional: true },
  { slot: 'jewelry', label: 'Jewelry', plural: 'jewelry', optional: true },
  { slot: 'acc', label: 'Accessory', plural: 'accessories', optional: true },
];

/** How well one piece suits the occasion: 2 at the occasion's own formality, 1 within a step of it, 0 otherwise. */
export const occasionFit = (i: Wearable, occasion: Settings['occasion']) => {
  const [lo, hi] = RANGE[occasion];
  if (i.f >= lo && i.f <= hi) return 2;
  return Math.abs(i.f - (lo + hi) / 2) <= 1 ? 1 : 0;
};

export interface StepPiece {
  item: Item;
  fits: boolean;
  suggested: boolean;
  /** Why it is suggested, in a few words. */
  why?: string;
}

/** Pieces meant for the cold, and pieces meant for the heat. Everything else works most of the year. */
const WARM = new Set(['sweater', 'hoodie', 'cardigan', 'coat', 'puffer', 'beanie', 'scarf']);
const LIGHT = new Set(['linenshirt', 'shorts']);

/** How well one piece suits the day's temperature (°F): 1 a good match, 0 fine, -1 out of season. */
export const weatherFit = (i: Wearable, temp?: number) => {
  if (temp === undefined) return 0;
  if (WARM.has(i.type)) return temp >= 72 ? -1 : temp <= 55 ? 1 : 0;
  if (LIGHT.has(i.type)) return temp <= 55 ? -1 : temp >= 75 ? 1 : 0;
  return 0;
};

/** Worn within the last week: suggested again only when nothing else fits. */
const RECENT_DAYS = 7;

/**
 * Every owned piece for a step, in suggested order: pieces that work with the outfit so far, then the best match
 * for the occasion and the weather, then ones not worn this week, then the ones worn most (what's in rotation).
 * A long gap is not a reason on its own: a piece unworn for months may be seasonal or for one kind of day.
 */
export function piecesFor(
  slot: Slot,
  slots: OutfitSlots,
  closet: Item[],
  byId: (id: string) => Wearable | undefined,
  opts: { occasion: Settings['occasion']; today: string; temp?: number },
): StepPiece[] {
  const since = (i: Item) => (i.lastWorn ? daysBetween(i.lastWorn, opts.today) : Infinity);
  const rows = closet
    .filter((i) => slotOf(i) === slot)
    .map((item) => ({
      item,
      fits: fitsBoard(item, slots, byId),
      suits: occasionFit(item, opts.occasion),
      weather: weatherFit(item, opts.temp),
      rested: since(item) >= RECENT_DAYS,
    }))
    .sort(
      (a, b) =>
        Number(b.fits) - Number(a.fits) ||
        b.suits - a.suits ||
        b.weather - a.weather ||
        Number(b.rested) - Number(a.rested) ||
        b.item.wears - a.item.wears,
    );
  const candidates = rows.filter((r) => r.fits && r.suits > 0 && r.weather >= 0 && r.item.id !== slots[slot]);
  const picks = [...candidates.filter((r) => r.rested), ...candidates.filter((r) => !r.rested)].slice(0, 2);
  return rows.map(({ item, fits, suits, weather }) => {
    const suggested = picks.some((p) => p.item.id === item.id);
    const why = !suggested
      ? undefined
      : weather > 0
        ? `${WARM.has(item.type) ? 'Warm' : 'Light'} for ${opts.temp}°`
        : Object.keys(slots).length
          ? 'Goes with your picks'
          : suits === 2
            ? `Right for a ${opts.occasion} day`
            : 'Not worn this week';
    return { item, fits, suggested, why };
  });
}

/** The first required step still empty (a dress covers the bottom), or the first empty optional one. */
export function nextStep(slots: OutfitSlots, byId: (id: string) => Wearable | undefined, after?: Slot): Slot | null {
  const dress = byId(slots.top ?? '')?.cat === 'dress';
  const open = STEPS.filter((s) => !slots[s.slot] && !(s.slot === 'bottom' && dress));
  const required = open.find((s) => !s.optional);
  if (required) return required.slot;
  const start = after ? STEPS.findIndex((s) => s.slot === after) : -1;
  return open.find((s) => STEPS.indexOf(s) > start)?.slot ?? null;
}
