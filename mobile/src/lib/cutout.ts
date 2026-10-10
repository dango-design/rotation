/* Cutting pieces out of photos on the phone with Apple's subject lifting, the same as touching and holding a photo in
   Photos (modules/cutout, iOS 17 or later). Nothing leaves the phone. Expo Go, Android and the browser preview don't
   include the module, so photos there are kept as they are. */

import Cutout, { type CutPiece, type CutResult } from '../../modules/cutout';
import { asFile } from './files';

export type { CutPiece, CutResult };

/** Photos are read at most this big: the cutout's edges don't improve past it, and it keeps memory low. */
const MAX_SIDE = 2048;
const MAX_PIECES = 6;

export const canCutOut = Cutout?.isSupported ?? false;

/** Why a photo keeps its background, when this phone or this copy of the app can't cut it out. */
export const keptAsIs = Cutout
  ? 'Cutting out backgrounds needs iOS 17 or later, so the photo is kept as it is.'
  : "Expo Go can't cut out backgrounds, so the photo is kept as it is. A cutout copied from Photos pastes in clean.";

/** The pieces in a photo, each on a clear background. Null when the phone can't cut out or the cut failed. */
export async function cutOut(uri: string): Promise<CutResult | null> {
  if (!Cutout || !canCutOut) return null;
  try {
    return await Cutout.cutOutAsync(asFile(uri, 'cutout-in'), MAX_SIDE, MAX_PIECES);
  } catch {
    return null;
  }
}

const area = (p: CutPiece) => p.width * p.height;
const aspect = (p: CutPiece) => p.width / p.height;

/** Two pieces of about the same size and shape are most likely a pair, like shoes, so they start out as one piece. */
export const looksLikePair = (pieces: CutPiece[]) =>
  pieces.length === 2 && area(pieces[1]) / area(pieces[0]) >= 0.7 && Math.abs(aspect(pieces[0]) - aspect(pieces[1])) / aspect(pieces[0]) <= 0.2;
