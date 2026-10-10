export type Cat = 'top' | 'dress' | 'bottom' | 'outer' | 'shoes' | 'bag' | 'jewelry' | 'acc';
/** Board slots. A dress or jumpsuit sits in the top slot and makes the bottom slot unnecessary. */
export type Slot = 'outer' | 'top' | 'bottom' | 'shoes' | 'bag' | 'jewelry' | 'acc';

export type GarmentType =
  | 'tee' | 'pockettee' | 'longsleeve' | 'sweater' | 'shirt' | 'linenshirt' | 'hoodie' | 'cardigan'
  | 'dress' | 'shirtdress' | 'slipdress' | 'jumpsuit'
  | 'denimjacket' | 'chorejacket' | 'blazer' | 'trench' | 'coat' | 'puffer'
  | 'jeans' | 'loosejeans' | 'chinos' | 'trousers' | 'widetrousers' | 'joggers' | 'skirt' | 'shorts'
  | 'sneakers' | 'boots' | 'loafers' | 'flats'
  | 'tote' | 'crossbody' | 'backpack' | 'clutch'
  | 'necklace' | 'earrings' | 'bracelet' | 'watch'
  | 'cap' | 'beanie' | 'scarf' | 'belt' | 'sunglasses';

export type Denim = 'light' | 'mid' | 'dark';
export type Source = 'photo' | 'link' | 'manual' | 'email' | 'demo';

/** A piece of clothing the person owns. */
export interface Item {
  id: string;
  name: string;
  brand: string;
  /** Where it was bought, when different from the brand. */
  store?: string;
  source: Source;
  type: GarmentType;
  cat: Cat;
  /** Hex used to draw the illustration when there is no photo. */
  color: string;
  colorName: string;
  /** 'neutral', or a hue name; two different non-neutral hues clash. */
  tone: string;
  pattern?: 'stripe';
  denim?: Denim;
  /** Formality: 1 relaxed, 2 smart, 3 tailored. */
  f: number;
  price?: number;
  size?: string;
  wears: number;
  /** ISO date (YYYY-MM-DD). */
  lastWorn?: string;
  bought?: string;
  /** Key of the background-removed photo in the image store. */
  imageId?: string;
  /** The photo's background is removed. Older link imports kept the store's photo on white. */
  cutout?: boolean;
  /** Product image URL (link imports). */
  imageUrl?: string;
  link?: string;
  createdAt: string;
}

/** Anything the engine can reason about: an owned item or a suggested piece. */
export type Wearable = Pick<Item, 'id' | 'name' | 'type' | 'cat' | 'color' | 'colorName' | 'tone' | 'f' | 'denim' | 'pattern'>;

export type OutfitSlots = Partial<Record<Slot, string>>;

/** Where one piece sits on an outfit canvas, in % of the canvas width: left, top, width (pieces are square), stacking order.
    `id` is the piece it was set for; a different piece in the slot keeps the spot but gets its own true size.
    `v` is the canvas shape it was arranged on (see FRAME in layout.ts); without it, the original square canvas. */
export interface PieceLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  z: number;
  v?: number;
}

/** A hand-arranged outfit. Slots without an entry are placed automatically. */
export type Layout = Partial<Record<Slot, PieceLayout>>;

/** What an outfit is drawn on: a light neutral, or any color as `#rrggbb` (see backgrounds.ts). */
export type Background = BoardBg | `#${string}`;

export interface Outfit {
  id: string;
  name: string;
  slots: OutfitSlots;
  layout?: Layout;
  /** Unset means the default from Settings. */
  bg?: Background;
  createdAt: string;
}

/** An outfit planned for a date. */
export interface Plan {
  date: string;
  name: string;
  slots: OutfitSlots;
  layout?: Layout;
  bg?: Background;
}

/** Outfits actually worn, one entry per wear. */
export interface WearEntry {
  id: string;
  date: string;
  slots: OutfitSlots;
  layout?: Layout;
  bg?: Background;
}

export interface StoreOption {
  store: string;
  product: string;
  price: number;
}

/** A kind of piece the engine can recommend, with example options from several stores. */
export interface Piece extends Wearable {
  /** How well the piece fits typical saved looks (0-1); later learned per person. */
  style: number;
  options: StoreOption[];
}

/** Background behind outfit boards and flat lays. All light neutrals, so they don't change how a piece's color reads. */
export type BoardBg = 'white' | 'linen' | 'mist' | 'stone';

export interface Settings {
  city: string;
  lat?: number;
  lon?: number;
  favoriteStores: string[];
  showShop: boolean;
  occasion: 'casual' | 'work' | 'dressy';
  /** The background for outfits that don't have their own. Unset means linen, the original board color. */
  board?: BoardBg;
}

export interface ListEntry {
  key: string; // `${pieceId}|${store}`
  addedAt: string;
}
