import { isAccessory } from './catalog-meta';
import { check, outfitsWith, slotOf } from './engine';
import type { Item, OutfitSlots, Wearable } from './types';

/** The most wearable outfit around one piece: the pieces the person reaches for most, plus a layer if one fits. */
export function bestOutfitWith(piece: Wearable, closet: Item[]): OutfitSlots {
  const get = (id: string) => closet.find((i) => i.id === id);
  let best: OutfitSlots | null = null;
  let bestScore = -1;
  for (const o of outfitsWith(piece, closet)) {
    const score = Object.values(o).reduce((a, id) => a + (get(id!)?.wears ?? 0), 0);
    if (score > bestScore) [best, bestScore] = [o, score];
  }
  if (!best) return { [slotOf(piece)]: piece.id };
  if (piece.cat !== 'outer' && !isAccessory(piece.cat)) {
    const base = Object.values(best).map((id) => get(id!) ?? piece);
    const layer = closet.filter((l) => l.cat === 'outer' && check([...base, l]).ok).sort((a, b) => b.wears - a.wears)[0];
    if (layer) best = { outer: layer.id, ...best };
  }
  return best;
}

/** Up to n outfits for a suggested piece, as varied as possible; offset varies neighbouring cards. */
export function previewsFor(piece: Wearable, closet: Item[], n = 3, offset = 0): OutfitSlots[] {
  const get = (id: string) => closet.find((i) => i.id === id);
  const scored = outfitsWith(piece, closet)
    .map((o) => ({ o, s: Object.values(o).reduce((a, id) => a + (get(id!)?.wears ?? 0), 0) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.o);
  const list = scored.slice(offset).concat(scored.slice(0, offset));
  const vary = slotOf(piece) === 'top' ? 'bottom' : 'top';
  const out: OutfitSlots[] = [];
  for (const strict of [true, false])
    for (const o of list) {
      if (out.length === n) break;
      if (out.includes(o) || out.some((p) => p[vary] === o[vary])) continue;
      if (strict && out.some((p) => p.shoes === o.shoes)) continue;
      out.push(o);
    }
  return out;
}
