/* Putting a piece on an outfit board, shared by the day planner and the outfit builder. */

import { slotOf } from '@core/engine';
import { heightOf, resolveLayout, trueWidth } from '@core/layout';
import type { Layout, OutfitSlots, Wearable } from '@core/types';

/**
 * The board with one more piece in its slot. A dress or jumpsuit also clears the bottom.
 * Dropped onto the canvas (`at`, in % of the canvas), it's centred where it landed, at true size, on top of
 * everything, which is what the web canvas does when a piece is dragged in from the closet.
 */
export function placePiece(
  slots: OutfitSlots,
  layout: Layout | undefined,
  piece: Wearable,
  byId: (id?: string) => Wearable | undefined,
  at?: { x: number; y: number },
): { slots: OutfitSlots; layout: Layout | undefined } {
  const slot = slotOf(piece);
  const next: OutfitSlots = { ...slots, [slot]: piece.id };
  if (piece.cat === 'dress') delete next.bottom;
  if (!at) return { slots: next, layout };
  const current = resolveLayout(slots, layout, byId);
  const w = trueWidth(piece.type);
  const z = Math.max(-1, ...Object.values(current).map((p) => p!.z)) + 1;
  return { slots: next, layout: { ...current, [slot]: { id: piece.id, w, z, x: at.x - w / 2, y: at.y - heightOf(w) / 2 } } };
}

/** The board without one slot, and without its saved spot. */
export function removeSlot(slots: OutfitSlots, layout: Layout | undefined, slot: keyof OutfitSlots) {
  const next = { ...slots };
  delete next[slot];
  let l = layout;
  if (l?.[slot]) {
    l = { ...l };
    delete l[slot];
  }
  return { slots: next, layout: l };
}
