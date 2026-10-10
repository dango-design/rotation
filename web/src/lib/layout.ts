/* Outfit canvas layout: where each piece sits, how big it is, and what's on top.

   Sizes are true to life. Each garment drawing fills a 200×200 box; BOX_CM is roughly how many centimetres that box
   spans for a typical piece of that type (a T-shirt's box is about 1 m across, a pair of earrings about 16 cm).
   The canvas is the shape of an iPhone screen, so an outfit exports as a phone-sized image exactly as arranged. It
   shows about 1.5 m across, so jeans come out taller than a tee and earrings small. Very small pieces get a minimum
   size so they can still be seen and grabbed. */

import type { GarmentType, Layout, OutfitSlots, PieceLayout, Slot, Wearable } from './types';

const BOX_CM: Record<GarmentType, number> = {
  tee: 100, pockettee: 100, longsleeve: 100, sweater: 100, shirt: 100, linenshirt: 100, hoodie: 104, cardigan: 100,
  dress: 115, shirtdress: 115, slipdress: 118, jumpsuit: 165,
  jeans: 125, loosejeans: 125, chinos: 125, trousers: 125, widetrousers: 125, joggers: 122, skirt: 75, shorts: 94,
  denimjacket: 105, chorejacket: 105, blazer: 103, trench: 134, coat: 125, puffer: 100,
  sneakers: 38, boots: 42, loafers: 36, flats: 34,
  tote: 65, crossbody: 48, backpack: 60, clutch: 40,
  necklace: 36, earrings: 16, bracelet: 12, watch: 30,
  cap: 36, beanie: 46, scarf: 90, belt: 125, sunglasses: 16,
};

/** An exported outfit, in pixels: an iPhone Pro Max screen (iPhone 16 and 17), the same shape as every recent iPhone. */
export const EXPORT_W = 1320;
export const EXPORT_H = 2868;

/** How much of real life the canvas width shows, in cm. */
export const CANVAS_CM = 150;
/** The smallest a piece is shown, in % of the canvas width. */
export const MIN_W = 8;
export const MAX_W = 120;
/** Canvas height ÷ width. */
export const ASPECT = EXPORT_H / EXPORT_W;

/** The first canvas was nearly square. Pieces arranged on it carry no `v`; pieces arranged on the phone canvas carry FRAME. */
const SQUARE_ASPECT = 1.02;
export const FRAME = 2;

/** A piece arranged on the square canvas, moved onto the phone canvas: same size across, the arrangement centred
    top to bottom, so it keeps its look. Tidy up puts it back at true size. */
export const toPhoneFrame = (p: PieceLayout): PieceLayout =>
  p.v === FRAME ? p : { ...p, v: FRAME, y: (p.y * SQUARE_ASPECT + (ASPECT - SQUARE_ASPECT) * 50) / ASPECT };

export const clampW = (w: number) => Math.min(MAX_W, Math.max(MIN_W, w));

/** True-to-life width of a piece, in % of the canvas width. */
export const trueWidth = (type: GarmentType) => clampW(((BOX_CM[type] ?? 100) / CANVAS_CM) * 100);

/** A piece's height in % of the canvas height (pieces are square). */
export const heightOf = (w: number) => w / ASPECT;

/** Back to front, the order pieces stack in a fresh flat lay. */
const ORDER: Slot[] = ['outer', 'top', 'bottom', 'shoes', 'bag', 'jewelry', 'acc'];

/** Where each slot's piece is centred in a fresh flat lay (x, y in %), with and without a layer: top to bottom, the
    way it's worn. */
const CENTRE: Record<'layered' | 'bare', Record<Slot, [number, number]>> = {
  layered: { outer: [34, 25], top: [68, 30], bottom: [52, 60], shoes: [30, 87], bag: [74, 84], jewelry: [80, 8], acc: [18, 8] },
  bare: { outer: [34, 25], top: [50, 24], bottom: [50, 56], shoes: [30, 86], bag: [74, 83], jewelry: [78, 8], acc: [20, 8] },
};
const ONE_PIECE: Record<'layered' | 'bare', [number, number]> = { layered: [60, 40], bare: [50, 38] };

const place = (cx: number, cy: number, w: number) => ({
  v: FRAME,
  x: Math.min(100 - w, Math.max(0, cx - w / 2)),
  y: Math.min(100 - heightOf(w), Math.max(0, cy - heightOf(w) / 2)),
});

