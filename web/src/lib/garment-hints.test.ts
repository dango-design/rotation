import { describe, expect, it } from 'vitest';
import { hintFrom, pathWords } from './garment-hints';

describe('hintFrom', () => {
  it.each([
    ['Relaxed Linen Shirt', 'top', 'linenshirt'],
    ['Oxford Button-Down Shirt', 'top', 'shirt'],
    ['Organic Cotton Crew Tee', 'top', 'tee'],
    ['Merino Crewneck Sweater', 'top', 'sweater'],
    ['Heavyweight Hoodie', 'top', 'hoodie'],
    ['Classic Denim Jacket', 'top', 'denimjacket'],
    ['Wool Overcoat', 'top', 'coat'],
    ['Shirt Dress', 'dress', 'dress'],
    ['Linen Midi Dress', 'dress', 'dress'],
    ['90s Loose Jeans', 'bottom', 'loosejeans'],
    ['Bootcut Jeans', 'bottom', 'loosejeans'],
    ['Slim Straight Jean', 'bottom', 'jeans'],
    ['Wide-Leg Trouser', 'bottom', 'widetrousers'],
    ['Dress Pants', 'bottom', 'trousers'],
    ['Pleated Midi Skirt', 'bottom', 'skirt'],
    ['Denim Skirt', 'bottom', 'skirt'],
    ["Men's Tree Runner", 'shoes', 'sneakers'],
    ['High-Top Sneakers', 'shoes', 'sneakers'],
    ['Chelsea Boot', 'shoes', 'boots'],
    ['Penny Loafer', 'shoes', 'loafers'],
    ['Canvas Tote Bag', 'bag', 'tote'],
    ['Ribbed Beanie', 'hat', 'beanie'],
    ['Cap-Sleeve Top', 'top', 'tee'],
  ])('%s → %s (%s)', (title, part, type) => {
    expect(hintFrom(title)).toEqual({ part, type });
  });

  it('knows the part even when the type is unclear', () => {
    expect(hintFrom('Cargo Shorts')).toEqual({ part: 'bottom' });
    expect(hintFrom('Strappy Sandals')).toEqual({ part: 'shoes' });
  });

  it('falls back to the category, then the link', () => {
    expect(hintFrom('The Sunday Best', 'Women / Dresses')).toEqual({ part: 'dress', type: 'dress' });
    expect(hintFrom('Style 4471', '', pathWords('https://shop.example.com/products/mens-relaxed-chino-pant?variant=1'))).toEqual({ part: 'bottom', type: 'chinos' });
  });

  it('returns nothing when no garment is named', () => {
    expect(hintFrom('Gift Card', '', 'products gift card')).toBeUndefined();
  });
});
