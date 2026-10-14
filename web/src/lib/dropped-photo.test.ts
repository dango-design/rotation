import { describe, expect, it } from 'vitest';
import { imageLinkIn, mayHoldPhoto } from './dropped-photo';

describe('imageLinkIn', () => {
  it("takes the dragged image's src over the page link it sits in", () => {
    const html = '<a href="https://store.com/p/123"><img alt="Tee" src="https://cdn.store.com/tee.jpg?w=800&amp;q=80"></a>';
    expect(imageLinkIn('https://store.com/p/123', html)).toBe('https://cdn.store.com/tee.jpg?w=800&q=80');
  });

  it('takes a link that looks like a photo when there is no image markup', () => {
    expect(imageLinkIn('# comment\r\nhttps://cdn.store.com/shoe.webp', '')).toBe('https://cdn.store.com/shoe.webp');
  });

  it('ignores page links, data URLs and other schemes', () => {
    expect(imageLinkIn('https://store.com/p/123', '')).toBeNull();
    expect(imageLinkIn('', '<img src="data:image/png;base64,AAAA">')).toBeNull();
    expect(imageLinkIn('file:///Users/me/shirt.png', '')).toBeNull();
  });
});

describe('mayHoldPhoto', () => {
  it('accepts files and links, not a piece dragged within the app', () => {
    expect(mayHoldPhoto(['Files'])).toBe(true);
    expect(mayHoldPhoto(['text/uri-list', 'text/html'])).toBe(true);
    expect(mayHoldPhoto(['text/plain'])).toBe(false);
  });
});
