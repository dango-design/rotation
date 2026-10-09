/* Decides what a photo shows and which piece to cut out, from two on-device model outputs:
   - a clothing parser (SegFormer, ATR labels) that tells tops, bottoms, dresses, shoes, bags, hats and skin apart;
   - a salient-object mask (U²-Net) that outlines the main things in the photo.
   The parser learned from photos of people, so its labels are only trusted when someone is in the photo; then the
   outfit is cut by garment. Without a person (a product shot, a flat lay, a piece on a hanger) each separate object
   is a piece, cut with the salient mask. When more than one piece could be the one, the person is asked. */

import { PART_LABEL, type Hint, type ParserPart, type Part } from '../garment-hints';
import { components, dilate, type Box } from './masks';
import { colorPieces } from './split';

export const PARTS: ParserPart[] = ['top', 'bottom', 'dress', 'shoes', 'bag', 'hat', 'scarf', 'belt', 'sunglasses'];

type Group = ParserPart | 'skin' | 'hair' | 'bg';

/** What each parser label (ATR) means here. */
export const LABEL_GROUP: Group[] = [
  'bg', // 0 background
  'hat', // 1 hat
  'hair', // 2 hair
  'sunglasses', // 3 sunglasses
  'top', // 4 upper clothes (tops, jackets and coats)
  'bottom', // 5 skirt
  'bottom', // 6 pants
  'dress', // 7 dress
  'belt', // 8 belt
  'shoes', // 9 left shoe
  'shoes', // 10 right shoe
  'skin', // 11 face
  'skin', // 12 left leg
  'skin', // 13 right leg
  'skin', // 14 left arm
  'skin', // 15 right arm
  'bag', // 16 bag
  'scarf', // 17 scarf
];

/** Model outputs on a common grid. */
export interface Maps {
  w: number;
  h: number;
  /** Most likely parser label per cell. */
  labels: Uint8Array;
  /** Parser probability of each part per cell. */
  prob: Record<ParserPart, Float32Array>;
  /** Salient-object mask, 0..1 (on photos of people, the parser's own foreground). */
  salient: Float32Array;
  /** The photo at grid size, RGBA, for telling touching pieces apart by color. */
  rgba: Uint8ClampedArray;
  /** The photo's border is one plain color (studio product shot). */
  plain: boolean;
}

export interface Region {
  id: string;
  part?: Part;
  label: string;
  /** Share of the photo it covers. */
  area: number;
  /** Soft mask on the grid, zero outside the region. */
  mask: Float32Array;
  box: Box;
  /** Cut with the salient mask (an object on its own) rather than the garment map. */
  whole: boolean;
  /** Several pieces of different colors offered together, in case they are one piece. */
  together?: boolean;
}

export interface Verdict {
  /** worn: someone is wearing it; single: one object on its own; several: a flat lay or busy photo; none: nothing found. */
  kind: 'worn' | 'single' | 'several' | 'none';
  /** Sure enough to skip asking. */
  sure: boolean;
  /** Pieces to offer, best first. When sure, the first is the pick. */
  regions: Region[];
  /** On a worn photo, whether the pick is the part the product name describes; undefined without a name. */
  matchesHint?: boolean;
  /** Share of the photo that is skin or hair. */
  person: number;
  /** Studio-style plain background. */
  plain?: boolean;
}

/** Smallest share of the photo each part needs to count. */
const MIN_AREA: Record<ParserPart, number> = { top: 0.02, bottom: 0.02, dress: 0.03, shoes: 0.004, bag: 0.006, hat: 0.004, scarf: 0.006, belt: 0.003, sunglasses: 0.002 };
/** Share of skin and hair that means someone is in the photo. */
export const WORN = 0.025;
/** A piece dominates when every other piece is smaller than this share of it. */
const DOMINANT = 0.15;
/** Most pieces offered from one photo. */
const MAX_REGIONS = 8;
/** Objects the parser gives less clothing probability than this are props: a plant, a phone, a book. */
const PROP = 0.35;

