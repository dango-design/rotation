/* The daily outfit: built only from what the person owns, weighted toward pieces they haven't worn lately,
   matched to the day's occasion and weather, and explained in plain words. */

import { ago, daysBetween } from './dates';
import { allBases, check } from './engine';
import type { Item, OutfitSlots, Settings } from './types';

export interface Reason {
  icon: 'planner' | 'fog' | 'sun' | 'cloud' | 'rain' | 'snow' | 'builder';
  strong: string;
  text: string;
}

export interface Suggestion {
  slots: OutfitSlots;
  title: string;
  reasons: Reason[];
}

export const RANGE: Record<Settings['occasion'], [number, number]> = { casual: [1, 1.9], work: [1.75, 2.75], dressy: [2.25, 3] };
const TITLE: Record<Settings['occasion'], string> = { casual: 'Easy and put together', work: 'Ready for the day', dressy: 'Dressed up' };
const OCCASION_LINE: Record<Settings['occasion'], [string, string]> = {
  casual: ['A relaxed day.', 'Comfortable pieces that still look intentional.'],
  work: ['A work day.', 'Polished enough for meetings, without a suit.'],
  dressy: ['Dressing up.', 'Sharper pieces for an evening out.'],
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function suggest(
  closet: Item[],
  opts: { occasion: Settings['occasion']; today: string; shuffle: number; temp?: number; sky?: string; skyWord?: string },
): Suggestion | null {
  const get = (id: string) => closet.find((i) => i.id === id)!;
  const bases = allBases(closet);
  if (!bases.length) return null;

  const pieces = (o: OutfitSlots) => (Object.values(o).filter(Boolean) as string[]).map(get);
  const avg = (o: OutfitSlots) => {
    const ps = pieces(o);
    return ps.reduce((a, i) => a + i.f, 0) / ps.length;
  };
  const [lo, hi] = RANGE[opts.occasion];
  let pool = bases.filter((o) => avg(o) >= lo && avg(o) <= hi);
  if (!pool.length) pool = bases;

  const since = (i: Item) => (i.lastWorn ? daysBetween(i.lastWorn, opts.today) : 60);
  const fresh = (i: Item) => Math.min(since(i), 30) / 30;
  const score = (o: OutfitSlots) => {
    const ps = pieces(o);
    const recent = ps.filter((i) => since(i) <= 1).length;
    return ps.reduce((a, i) => a + fresh(i), 0) - 1.5 * recent + 0.4 * hash(JSON.stringify(o) + opts.today);
  };
  const ranked = [...pool].sort((a, b) => score(b) - score(a));
  const base = ranked[opts.shuffle % Math.min(ranked.length, 12)];
  const slots: OutfitSlots = { ...base };

  // A layer when it's cool (or the weather is unknown), and an accessory when one fits.
  const needLayer = opts.temp === undefined || opts.temp < 66;
  const fitting = (cat: Item['cat']) =>
    closet.filter((i) => i.cat === cat && check([...pieces(slots), i]).ok).sort((a, b) => fresh(b) - fresh(a) || b.wears - a.wears);
  const layer = needLayer ? fitting('outer')[0] : undefined;
  if (layer) slots.outer = layer.id;
  const acc = fitting('acc')[0];
  if (acc) slots.acc = acc.id;

  const reasons: Reason[] = [];
  const [os, ot] = OCCASION_LINE[opts.occasion];
  reasons.push({ icon: 'planner', strong: os, text: ot });
  if (opts.temp !== undefined) {
    const icon = (['fog', 'sun', 'cloud', 'rain', 'snow'].includes(opts.sky ?? '') ? opts.sky : 'cloud') as Reason['icon'];
    reasons.push({
      icon,
      strong: `${opts.temp}° and ${opts.skyWord ?? 'mild'}.`,
      text: layer ? `The ${layer.name.toLowerCase()} is your layer.` : needLayer ? 'No layer in your closet fits this outfit.' : 'Warm enough to skip a layer.',
    });
  } else {
    reasons.push({ icon: 'cloud', strong: 'Weather unknown.', text: 'Add your city in Settings for weather-aware outfits.' });
  }
  const stale = pieces(slots).filter((i) => i.cat !== 'acc').sort((a, b) => since(b) - since(a))[0];
  if (stale)
    reasons.push({
      icon: 'builder',
      strong: `Your ${stale.name.toLowerCase()} is due a wear.`,
      text: stale.lastWorn ? `Last worn ${ago(stale.lastWorn, opts.today)}.` : "You haven't worn it yet.",
    });

  return { slots, title: TITLE[opts.occasion], reasons };
}
