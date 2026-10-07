/* Outfit engine: rule-based pairing and the Outfit Unlock score.
   A complete outfit is a top, a bottom and shoes, or a dress and shoes, with an optional layer and accessory.
   Nothing here weights any store: pieces are ranked by the value they add to this closet. */

import { TYPES, CATS } from './catalog-meta';
import { plural } from './format';
import type { Cat, Item, OutfitSlots, Piece, Slot, Wearable } from './types';

export const SLOTS: Slot[] = ['outer', 'top', 'bottom', 'shoes', 'acc'];
export const slotOf = (w: { cat: Cat }): Slot => (w.cat === 'dress' ? 'top' : w.cat);

/** Non-neutral tones that work together. Any other pair of different non-neutral tones clashes. */
const HARMONY: [string, string][] = [
  ['rust', 'green'], ['mustard', 'green'], ['rust', 'sage'], ['burgundy', 'pink'],
  ['sage', 'pink'], ['lavender', 'sage'], ['blue', 'mustard'],
];
const harmonious = (a: string, b: string) => HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export function clash(a: Wearable, b: Wearable): string | null {
  if (a.tone !== 'neutral' && b.tone !== 'neutral' && a.tone !== b.tone && !harmonious(a.tone, b.tone))
    return `${a.colorName} and ${b.colorName} compete for attention`;
  if (a.denim && b.denim && a.denim === b.denim)
    return `Two ${a.colorName.toLowerCase()} denim pieces read as one block`;
  return null;
}

export type Verdict = { ok: true } | { ok: false; reason: string };

/** Whether a set of pieces works together. Accessories are left out of the formality check. */
export function check(items: Wearable[]): Verdict {
  const list = items.filter(Boolean);
  if (list.some((i) => i.cat === 'dress') && list.some((i) => i.cat === 'bottom'))
    return { ok: false, reason: 'A dress already covers the bottom half' };
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const reason = clash(list[i], list[j]);
      if (reason) return { ok: false, reason };
    }
  const worn = list.filter((i) => i.cat !== 'acc');
  if (worn.length > 1) {
    const hi = worn.reduce((a, b) => (b.f > a.f ? b : a));
    const lo = worn.reduce((a, b) => (b.f < a.f ? b : a));
    if (hi.f - lo.f > 1)
      return { ok: false, reason: `The ${hi.name.toLowerCase()} is much dressier than the ${lo.name.toLowerCase()}` };
  }
  return { ok: true };
}

export const isComplete = (slots: OutfitSlots, byId: (id: string) => Wearable | undefined) => {
  const top = slots.top ? byId(slots.top) : undefined;
  if (!top || !slots.shoes) return false;
  return top.cat === 'dress' || !!slots.bottom;
};

const pool = (closet: Wearable[], cat: Cat) => closet.filter((i) => i.cat === cat);

/** Every complete base outfit (no layer) from the closet, optionally with one extra piece swapped in for its category. */
function bases(closet: Wearable[], extra?: Wearable): OutfitSlots[] {
  const pick = (cat: Cat) => (extra && extra.cat === cat ? [extra] : pool(closet, cat));
  const out: OutfitSlots[] = [];
  const shoes = pick('shoes');
  if (!extra || extra.cat !== 'dress') {
    for (const t of pick('top'))
      for (const b of pick('bottom'))
        for (const s of shoes) if (check([t, b, s]).ok) out.push({ top: t.id, bottom: b.id, shoes: s.id });
  }
  if (!extra || extra.cat === 'dress' || extra.cat === 'shoes') {
    for (const d of pick('dress')) for (const s of shoes) if (check([d, s]).ok) out.push({ top: d.id, shoes: s.id });
  }
  return out;
}

function lookup(closet: Wearable[], extra?: Wearable) {
  const map = new Map(closet.map((i) => [i.id, i]));
  if (extra) map.set(extra.id, extra);
  return (id: string) => map.get(id)!;
}

const piecesOf = (o: OutfitSlots, get: (id: string) => Wearable) =>
  (Object.values(o).filter(Boolean) as string[]).map(get);

/** Complete outfits a piece takes part in, using owned pieces for everything else.
    A layer counts the base outfits it can be worn over. */
export function outfitsWith(c: Wearable, closet: Wearable[]): OutfitSlots[] {
  const get = lookup(closet, c);
  if (c.cat === 'outer') return bases(closet).filter((o) => check([...piecesOf(o, get), c]).ok).map((o) => ({ ...o, outer: c.id }));
  if (c.cat === 'acc') return bases(closet).filter((o) => check([...piecesOf(o, get), c]).ok).map((o) => ({ ...o, acc: c.id }));
  return bases(closet.filter((i) => i.id !== c.id), c);
}

/** Outfit Unlock: outfits that only become possible with this piece.
    A new layer only counts outfits that no owned layer already works with. Accessories unlock nothing. */