/** Keeps at least a fifth of a piece on the canvas while it's dragged around. */
export const keepVisible = (p: PieceLayout): PieceLayout => {
  const h = heightOf(p.w);
  return { ...p, x: Math.min(100 - p.w * 0.2, Math.max(-p.w * 0.8, p.x)), y: Math.min(100 - h * 0.2, Math.max(-h * 0.8, p.y)) };
};

/** The layout to draw: saved positions where there are any, true-size defaults for everything else. */
export function resolveLayout(slots: OutfitSlots, layout: Layout | undefined, byId: (id: string) => Wearable | undefined): Layout {
  const out: Layout = {};
  const kind = slots.outer ? 'layered' : 'bare';
  const filled = ORDER.filter((s) => slots[s] && byId(slots[s]!));
  const topZ = Math.max(-1, ...filled.map((s) => layout?.[s]?.z ?? -1));
  let extra = 0;
  for (const s of filled) {
    const id = slots[s]!;
    const piece = byId(id)!;
    const saved = layout?.[s] && toPhoneFrame(layout[s]);
    if (saved && saved.id === id) {
      out[s] = saved;
      continue;
    }
    const w = trueWidth(piece.type);
    if (saved) {
      // A different piece in an arranged spot: same centre, its own true size.
      const cx = saved.x + saved.w / 2;
      const cy = saved.y + heightOf(saved.w) / 2;
      out[s] = { id, w, z: saved.z, ...place(cx, cy, w) };
      continue;
    }
    const [cx, cy] = piece.cat === 'dress' ? ONE_PIECE[kind] : CENTRE[kind][s];
    // In an arranged outfit a new piece lands on top; in a fresh one pieces stack in the usual order.
    const z = layout && topZ >= 0 ? topZ + 1 + extra++ : ORDER.indexOf(s);
    out[s] = { id, w, z, ...place(cx, cy, w) };
  }
  return out;
}

/** A piece dropped onto the canvas at `at` (in %): centred there, at true size. */
export const dropAt = (id: string, type: GarmentType, z: number, at: { x: number; y: number }): PieceLayout => {
  const w = trueWidth(type);
  return { id, w, z, v: FRAME, x: at.x - w / 2, y: at.y - heightOf(w) / 2 };
};

/** The part of the canvas the pieces cover, a little padded, in % of the canvas width across and down. */
export function contentBox(layout: Layout, pad = 3) {
  const ps = Object.values(layout) as PieceLayout[];
  if (!ps.length) return { x: 0, y: 0, w: 100, h: 100 * ASPECT };
  const x0 = Math.max(0, Math.min(...ps.map((p) => p.x)) - pad);
  const x1 = Math.min(100, Math.max(...ps.map((p) => p.x + p.w)) + pad);
  const y0 = Math.max(0, Math.min(...ps.map((p) => p.y * ASPECT)) - pad);
  const y1 = Math.min(100 * ASPECT, Math.max(...ps.map((p) => p.y * ASPECT + p.w)) + pad);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Slots from back to front. */
export const stackOrder = (layout: Layout) =>
  (Object.entries(layout) as [Slot, PieceLayout][]).sort((a, b) => a[1].z - b[1].z).map(([s]) => s);

/** Moves one piece in the stack and renumbers everything 0, 1, 2… */
export function restack(layout: Layout, slot: Slot, move: 'forward' | 'backward' | 'front' | 'back'): Layout {
  const order = stackOrder(layout);
  const i = order.indexOf(slot);
  if (i < 0) return layout;
  order.splice(i, 1);
  const to = move === 'front' ? order.length : move === 'back' ? 0 : move === 'forward' ? Math.min(order.length, i + 1) : Math.max(0, i - 1);
  order.splice(to, 0, slot);
  const out: Layout = {};
  order.forEach((s, z) => (out[s] = { ...layout[s]!, z }));
  return out;
}

/** Resizes a piece around its centre. */
export function resizeAround(p: PieceLayout, w: number): PieceLayout {
  const nw = clampW(w);
  const cx = p.x + p.w / 2;
  const cy = p.y + heightOf(p.w) / 2;
  return { ...p, w: nw, x: cx - nw / 2, y: cy - heightOf(nw) / 2 };
}