/** A region from its cells, softened by `soft` and grown a little, but never into `exclude` (a touching piece). */
function regionFrom(keep: Uint8Array, soft: Float32Array, m: Maps, id: string, part: Part | undefined, whole: boolean, exclude?: Uint8Array): Region {
  const { w, h } = m;
  const grown = dilate(keep, w, h, 2);
  const mask = new Float32Array(w * h);
  const box: Box = [w, h, 0, 0];
  let on = 0;
  for (let i = 0; i < w * h; i++) {
    if (grown[i] && !(exclude?.[i] && !keep[i])) mask[i] = soft[i];
    if (!keep[i]) continue;
    on++;
    const x = i % w;
    const y = (i - x) / w;
    box[0] = Math.min(box[0], x);
    box[1] = Math.min(box[1], y);
    box[2] = Math.max(box[2], x);
    box[3] = Math.max(box[3], y);
  }
  return { id, part, label: part ? PART_LABEL[part] : 'Whole piece', area: on / (w * h), mask, box, whole };
}

/** Cells of the largest blobs in a mask, dropping specks smaller than `share` of the largest. */
function mainBlobs(on: Uint8Array, w: number, h: number, share: number) {
  const c = components(on, w, h);
  const largest = Math.max(0, ...c.sizes);
  const keep = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (c.labels[i] && c.sizes[c.labels[i]] >= Math.max(4, share * largest)) keep[i] = 1;
  return keep;
}

/** One region per garment part the parser found. */
export function partRegions(m: Maps): Region[] {
  const n = m.w * m.h;
  const out: Region[] = [];
  for (const part of PARTS) {
    const on = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (LABEL_GROUP[m.labels[i]] === part) on[i] = 1;
    const keep = mainBlobs(on, m.w, m.h, 0.15);
    const r = regionFrom(keep, m.prob[part], m, part, part, false);
    if (r.area >= MIN_AREA[part]) out.push(r);
  }
  return out.sort((a, b) => b.area - a.area);
}

/** Separate objects in the photo from the salient mask, largest first. Specks and slivers are dropped. */
export function objectRegions(m: Maps): Region[] {
  const n = m.w * m.h;
  const on = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (m.salient[i] > 0.5) on[i] = 1;
  const c = components(on, m.w, m.h);
  const largest = Math.max(0, ...c.sizes);
  const total = c.sizes.reduce((a, b) => a + b, 0);
  // Everything salient covering the whole frame is a close-up or a busy scene, not an object.
  if (!largest || total / n > 0.97) return [];
  const big = c.sizes.map((s, i) => (i > 0 && s >= Math.max(0.15 * largest, 0.01 * n) ? i : 0)).filter(Boolean);
  const regions = big.map((label, k) => {
    const keep = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (c.labels[i] === label) keep[i] = 1;
    return regionFrom(keep, m.salient, m, big.length > 1 ? `object${k + 1}` : 'whole', undefined, true);
  });
  regions.sort((a, b) => b.area - a.area);
  regions.forEach((r, k) => (r.label = regions.length > 1 ? `Piece ${k + 1}` : 'Whole piece'));
  return regions.filter((r) => r.area >= 0.02);
}

/** Average clothing probability inside a region: high for garments, low for props. */
export function clothingShare(r: Region, m: Maps) {
  let g = 0;
  let n = 0;
  for (let i = 0; i < r.mask.length; i++) {
    if (r.mask[i] <= 0.5) continue;
    n++;
    for (const p of PARTS) g += m.prob[p][i];
  }
  return n ? g / n : 0;
}

/** Pieces of different colors inside one object, or none when it looks like one piece. */
function colorSplit(r: Region, m: Maps): Region[] {
  const object = new Uint8Array(r.mask.length);
  for (let i = 0; i < object.length; i++) if (r.mask[i] > 0.5) object[i] = 1;
  const masks = colorPieces(m.rgba, object, m.w, m.h);
  if (masks.length < 2) return [];
  return masks.map((keep, k) => {
    const others = new Uint8Array(object.length);
    masks.forEach((o, j) => j !== k && o.forEach((v, i) => v && (others[i] = 1)));
    return { ...regionFrom(keep, m.salient, m, `${r.id}-${k + 1}`, undefined, true, others), label: `Piece ${k + 1}` };
  });
}

export function personShare(m: Pick<Maps, 'labels'>) {
  let n = 0;
  for (let i = 0; i < m.labels.length; i++) {
    const g = LABEL_GROUP[m.labels[i]];
    if (g === 'skin' || g === 'hair') n++;
  }
  return n / m.labels.length;
}

