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

  it('reads nothing from a photo with no text', () => {
    expect(readPageText([])).toEqual({});
  });
});
