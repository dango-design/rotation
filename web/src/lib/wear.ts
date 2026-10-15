/* Logging a wear. Today's week strip can log any earlier day, so a piece's "last worn" only ever moves forward:
   logging last Monday after wearing something on Thursday still counts the wear, but Thursday stays the last time.
   A planned day counts as worn once it has passed, with no need to say so (decision 032): `settle` logs it. Each day
   has at most one outfit worn, under the id `day:<date>`, which a past day's Change replaces and Didn't wear it
   takes back. A piece logged on its own ("Wore it today" on a piece) is a separate wear beside it. */

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

/** The id of a day's outfit worn. One per day, so two devices settling the same plan write the same record. */
export const dayWearId = (date: string) => `day:${date}`;

const piecesOf = (slots: OutfitSlots) => Object.values(slots).filter(Boolean) as string[];

/** The outfit worn on a day: its own record, or one logged before days had one, or a lone piece logged that day. */
export function dayWear(wears: WearEntry[], date: string): WearEntry | undefined {
  const on = wears.filter((w) => w.date === date);
  return on.find((w) => w.id === dayWearId(date)) ?? on.filter((w) => piecesOf(w.slots).length > 1).at(-1) ?? on.at(-1);
}

/** Adds `entry` as a wear to each of its pieces, noting where each piece's last worn day was before. */
export function putOn(items: Item[], entry: WearEntry): { items: Item[]; entry: WearEntry } {
  const ids = piecesOf(entry.slots);
  const before: Record<string, string | null> = {};
  const next = items.map((i) => {
    if (!ids.includes(i.id)) return i;
    before[i.id] = i.lastWorn ?? null;
    return wornOn(i, entry.date);
  });
  return { items: next, entry: { ...entry, before } };
}

/** Takes `entry`'s wear back off each of its pieces. `others` are the wears that stay, for each piece's last worn day. */
export function takeOff(items: Item[], entry: WearEntry, others: WearEntry[]): Item[] {
  const ids = piecesOf(entry.slots);
  return items.map((i) => {
    if (!ids.includes(i.id)) return i;
    const wears = Math.max(0, i.wears - 1);
    // Worn later than this, or worn again the same day: last worn stays.
    if (i.lastWorn !== entry.date || others.some((w) => w.date === entry.date && piecesOf(w.slots).includes(i.id))) return { ...i, wears };
    const dates = others.filter((w) => piecesOf(w.slots).includes(i.id)).map((w) => w.date);
    const prev = entry.before?.[i.id];
    if (prev) dates.push(prev);
    return { ...i, wears, lastWorn: dates.sort().at(-1) };
  });
}

/** Logs every planned day before `today` that has no outfit worn yet, as if it was worn as planned. A day already
    logged another way (an outfit, or the planned pieces one by one) is left as it is. */
export function settle(items: Item[], plans: Plan[], wears: WearEntry[], today: string): { items: Item[]; added: WearEntry[] } {
  const added: WearEntry[] = [];
  for (const plan of [...plans].sort((a, b) => a.date.localeCompare(b.date))) {
    if (plan.date >= today) continue;
    const ids = piecesOf(plan.slots);
    const on = wears.filter((w) => w.date === plan.date);
    const worn = new Set(on.flatMap((w) => piecesOf(w.slots)));
    if (!ids.length || on.some((w) => w.id === dayWearId(plan.date) || piecesOf(w.slots).length > 1) || ids.every((id) => worn.has(id))) continue;
    const done = putOn(items, { id: dayWearId(plan.date), date: plan.date, slots: plan.slots, ...(plan.layout ? { layout: plan.layout } : {}), ...(plan.bg ? { bg: plan.bg } : {}) });
    items = done.items;
    added.push(done.entry);
  }
  return { items, added };
}