export function unlock(c: Wearable, closet: Wearable[]): number {
  if (c.cat === 'acc') return 0;
  if (c.cat !== 'outer') return outfitsWith(c, closet).length;
  const get = lookup(closet);
  const layers = pool(closet, 'outer');
  return bases(closet).filter((o) => {
    const base = piecesOf(o, get);
    return check([...base, c]).ok && !layers.some((l) => check([...base, l]).ok);
  }).length;
}

export const totalOutfits = (closet: Wearable[]) => bases(closet).length;
export const allBases = (closet: Wearable[]) => bases(closet);

/** How close a suggested piece is to something already owned: 1 blocks it, 0.35 lowers it. */
export function duplicate(p: Wearable, closet: Item[]): { level: number; item?: Item } {
  const same = closet.filter((i) => i.type === p.type);
  const exact = same.find((i) => i.colorName.toLowerCase() === p.colorName.toLowerCase());
  if (exact) return { level: 1, item: exact };
  if (same.length) return { level: 0.35, item: same.sort((a, b) => b.wears - a.wears)[0] };
  return { level: 0 };
}

export interface Pick {
  piece: Piece;
  unlock: number;
  dup: { level: number; item?: Item };
  score: number;
}

/** Suggested pieces ranked by Rank = Unlock × style × (1 − duplication). Commission is not part of it. */
export function rankPieces(catalog: Piece[], closet: Item[]): Pick[] {
  return catalog
    .filter((p) => p.cat !== 'acc')
    .map((piece) => {
      const u = unlock(piece, closet);
      const dup = duplicate(piece, closet);
      return { piece, unlock: u, dup, score: u * piece.style * (1 - dup.level) };
    })
    .sort((a, b) => b.score - a.score || b.unlock - a.unlock);
}

/** One plain sentence on why a piece is suggested. */
export function whyLine(p: Wearable, closet: Item[]): string {
  const outs = outfitsWith(p, closet);
  const count = (k: Slot) => new Set(outs.map((o) => o[k]).filter(Boolean)).size;
  const n = (cat: Cat) => pool(closet, cat).length;
  let first = '';
  const shoes = `${count('shoes')} of your ${plural(n('shoes'), 'pair of shoes', 'pairs of shoes')}`;
  if (p.cat === 'bottom') first = `Pairs with ${count('top')} of your ${plural(n('top'), 'top')} and ${shoes}.`;
  else if (p.cat === 'top') first = `Pairs with ${count('bottom')} of your ${plural(n('bottom'), 'bottom')} and ${shoes}.`;
  else if (p.cat === 'dress') first = `Works with ${shoes}.`;
  else if (p.cat === 'shoes') first = `Finishes ${plural(outs.length, 'outfit')} from what you own.`;
  else if (p.cat === 'outer') first = `Gives a layer to ${plural(unlock(p, closet), 'outfit')} that ${unlock(p, closet) === 1 ? 'has' : 'have'} none today.`;
  const sameType = closet.some((i) => i.type === p.type);
  const sameColorInCat = closet.some((i) => i.cat === p.cat && i.colorName.toLowerCase() === p.colorName.toLowerCase());
  const catLabel = (CATS.find((c) => c.id === p.cat)?.label ?? '').toLowerCase();
  const second = !sameType
    ? `You don't own ${TYPES[p.type].plural} yet.`
    : !sameColorInCat
    ? `Adds ${p.colorName.toLowerCase()} to your ${catLabel}.`
    : '';
  return [first, second].filter(Boolean).join(' ');
}

/** Owned pieces that pair with an item, most-worn first. */
export function pairsWith(item: Item, closet: Item[]): Item[] {
  return closet
    .filter((i) => i.id !== item.id && slotOf(i) !== slotOf(item) && i.cat !== 'acc')
    .filter((i) => check([item, i]).ok)
    .sort((a, b) => b.wears - a.wears);
}

/** Suggestions for one board slot: owned pieces that fit (least-worn first), then suggested pieces by rank. */
export function forSlot(slot: Slot, slots: OutfitSlots, closet: Item[], catalog: Piece[]) {
  const get = lookup([...closet, ...catalog]);
  const others = (Object.entries(slots) as [Slot, string | undefined][])
    .filter(([k, v]) => k !== slot && v)
    .map(([, v]) => get(v!));
  const fits = (i: Wearable) => check([...others, i]).ok;
  const mine = closet.filter((i) => slotOf(i) === slot && fits(i)).sort((a, b) => a.wears - b.wears);
  const shop = rankPieces(catalog.filter((p) => slotOf(p) === slot && fits(p)), closet)
    .filter((x) => x.unlock > 0 && x.dup.level < 1)
    .slice(0, 2);
  return { mine, shop };
}

export const cpw = (i: Item) => (i.price && i.wears ? i.price / i.wears : null);
