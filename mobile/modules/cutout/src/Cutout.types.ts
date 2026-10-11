export type CutPiece = { uri: string; width: number; height: number };

export type CutResult = {
  /** One cutout per piece found, largest first. */
  pieces: CutPiece[];
  /** Every piece as one cutout, when there's more than one (a pair of shoes is two pieces). */
  together?: CutPiece;
  /** The photo already had a clear background (a cutout pasted from Photos), so it's kept as it is. */
  alreadyCut: boolean;
};

/** A line of text in a photo, positioned in fractions of the image's width from the top left. */
export type TextLine = { text: string; x: number; y: number; w: number; h: number };
