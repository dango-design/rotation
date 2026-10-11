/* Messages between the phone app and the piece finder in its hidden web view (finder/entry.ts). */

export type FinderRequest = { id: string; type: 'warm' } | { id: string; type: 'find'; image: string };

export type FoundPiece = {
  label: string;
  part?: string;
  rgb: [number, number, number];
  together: boolean;
  clipped: boolean;
  /** The cutout, as a PNG data URL. */
  image: string;
};

export type FinderReply =
  | { type: 'loaded' }
  | { id: string; ok: true; type: 'warm' }
  | { id: string; ok: true; type: 'find'; sure: boolean; guess?: number; pieces: FoundPiece[] }
  | { id: string; ok: false; error: string };
