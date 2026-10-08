/* Planning a day piece by piece: the steps, the pieces offered at each step, and which of them to suggest.
   A suggestion works with what is already picked, suits the day's occasion, and is one the person hasn't worn lately. */

import { daysBetween } from './dates';
import { fitsBoard, slotOf } from './engine';
import { RANGE } from './today';
import type { Item, OutfitSlots, Settings, Slot, Wearable } from './types';

export const STEPS: { slot: Slot; label: string; optional?: boolean }[] = [
  { slot: 'top', label: 'Top' },
  { slot: 'bottom', label: 'Bottom' },
  { slot: 'shoes', label: 'Shoes' },
  { slot: 'outer', label: 'Layer', optional: true },
  { slot: 'acc', label: 'Extra', optional: true },
];

/** A single piece suits the occasion when its formality is within a step of the occasion's middle. */
export const suitsOccasion = (i: Wearable, occasion: Settings['occasion']) => {
  const [lo, hi] = RANGE[occasion];
  return Math.abs(i.f - (lo + hi) / 2) <= 1;
};

export interface StepPiece {
  item: Item;
  fits: boolean;
  suggested: boolean;
  /** Why it is suggested, in a few words. */
  why?: string;
}

/** Every owned piece for a step: ones that work with the outfit so far come first, freshest first; the top two are suggested. */
export function piecesFor(
  slot: Slot,
  slots: OutfitSlots,
  closet: Item[],
  byId: (id: string) => Wearable | undefined,
  opts: { occasion: Settings['occasion']; today: string },
): StepPiece[] {
  const since = (i: Item) => (i.lastWorn ? daysBetween(i.lastWorn, opts.today) : 999);
  const rows = closet
    .filter((i) => slotOf(i) === slot)
    .map((item) => ({ item, fits: fitsBoard(item, slots, byId), suits: suitsOccasion(item, opts.occasion) }))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || Number(b.suits) - Number(a.suits) || since(b.item) - since(a.item));
  const picks = rows.filter((r) => r.fits && r.suits && r.item.id !== slots[slot]).slice(0, 2);
  return rows.map(({ item, fits }) => {
    const suggested = picks.some((p) => p.item.id === item.id);
    const d = since(item);
    const why = !suggested ? undefined : d === 999 ? 'Not worn yet' : d >= 14 ? `Not worn in ${d} days` : Object.keys(slots).length ? 'Goes with your picks' : 'Fits the day';
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
