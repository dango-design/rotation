/* Example pieces the engine can suggest, each with matching options from several stores.
   Product names and prices are illustrative examples, not live store data; real data comes from product feeds later. */

import { SWATCHES, TYPES } from './catalog-meta';
import type { GarmentType, Piece, StoreOption } from './types';

function piece(id: string, name: string, type: GarmentType, colorName: string, style: number, options: [string, string, number][]): Piece {
  const sw = SWATCHES.find((s) => s.name === colorName);
  if (!sw) throw new Error(`Unknown swatch ${colorName}`);
  const t = TYPES[type];
  return {
    id,
    name,
    type,
    cat: t.cat,
    color: sw.hex,
    colorName: sw.name,
    tone: sw.tone,
    denim: sw.denim,
    pattern: sw.pattern,
    f: t.f,
    style,
    options: options.map(([store, product, price]): StoreOption => ({ store, product, price })),
  };
}

export const CATALOG: Piece[] = [
  // Tops
  piece('p-tee-white', 'White Crew Tee', 'tee', 'White', 0.9, [['Uniqlo', 'Supima Cotton Crew Tee', 19.9], ['Gap', 'Soft Crew Tee', 19.95], ['Everlane', 'Organic Cotton Crew', 30]]),
  piece('p-tee-black', 'Black Crew Tee', 'tee', 'Black', 0.88, [['H&M', 'Regular Fit Tee', 12.99], ['Uniqlo', 'Supima Cotton Crew Tee', 19.9], ['Everlane', 'Organic Cotton Crew', 30]]),
  piece('p-stripe', 'Striped Long-Sleeve Tee', 'longsleeve', 'Navy Stripe', 0.84, [['Uniqlo', 'Striped Boat Neck Tee', 24.9], ['Madewell', 'Striped Long-Sleeve Tee', 39.5], ['J.Crew', 'Breton Stripe Tee', 49.5]]),
  piece('p-oxford-white', 'White Oxford Shirt', 'shirt', 'White', 0.88, [['Uniqlo', 'Oxford Shirt', 39.9], ['J.Crew', 'Oxford Shirt', 79.5]]),
  piece('p-oxford-blue', 'Light Blue Oxford Shirt', 'shirt', 'Light Blue', 0.86, [['Uniqlo', 'Oxford Shirt', 39.9], ['J.Crew', 'Oxford Shirt', 79.5], ['Gap', 'Classic Oxford Shirt', 59.95]]),
  piece('p-denim-shirt', 'Denim Shirt', 'shirt', 'Mid Wash', 0.74, [["Levi's", 'Western Denim Shirt', 69.5], ['Madewell', 'Denim Shirt', 88]]),
  piece('p-sweater-grey', 'Grey Crew Sweater', 'sweater', 'Heather Grey', 0.8, [['Uniqlo', 'Merino Crew Sweater', 49.9], ['J.Crew', 'Cotton Crew Sweater', 89.5]]),
  piece('p-sweater-camel', 'Camel Crew Sweater', 'sweater', 'Camel', 0.78, [['Uniqlo', 'Merino Crew Sweater', 49.9], ['Banana Republic', 'Merino Crew Sweater', 90]]),
  piece('p-cardigan-oat', 'Soft Knit Cardigan', 'cardigan', 'Oatmeal', 0.86, [['Uniqlo', 'Soft Knit Cardigan', 49.9], ['J.Crew', 'Cotton Cardigan', 98], ['Everlane', 'Cashmere Cardigan', 150]]),
  piece('p-hoodie-grey', 'Grey Hoodie', 'hoodie', 'Heather Grey', 0.9, [['Gap', 'Fleece Hoodie', 54.95], ['Nike', 'Fleece Pullover Hoodie', 60]]),
  // Dresses
  piece('p-dress-black', 'Black Midi Dress', 'dress', 'Black', 0.8, [['Zara', 'Midi Dress', 49.9], ['Madewell', 'Midi Dress', 128], ['Banana Republic', 'Midi Dress', 140]]),
  piece('p-dress-sage', 'Sage Midi Dress', 'dress', 'Sage', 0.72, [['H&M', 'Midi Dress', 34.99], ['Madewell', 'Midi Dress', 128]]),
  // Bottoms
  piece('p-chino-khaki', 'Light Straight Chinos', 'chinos', 'Khaki', 0.96, [['Uniqlo', 'Chino Pants', 39.9], ['Gap', 'Straight Khakis', 59.95], ['J.Crew', 'Classic Chino', 79.5]]),
  piece('p-chino-navy', 'Navy Chinos', 'chinos', 'Navy', 0.8, [['Uniqlo', 'Chino Pants', 39.9], ['J.Crew', 'Classic Chino', 79.5]]),
  piece('p-jeans-light', 'Light-Wash Straight Jeans', 'jeans', 'Light Wash', 0.9, [["Levi's", 'Straight Jeans, Light Wash', 69.5], ['Gap', 'Straight Jeans, Light Wash', 69.95], ['Madewell', 'Straight Jean, Light Wash', 128]]),
  piece('p-jeans-dark', 'Dark-Wash Straight Jeans', 'jeans', 'Dark Wash', 0.88, [["Levi's", 'Straight Jeans, Dark Wash', 69.5], ['Uniqlo', 'Straight Jeans', 49.9]]),
  piece('p-wide-oat', 'Pleated Wide Trousers', 'widetrousers', 'Oatmeal', 0.82, [['Zara', 'Pleated Wide-Leg Trousers', 49.9], ['Abercrombie & Fitch', 'Relaxed Pleated Trouser', 90], ['Banana Republic', 'Pleated Wide-Leg Trouser', 120]]),
  piece('p-trouser-charcoal', 'Charcoal Tailored Trousers', 'trousers', 'Charcoal', 0.78, [['J.Crew', 'Wool Trouser', 128], ['Banana Republic', 'Tailored Wool Trouser', 130]]),
  piece('p-jogger-black', 'Black Joggers', 'joggers', 'Black', 0.8, [['Nike', 'Tech Fleece Jogger', 70], ['Lululemon', 'Tapered Jogger', 118]]),
  piece('p-skirt-black', 'Black Midi Skirt', 'skirt', 'Black', 0.76, [['Zara', 'Midi Skirt', 39.9], ['Madewell', 'Slip Skirt', 88]]),
  // Outerwear
  piece('p-denim-jacket', 'Denim Jacket', 'denimjacket', 'Mid Wash', 0.85, [["Levi's", 'Trucker Jacket', 98], ['Gap', 'Denim Jacket', 89.95]]),
  piece('p-chore-olive', 'Utility Chore Jacket', 'chorejacket', 'Olive', 0.92, [['Madewell', 'Utility Chore Jacket', 128], ['J.Crew', 'Chore Jacket', 148]]),
  piece('p-blazer-navy', 'Navy Blazer', 'blazer', 'Navy', 0.8, [['J.Crew', 'Wool Blazer', 198], ['Banana Republic', 'Wool Blazer', 250]]),
  piece('p-trench', 'Classic Trench Coat', 'trench', 'Khaki', 0.82, [['Abercrombie & Fitch', 'Trench Coat', 180], ['Banana Republic', 'Classic Trench', 250]]),
  piece('p-coat-camel', 'Camel Wool Coat', 'coat', 'Camel', 0.78, [['Banana Republic', 'Wool-Blend Car Coat', 260], ['Uniqlo', 'Wool-Blend Coat', 129.9]]),
  piece('p-puffer-black', 'Black Puffer', 'puffer', 'Black', 0.8, [['Uniqlo', 'Ultra Light Down Jacket', 79.9], ['Nike', 'Puffer Jacket', 150]]),
  // Shoes
  piece('p-sneaker-white', 'White Leather Sneakers', 'sneakers', 'White', 0.9, [['Nike', 'Court Sneakers', 90], ['Nordstrom', 'Leather Court Sneaker', 120]]),
  piece('p-boots-brown', 'Brown Chelsea Boots', 'boots', 'Brown', 0.86, [['Nordstrom', 'Chelsea Boot', 230], ['Madewell', 'Chelsea Boot', 198]]),
  piece('p-boots-black', 'Black Chelsea Boots', 'boots', 'Black', 0.78, [['Nordstrom', 'Chelsea Boot', 230], ['Zara', 'Chelsea Boot', 89.9]]),
  piece('p-loafers-black', 'Black Loafers', 'loafers', 'Black', 0.8, [['Amazon', 'Penny Loafer', 150], ['J.Crew', 'Leather Loafer', 168]]),
];

export const pieceById = (id: string) => CATALOG.find((p) => p.id === id);
export const lowestPrice = (p: Piece) => Math.min(...p.options.map((o) => o.price));

/** A web search for the product at that store. Real product links come with product feeds. */
export const findUrl = (store: string, product: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${store} ${product}`)}`;