const dominant = (rs: Region[]) => rs.length > 0 && rs.slice(1).every((r) => r.area < DOMINANT * rs[0].area);

function merge(a: Region, b: Region, part: Part): Region {
  const mask = a.mask.map((v, i) => Math.max(v, b.mask[i]));
  const box: Box = [Math.min(a.box[0], b.box[0]), Math.min(a.box[1], b.box[1]), Math.max(a.box[2], b.box[2]), Math.max(a.box[3], b.box[3])];
  return { id: part, part, label: PART_LABEL[part], area: a.area + b.area, mask, box, whole: false };
}

/** What the photo shows and which piece to cut out. `hint` is what a product page's name says the product is. */
export function decide(m: Maps, hint?: Hint): Verdict {
  return { ...verdict(m, hint), plain: m.plain };
}

function verdict(m: Maps, hint?: Hint): Verdict {
  const person = personShare(m);

  if (person >= WORN) {
    const parts = partRegions(m);
    if (!parts.length) return { kind: 'none', sure: false, regions: [], person };
    let match = hint && parts.find((r) => r.part === hint.part);
    if (hint?.part === 'dress' && !match) {
      // The parser often splits a dress into a top and a skirt.
      const top = parts.find((r) => r.part === 'top');
      const bottom = parts.find((r) => r.part === 'bottom');
      if (top && bottom) match = merge(top, bottom, 'dress');
    }
    if (match) return { kind: 'worn', sure: true, regions: [match, ...parts.filter((r) => r.part !== match.part)], matchesHint: true, person };
    return { kind: 'worn', sure: dominant(parts), regions: parts, matchesHint: hint ? false : undefined, person };
  }

  // Nobody in the photo: a product shot, a piece on a hanger or a bed, or a flat lay of several pieces.
  const objects = objectRegions(m);
  if (!objects.length) return { kind: 'none', sure: false, regions: [], person };
  const clothes = objects.filter((r) => clothingShare(r, m) >= PROP);
  const main = clothes.length ? clothes : objects;
  const props = clothes.length ? objects.filter((r) => !clothes.includes(r)) : [];
  const numbered = (rs: Region[]) => {
    let k = 0;
    return rs.slice(0, MAX_REGIONS).map((r) => ({ ...r, label: r.together ? 'As one piece' : `Piece ${++k}` }));
  };
  // Pieces lying on each other (a hat on a pair of pants) come apart by color, and are offered together too.
  const apart = (r: Region) => {
    const pieces = colorSplit(r, m);
    return pieces.length ? [{ ...r, together: true }, ...pieces] : [r];
  };

  if (main.length > 1) return { kind: 'several', sure: false, regions: numbered([...main.flatMap((r) => (hint ? [r] : apart(r))), ...props]), person };

  // One object. On a product page it is the product. In someone's own photo it may be pieces lying on each other.
  const one: Region = { ...main[0], id: 'whole', part: hint?.part, label: 'Whole piece' };
  const regions = hint ? [one] : apart(one);
  if (regions.length === 1) return { kind: 'single', sure: true, regions: [one, ...props], person };
  return { kind: 'several', sure: false, regions: numbered([...regions, ...props]), person };
}

/**
 * How good a product page photo is for cutting out the product: a product shot (one object, nobody wearing it) is
 * best, then a model wearing the part the product's name describes. Earlier gallery photos win ties, since stores
 * put the main photo first.
 */
export function photoScore(v: Verdict, index: number): number {
  if (v.kind === 'none' || !v.regions.length) return -Infinity;
  let s: number;
  if (v.kind === 'single') s = v.plain ? 90 : 82;
  else if (v.kind === 'worn' && v.matchesHint) s = 70 + 10 * Math.min(1, v.regions[0].area / 0.3);
  else if (v.kind === 'worn' && v.sure) s = v.matchesHint === undefined ? 60 : 20;
  else s = 25;
  return s - 2 * index;
}

/** A score this high is a product shot early in the gallery; no later photo needs checking. */
export const GOOD_ENOUGH = 85;
/** Below this, ask which piece is the product. */
export const SURE_SCORE = 50;
