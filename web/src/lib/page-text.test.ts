import { describe, expect, it } from 'vitest';
import { readPageText, type TextLine } from './page-text';

// Lines as a text reader returns them, in fractions of the screenshot's width (a phone screenshot is about 2.2 tall).
const line = (text: string, y: number, h = 0.035, x = 0.05): TextLine => ({ text, x, y, w: 0.6, h });

describe('readPageText', () => {
  it("reads a store's product page: the name across two lines, the sale price, the store and brand", () => {
    const text = readPageText([
      line('8:36', 0.02, 0.03),
      line('Abercrombie & Fitch', 0.1),
      line('Women Men Kids', 0.16, 0.025),
      line('The A&F Madeline Merino', 1.35, 0.045),
      line('Wool-Blend Crew Sweater', 1.4, 0.045),
      line('$67.50 $90', 1.47, 0.04),
      line('Color: Heather Grey', 1.53, 0.03),
      line('Add to Bag', 1.62, 0.035),
      line('Free shipping on orders over $99', 1.7, 0.025),
      line('You May Also Like', 1.8, 0.035),
      line('Ribbed Tank Top', 1.86, 0.03),
      line('abercrombie.com', 2.1, 0.03, 0.35),
    ]);
    expect(text).toEqual({ name: 'The A&F Madeline Merino Wool-Blend Crew Sweater', price: 67.5, store: 'Abercrombie & Fitch', brand: 'Abercrombie & Fitch' });
  });

  it('finds the store from the address bar when the page shows no logo', () => {
    expect(readPageText([line('www.gap.com', 0.06, 0.03), line('Mid Rise Barrel Khakis', 1.3, 0.05), line('$39.99', 1.37), line('Women / Pants', 1.42, 0.025)])).toEqual({
      name: 'Mid Rise Barrel Khakis',
      price: 39.99,
      store: 'Gap',
      brand: 'Gap',
    });
  });

  it('names a store it doesn’t know from its site, and keeps a separator that belongs to the name', () => {
    const text = readPageText([line('aritzia.com', 2.1, 0.03), line('Contour Squareneck Bodysuit - Black', 1.2, 0.05), line('$58', 1.27)]);
    expect(text.store).toBe('Aritzia');
    expect(text.name).toBe('Contour Squareneck Bodysuit');
  });

  it('leaves out promotions, buttons and sentences', () => {
    const text = readPageText([
      line('Get $20 off orders over $100', 0.05, 0.025),
      line('Our softest sweater, made to last.', 1.5, 0.03),
      line('Add to Cart', 1.6, 0.04),
    ]);
    expect(text).toEqual({});
  });

  it("joins a name's two lines even when the reader measures them at different heights", () => {
    // Tesseract's lines from a real A&F screenshot (Oct 10, 2026): text, y, h and x.
    const read: [string, number, number, number][] = [
      ['9:15 pod 8:43PM', 0.053, 0.046, 0.089],
      ['abercrombie.com M', 0.182, 0.049, 0.349],
      ['© e Free Standard Shipping and Handling On All Orders Over $994 ¢ Lin', 0.439, 0.017, 0.115],
      ['= Abercrombie & Fitch Qa ® 5]', 0.486, 0.049, 0.15],
      ["Women's > Clearance > Tops > Sweaters", 0.576, 0.017, 0.147],
      ['Model: 5\'8" in size XS', 1.424, 0.014, 0.148],
      ['The A&F Madeline Merino Wool-Blend', 1.472, 0.025, 0.147],
      ['Striped Crew Sweater', 1.511, 0.034, 0.148],
      ['Color: Brown Stripe', 1.592, 0.02, 0.147],
      ['© Almost Gone!', 1.735, 0.02, 0.148],
      ['& 116 people are currently viewing', 1.774, 0.025, 0.15],
      ['$75 $44.99', 1.844, 0.02, 0.146],
      ['garance', 1.884, 0.012, 0.17],
      ['& + coe', 2.002, 0.047, 0.053],
    ];
    const text = readPageText(read.map(([t, y, h, x]) => ({ text: t, y, h, x, w: 0.6 })));
    expect(text).toEqual({ name: 'The A&F Madeline Merino Wool-Blend Striped Crew Sweater', price: 44.99, store: 'Abercrombie & Fitch', brand: 'Abercrombie & Fitch' });
  });

  it('joins a centered name that wraps', () => {
    const text = readPageText([
      { text: 'Relaxed Linen-Blend', x: 0.25, y: 1.2, w: 0.5, h: 0.04 },
      { text: 'Camp Shirt', x: 0.35, y: 1.25, w: 0.3, h: 0.045 },
    ]);
    expect(text.name).toBe('Relaxed Linen-Blend Camp Shirt');
  });

  it('reads nothing from a photo with no text', () => {
    expect(readPageText([])).toEqual({});
  });
});
