/* Cutting pieces out of photos on the phone. Nothing is uploaded.
   - Apple's subject lifting (modules/cutout), the same cutout Photos makes, when the app runs as its own development
     build on iOS 17 or later. Decision 017.
   - The web app's piece finder in a hidden web view (components/PieceFinder), everywhere else, Expo Go included.
     It also splits pieces that touch, like a top and pants, which Apple's cutout keeps as one. Decision 018.
   With both, Apple's outline stays the whole piece and the finder adds the split and what each piece is. */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Part } from '@core/garment-hints';
import { readPageText, type PageText } from '@core/page-text';
import type { Finder } from '@/components/PieceFinder';
import type { FoundPiece } from '../../finder/protocol';
import Cutout, { type CutResult } from '../../modules/cutout';
import { asFile } from './files';

/** A photo or a cutout, with what the finder made of it, and what a screenshot's text said about the product. */
export type Cut = { uri: string; width?: number; height?: number; label?: string; part?: Part; rgb?: [number, number, number]; page?: PageText };

/** A cutout from the piece finder, saved to a file, with what the finder saw. */
export type FinderCut = Cut & { cutout: boolean; together: boolean; clipped: boolean; photo?: number };

let saved = 0;
export const fromFinder = (pieces: FoundPiece[]): FinderCut[] =>
  pieces.map((p) => ({
    uri: asFile(p.image, `piece-${Date.now().toString(36)}-${++saved}`),
    label: p.label,
    part: p.part as Part | undefined,
    rgb: p.rgb,
    cutout: p.cutout,
    together: p.together,
    clipped: p.clipped,
    photo: p.photo,
  }));

/** The pieces in a photo, each cut out, and all of them as one when there's more than one. */
export type Pieces = { pieces: Cut[]; together?: Cut };

/** Photos are read at most this big: the cutout's edges don't improve past it, and it keeps memory low. */
const MAX_SIDE = 2048;
const MAX_PIECES = 6;
/** The finder works at this size, as on the web. */
const FINDER_SIDE = 1200;
/** Text is read at up to this size, so a screenshot's small print stays legible. */
const TEXT_SIDE = 2600;

export const canCutOut = Cutout?.isSupported ?? false;

/** Why a photo keeps its background where nothing can cut it out. */
export const keptAsIs = "The browser preview can't cut out backgrounds, so the photo is kept as it is.";
export const nothingFound = 'No piece stood out from the background, so the photo is kept as it is.';
export const couldntStart = "Couldn't get the cutout ready, so the photo is kept as it is. The first photo downloads about 23 MB; check the connection and try again.";

/** Apple's cutout: each piece on a clear background. Null when the phone can't, or the cut failed. */
async function appleCut(uri: string): Promise<CutResult | null> {
  if (!Cutout || !canCutOut) return null;
  try {
    return await Cutout.cutOutAsync(asFile(uri, 'cutout-in'), MAX_SIDE, MAX_PIECES);
  } catch {
    return null;
  }
}

const isPng = (uri: string) => uri.startsWith('data:image/png') || /\.png($|\?)/i.test(uri);

let inputs = 0;

/** A photo as a data URL for the finder, at most `side` on its long side. Cutouts stay PNG to keep them clear. */
export async function forFinder(c: Cut, side = FINDER_SIDE) {
  const png = isPng(c.uri);
  const src = asFile(c.uri, `finder-in-${++inputs}`);
  let { width, height } = c;
  if (!width || !height) ({ width, height } = await ImageManipulator.manipulate(src).renderAsync());
  const ctx = ImageManipulator.manipulate(src);
  if (Math.max(width, height) > side) ctx.resize(width >= height ? { width: side } : { height: side });
  const img = await (await ctx.renderAsync()).saveAsync({ base64: true, format: png ? SaveFormat.PNG : SaveFormat.JPEG, compress: 0.9 });
  return `data:image/${png ? 'png' : 'jpeg'};base64,${img.base64}`;
}

/**
 * The pieces in a photo. Null when no piece stood out; 'failed' when nothing could run (the finder's first download
 * failed and there's no Apple cutout).
 */
export async function findPieces(photo: Cut, finder: Finder): Promise<Pieces | null | 'failed'> {
  const apple = await appleCut(photo.uri);
  if (apple && apple.pieces.length > 1) return { pieces: apple.pieces, together: apple.together };
  const subject: Cut | undefined = apple?.pieces[0];
  if (!finder.available) return subject ? { pieces: [subject] } : null;

  const source = subject ?? photo;
  const found = await finder.find(await forFinder(source).catch(() => source.uri));
  if (!found) return subject ? { pieces: [subject] } : 'failed';
  const cuts = fromFinder(found.pieces);
  const separate = cuts.filter((c) => !c.together);
  const whole = cuts.find((c) => c.together);

  if (subject) {
    if (separate.length >= 2) return { pieces: separate, together: subject };
    const seen = separate[0] ?? whole;
    return { pieces: [{ ...subject, part: seen?.part, rgb: seen?.rgb }] };
  }
  if (!separate.length) return whole ? { pieces: [whole] } : null;
  return { pieces: separate, together: whole };
}

const area = (p: Cut) => (p.width ?? 0) * (p.height ?? 0);
const aspect = (p: Cut) => (p.width ?? 1) / (p.height ?? 1);

/** Two pieces of about the same size and shape are most likely a pair, like shoes, so they start out as one piece. */
export const looksLikePair = (pieces: Cut[]) =>
  pieces.length === 2 && area(pieces[0]) > 0 && area(pieces[1]) / area(pieces[0]) >= 0.7 && Math.abs(aspect(pieces[0]) - aspect(pieces[1])) / aspect(pieces[0]) <= 0.2;

/**
 * What a screenshot of a product page says: the name, price, brand and store, read with Apple's text recognition in the
 * development build, or Tesseract in the finder's web view. Null when the photo has no such text.
 */
export async function readScreenshot(photo: Cut, finder: Finder): Promise<PageText | null> {
  let lines = null;
  if (Cutout && canCutOut) lines = await Cutout.readTextAsync(asFile(photo.uri, 'text-in'), TEXT_SIDE).catch(() => null);
  if (!lines && finder.available) lines = await finder.readText(await forFinder(photo, TEXT_SIDE).catch(() => photo.uri));
  if (!lines) return null;
  const page = readPageText(lines);
  return page.name || page.price || page.store ? page : null;
}
