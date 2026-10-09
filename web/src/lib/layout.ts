/* Outfit canvas layout: where each piece sits, how big it is, and what's on top.

   Sizes are true to life. Each garment drawing fills a 200×200 box; BOX_CM is roughly how many centimetres that box
   spans for a typical piece of that type (a T-shirt's box is about 1 m across, a pair of earrings about 16 cm).
   The canvas shows about 2.1 m, so jeans come out taller than a tee and earrings small. Very small pieces get a
   minimum size so they can still be seen and grabbed. */

import type { GarmentType, Layout, OutfitSlots, PieceLayout, Slot, Wearable } from './types';

const BOX_CM: Record<GarmentType, number> = {
  tee: 100, pockettee: 100, longsleeve: 100, sweater: 100, shirt: 100, linenshirt: 100, hoodie: 104, cardigan: 100,
  dress: 115, jumpsuit: 165,
  jeans: 125, loosejeans: 125, chinos: 125, trousers: 125, widetrousers: 125, joggers: 122, skirt: 75, shorts: 94,
  denimjacket: 105, chorejacket: 105, blazer: 103, trench: 134, coat: 125, puffer: 100,
  sneakers: 38, boots: 42, loafers: 36,
  tote: 65, crossbody: 48, backpack: 60, clutch: 40,
  necklace: 36, earrings: 16, bracelet: 12, watch: 30,
  cap: 36, beanie: 46, scarf: 90, belt: 125, sunglasses: 16,
};

/** How much of real life the canvas width shows, in cm. */
export const CANVAS_CM = 210;
/** The smallest a piece is shown, in % of the canvas width. */
export const MIN_W = 8;
export const MAX_W = 120;
/** Canvas height ÷ width. */
export const ASPECT = 1.02;

export const clampW = (w: number) => Math.min(MAX_W, Math.max(MIN_W, w));

/** True-to-life width of a piece, in % of the canvas width. */
export const trueWidth = (type: GarmentType) => clampW(((BOX_CM[type] ?? 100) / CANVAS_CM) * 100);

/** A piece's height in % of the canvas height (pieces are square). */
export const heightOf = (w: number) => w / ASPECT;

/** Back to front, the order pieces stack in a fresh flat lay. */
const ORDER: Slot[] = ['outer', 'top', 'bottom', 'shoes', 'bag', 'jewelry', 'acc'];

/** Where each slot's piece is centred in a fresh flat lay (x, y in %), with and without a layer. */
const CENTRE: Record<'layered' | 'bare', Record<Slot, [number, number]>> = {
  layered: { outer: [27, 31], top: [72, 26], bottom: [72, 70], shoes: [22, 84], bag: [36, 64], jewelry: [50, 11], acc: [10, 10] },
  bare: { outer: [27, 31], top: [31, 29], bottom: [70, 58], shoes: [24, 83], bag: [80, 16], jewelry: [55, 9], acc: [84, 88] },
};
const ONE_PIECE: Record<'layered' | 'bare', [number, number]> = { layered: [70, 50], bare: [42, 44] };

const place = (cx: number, cy: number, w: number) => ({
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
    const saved = layout?.[s];
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
