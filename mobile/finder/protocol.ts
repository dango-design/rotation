/* Messages between the phone app and the piece finder in its hidden web view (finder/entry.ts). */

import type { Hint } from '../../web/src/lib/garment-hints';
import type { TextLine } from '../../web/src/lib/page-text';

export type FinderRequest =
  | { id: string; type: 'warm' }
  /** The pieces in someone's own photo (a data URL). */
  | { id: string; type: 'find'; image: string }
  /** The product in a product page's photos, best first. */
  | { id: string; type: 'product'; urls: string[]; hint?: Hint }
  /** The product in one page photo the person picked. */
  | { id: string; type: 'productPhoto'; url: string; index: number; hint?: Hint }
  /** Start loading the text reader, e.g. while someone picks a photo. */
  | { id: string; type: 'warmText' }
  /** The lines of text in a photo (a data URL), for screenshots of product pages. */
  | { id: string; type: 'text'; image: string };

export type FoundPiece = {
  label: string;
  part?: string;
  rgb: [number, number, number];
  /** False for the photo as it is. */
  cutout: boolean;
  together: boolean;
  clipped: boolean;
  /** Which of the product page's photos it came from. */
  photo?: number;
  /** The cutout, as a PNG data URL (a JPEG for the photo as it is). */
  image: string;
};

export type FinderReply =
  | { type: 'loaded' }
  /** The page asks the app for a product photo: store images can't be read from the page itself. */
  | { type: 'photo'; rid: string; url: string }
  | { type: 'progress'; id: string; done: number; total: number }
  | { id: string; ok: true; type: 'warm' | 'warmText' }
  | { id: string; ok: true; type: 'text'; lines: TextLine[] }
  | { id: string; ok: true; type: 'find' | 'product' | 'productPhoto'; sure: boolean; guess?: number; pieces: FoundPiece[] }
  | { id: string; ok: false; type: 'error'; error: string };
