export type Cat = 'top' | 'dress' | 'bottom' | 'outer' | 'shoes' | 'acc';
/** Board slots. A dress sits in the top slot and makes the bottom slot unnecessary. */
export type Slot = 'outer' | 'top' | 'bottom' | 'shoes' | 'acc';

export type GarmentType =
  | 'tee' | 'pockettee' | 'longsleeve' | 'sweater' | 'shirt' | 'linenshirt' | 'hoodie' | 'cardigan'
  | 'dress' | 'shirtdress' | 'slipdress'
  | 'denimjacket' | 'chorejacket' | 'blazer' | 'trench' | 'coat' | 'puffer'
  | 'jeans' | 'loosejeans' | 'chinos' | 'trousers' | 'widetrousers' | 'joggers' | 'skirt'
  | 'sneakers' | 'boots' | 'loafers' | 'flats'
  | 'tote' | 'cap' | 'beanie';

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
  /** Product image URL (link imports). */
  imageUrl?: string;
  link?: string;
  createdAt: string;
}

/** Anything the engine can reason about: an owned item or a suggested piece. */
export type Wearable = Pick<Item, 'id' | 'name' | 'type' | 'cat' | 'color' | 'colorName' | 'tone' | 'f' | 'denim' | 'pattern'>;

export type OutfitSlots = Partial<Record<Slot, string>>;

export interface Outfit {
  id: string;
  name: string;
  slots: OutfitSlots;
  createdAt: string;
}

/** An outfit planned for a date. */
export interface Plan {
  date: string;
  name: string;
  slots: OutfitSlots;
}

/** Outfits actually worn, one entry per wear. */
export interface WearEntry {
  id: string;
  date: string;
  slots: OutfitSlots;
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

export interface Settings {
  city: string;
  lat?: number;
  lon?: number;
  favoriteStores: string[];
  showShop: boolean;
  occasion: 'casual' | 'work' | 'dressy';
}

export interface ListEntry {
  key: string; // `${pieceId}|${store}`
  addedAt: string;
}
