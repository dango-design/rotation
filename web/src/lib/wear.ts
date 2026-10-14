/* Logging a wear. Today's week strip can log any earlier day, so a piece's "last worn" only ever moves forward:
   logging last Monday after wearing something on Thursday still counts the wear, but Thursday stays the last time. */

import type { Background, Item, Layout, OutfitSlots, Plan, WearEntry } from './types';

/** The piece after it's worn on `date` (YYYY-MM-DD, so later days compare as later strings). */
export const wornOn = (item: Item, date: string): Item => ({
  ...item,
  wears: item.wears + 1,
  lastWorn: !item.lastWorn || date > item.lastWorn ? date : item.lastWorn,
});

export interface WornOutfit {
  slots: OutfitSlots;
  layout?: Layout;
  bg?: Background;
  /** The plan's name, if it was planned before it was worn. */
  name?: string;
  last: string;
  times: number;
}

/** Outfits worn before, to wear again: one per set of pieces, most recently worn first, arranged as they were last
    time. A piece logged on its own ("Wore it today" on a piece) isn't an outfit, so it's left out. */
export function wornOutfits(wears: WearEntry[], plans: Plan[]): WornOutfit[] {
  const byKey = new Map<string, WornOutfit>();
  for (const w of [...wears].sort((a, b) => a.date.localeCompare(b.date))) {
    const ids = Object.values(w.slots).filter(Boolean) as string[];
    if (ids.length < 2) continue;
    const key = [...ids].sort().join('|');
    const name = plans.find((p) => p.date === w.date)?.name ?? byKey.get(key)?.name;
    byKey.set(key, { slots: w.slots, layout: w.layout, bg: w.bg, name, last: w.date, times: (byKey.get(key)?.times ?? 0) + 1 });
  }
  return [...byKey.values()].sort((a, b) => b.last.localeCompare(a.last));
}
