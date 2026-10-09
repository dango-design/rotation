import type { Cat, Denim, GarmentType } from './types';

export const CATS: { id: Cat; label: string; one: string }[] = [
  { id: 'top', label: 'Tops', one: 'top' },
  { id: 'dress', label: 'Dresses & jumpsuits', one: 'dress or jumpsuit' },
  { id: 'bottom', label: 'Bottoms', one: 'bottom' },
  { id: 'outer', label: 'Outerwear', one: 'layer' },
  { id: 'shoes', label: 'Shoes', one: 'pair of shoes' },
  { id: 'bag', label: 'Bags', one: 'bag' },
  { id: 'jewelry', label: 'Jewelry', one: 'piece of jewelry' },
  { id: 'acc', label: 'Accessories', one: 'accessory' },
];

/** Bags, jewelry and other accessories finish an outfit but never make one, and skip the formality check. */
export const isAccessory = (cat: Cat) => cat === 'bag' || cat === 'jewelry' || cat === 'acc';

/** Category, plural label and default formality (1 relaxed, 3 tailored) for each garment type. */
export const TYPES: Record<GarmentType, { label: string; plural: string; cat: Cat; f: number }> = {
  tee: { label: 'T-shirt', plural: 'T-shirts', cat: 'top', f: 1.5 },
  pockettee: { label: 'Pocket tee', plural: 'pocket tees', cat: 'top', f: 1.5 },
  longsleeve: { label: 'Long-sleeve tee', plural: 'long-sleeve tees', cat: 'top', f: 1.5 },
  sweater: { label: 'Sweater', plural: 'sweaters', cat: 'top', f: 2 },
  shirt: { label: 'Button-down shirt', plural: 'button-down shirts', cat: 'top', f: 2.5 },
  linenshirt: { label: 'Casual shirt', plural: 'casual shirts', cat: 'top', f: 2 },
  hoodie: { label: 'Hoodie or sweatshirt', plural: 'hoodies', cat: 'top', f: 1 },
  cardigan: { label: 'Cardigan', plural: 'cardigans', cat: 'top', f: 2 },
  dress: { label: 'Dress', plural: 'dresses', cat: 'dress', f: 2 },
  shirtdress: { label: 'Shirt dress', plural: 'shirt dresses', cat: 'dress', f: 2 },
  slipdress: { label: 'Slip dress', plural: 'slip dresses', cat: 'dress', f: 2.5 },
  jumpsuit: { label: 'Jumpsuit or overalls', plural: 'jumpsuits', cat: 'dress', f: 1.5 },
  jeans: { label: 'Straight or slim jeans', plural: 'jeans', cat: 'bottom', f: 1.5 },
  loosejeans: { label: 'Loose or wide jeans', plural: 'loose jeans', cat: 'bottom', f: 1.5 },
  chinos: { label: 'Chinos', plural: 'chinos', cat: 'bottom', f: 2 },
  trousers: { label: 'Tailored trousers', plural: 'tailored trousers', cat: 'bottom', f: 3 },
  widetrousers: { label: 'Wide-leg trousers', plural: 'wide-leg trousers', cat: 'bottom', f: 2.5 },
  joggers: { label: 'Joggers', plural: 'joggers', cat: 'bottom', f: 1 },
  skirt: { label: 'Skirt', plural: 'skirts', cat: 'bottom', f: 2 },
  shorts: { label: 'Shorts', plural: 'shorts', cat: 'bottom', f: 1 },
  denimjacket: { label: 'Denim jacket', plural: 'denim jackets', cat: 'outer', f: 1.5 },
  chorejacket: { label: 'Chore or work jacket', plural: 'chore jackets', cat: 'outer', f: 2 },
  blazer: { label: 'Blazer', plural: 'blazers', cat: 'outer', f: 3 },
  trench: { label: 'Trench coat', plural: 'trench coats', cat: 'outer', f: 2.5 },
  coat: { label: 'Wool coat', plural: 'wool coats', cat: 'outer', f: 2.5 },
  puffer: { label: 'Puffer', plural: 'puffers', cat: 'outer', f: 1 },
  sneakers: { label: 'Sneakers', plural: 'sneakers', cat: 'shoes', f: 1.5 },
  boots: { label: 'Boots', plural: 'boots', cat: 'shoes', f: 2 },
  loafers: { label: 'Loafers', plural: 'loafers', cat: 'shoes', f: 2.5 },
  flats: { label: 'Flats', plural: 'flats', cat: 'shoes', f: 2 },
  tote: { label: 'Tote or shoulder bag', plural: 'totes', cat: 'bag', f: 1.5 },
  crossbody: { label: 'Crossbody bag', plural: 'crossbody bags', cat: 'bag', f: 2 },
  backpack: { label: 'Backpack', plural: 'backpacks', cat: 'bag', f: 1 },
  clutch: { label: 'Clutch or evening bag', plural: 'clutches', cat: 'bag', f: 3 },
  necklace: { label: 'Necklace', plural: 'necklaces', cat: 'jewelry', f: 2 },
  earrings: { label: 'Earrings', plural: 'earrings', cat: 'jewelry', f: 2 },
  bracelet: { label: 'Bracelet', plural: 'bracelets', cat: 'jewelry', f: 2 },
  watch: { label: 'Watch', plural: 'watches', cat: 'jewelry', f: 2 },
  cap: { label: 'Cap', plural: 'caps', cat: 'acc', f: 1 },
  beanie: { label: 'Beanie', plural: 'beanies', cat: 'acc', f: 1 },
  scarf: { label: 'Scarf', plural: 'scarves', cat: 'acc', f: 2 },
  belt: { label: 'Belt', plural: 'belts', cat: 'acc', f: 2 },
  sunglasses: { label: 'Sunglasses', plural: 'sunglasses', cat: 'acc', f: 1.5 },
};

const PAIRS = new Set<GarmentType>(['jeans', 'loosejeans', 'chinos', 'trousers', 'widetrousers', 'joggers', 'shorts', 'sneakers', 'boots', 'loafers', 'flats', 'earrings', 'sunglasses']);

/** "one pair of chinos", "one cardigan". */
export const onePhrase = (t: GarmentType) => (PAIRS.has(t) ? `one pair of ${TYPES[t].plural.toLowerCase()}` : `one ${TYPES[t].label.toLowerCase()}`);

export interface Swatch {
  name: string;
  hex: string;
  tone: string;
  denim?: Denim;
  pattern?: 'stripe';
}

/** Colors people can pick from. Neutrals pair with anything; two different non-neutral tones clash. */
export const SWATCHES: Swatch[] = [
  { name: 'White', hex: '#F4F2EC', tone: 'neutral' },
  { name: 'Ecru', hex: '#E9E1CF', tone: 'neutral' },
  { name: 'Oatmeal', hex: '#D7CBB3', tone: 'neutral' },
  { name: 'Khaki', hex: '#C4AE84', tone: 'neutral' },
  { name: 'Camel', hex: '#B48A5A', tone: 'neutral' },
  { name: 'Brown', hex: '#5E3F2C', tone: 'neutral' },
  { name: 'Olive', hex: '#5E6243', tone: 'neutral' },
  { name: 'Heather Grey', hex: '#A9A8A4', tone: 'neutral' },
  { name: 'Charcoal', hex: '#3E3E41', tone: 'neutral' },
  { name: 'Black', hex: '#232323', tone: 'neutral' },
  { name: 'Navy', hex: '#26324A', tone: 'neutral' },
  { name: 'Light Blue', hex: '#B7CBE2', tone: 'neutral' },
  { name: 'Light Wash', hex: '#9DB6CF', tone: 'neutral', denim: 'light' },
  { name: 'Mid Wash', hex: '#46658C', tone: 'neutral', denim: 'mid' },
  { name: 'Dark Wash', hex: '#22324D', tone: 'neutral', denim: 'dark' },
  { name: 'Navy Stripe', hex: '#EFE9DC', tone: 'neutral', pattern: 'stripe' },
  { name: 'Burgundy', hex: '#6B2633', tone: 'burgundy' },
  { name: 'Red', hex: '#B3322B', tone: 'red' },
  { name: 'Rust', hex: '#A3532F', tone: 'rust' },
  { name: 'Mustard', hex: '#C9962E', tone: 'mustard' },
  { name: 'Forest', hex: '#2F4A3A', tone: 'green' },
  { name: 'Sage', hex: '#9AAB8E', tone: 'sage' },
  { name: 'Pink', hex: '#E3A9B4', tone: 'pink' },
  { name: 'Lavender', hex: '#B3A6CF', tone: 'lavender' },
  { name: 'Cobalt', hex: '#2F55B5', tone: 'blue' },
  { name: 'Gold', hex: '#C9A54A', tone: 'neutral' },
  { name: 'Silver', hex: '#BFC3C7', tone: 'neutral' },
];

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Closest swatch to an RGB color (used to pre-fill the color of a photographed item). */
export function nearestSwatch(r: number, g: number, b: number): Swatch {
  let best = SWATCHES[0];
  let bestD = Infinity;
  for (const s of SWATCHES) {
    if (s.pattern) continue;
    const [sr, sg, sb] = rgb(s.hex);
    // weighted distance, closer to perceived difference than plain RGB
    const d = 2 * (sr - r) ** 2 + 4 * (sg - g) ** 2 + 3 * (sb - b) ** 2;
    if (d < bestD) [best, bestD] = [s, d];
  }
  return best;
}

export const swatchByName = (name: string) => SWATCHES.find((s) => s.name.toLowerCase() === name.toLowerCase());

/** Stores the app knows by name. Order matters only for the settings list. */
export const KNOWN_STORES = [
  'Abercrombie & Fitch', 'Amazon', 'Banana Republic', 'Everlane', 'Gap', 'H&M', 'J.Crew', "Levi's",
  'Lululemon', 'Madewell', 'Nike', 'Nordstrom', 'Old Navy', 'Target', 'Uniqlo', 'Zara',
];
