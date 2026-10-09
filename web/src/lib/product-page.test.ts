import { describe, expect, it } from 'vitest';
import { decode, readProductPage } from './product-page';

const page = (head: string, body = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
const url = new URL('https://shop.example.com/products/relaxed-linen-shirt');

describe('readProductPage', () => {
  it('reads name, brand, price and category from JSON-LD', () => {
    const html = page(
      ld({ '@context': 'https://schema.org', '@type': 'Product', name: 'Relaxed Linen Shirt', brand: { '@type': 'Brand', name: 'Acme' }, image: 'https://cdn.example.com/p/LS1234_front.jpg', offers: { '@type': 'Offer', price: '68.00' }, category: 'Shirts' }) +
        ld({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home' }, { name: 'Men' }, { name: 'Shirts & Tops' }] }) +
        '<meta property="og:site_name" content="Acme Store">',
    );
    const p = readProductPage(html, url);
    expect(p).toMatchObject({ title: 'Relaxed Linen Shirt', brand: 'Acme', store: 'Acme Store', price: 68, images: ['https://cdn.example.com/p/LS1234_front.jpg'] });
    expect(p.category).toBe('Shirts / Men / Shirts & Tops');
  });

  it('lists every gallery photo once, at the largest size offered', () => {
    const html = page(
      ld({
        '@type': 'Product',
        name: 'Tee',
        image: ['https://cdn.example.com/p/T100_front.jpg?width=100', 'https://cdn.example.com/p/T100_front.jpg?width=900', 'https://cdn.example.com/p/T100_back.jpg'],
      }) + '<meta property="og:image" content="https://cdn.example.com/p/T100_front.jpg?width=600">',
    );
    expect(readProductPage(html, url).images).toEqual(['https://cdn.example.com/p/T100_front.jpg?width=900', 'https://cdn.example.com/p/T100_back.jpg']);
  });

  it('asks Shopify for a photo big enough to cut out', () => {
    const html = page(ld({ '@type': 'Product', name: 'Runner', image: 'https://www.example.com/cdn/shop/files/RUN1_LEFT.png?v=1&width=100' }));
    expect(readProductPage(html, url).images).toEqual(['https://www.example.com/cdn/shop/files/RUN1_LEFT.png?v=1&width=1200']);
  });

  it("puts the linked variant's photos first and leaves other colors out", () => {
    const html = page(
      ld({
        '@type': 'ProductGroup',
        name: 'Chino',
        hasVariant: [
          { '@type': 'Product', url: 'https://shop.example.com/products/chino?variant=1', image: 'https://cdn.example.com/CH1_khaki.jpg' },
          { '@type': 'Product', url: 'https://shop.example.com/products/chino?variant=2', image: 'https://cdn.example.com/CH1_navy.jpg' },
        ],
      }),
    );
    expect(readProductPage(html, new URL('https://shop.example.com/products/chino?variant=2')).images).toEqual(['https://cdn.example.com/CH1_navy.jpg']);
    expect(readProductPage(html, new URL('https://shop.example.com/products/chino')).images).toEqual(['https://cdn.example.com/CH1_khaki.jpg']);
  });

  it('adds gallery images from the markup that share the product code, and skips other colors and logos', () => {
    const html = page(
      ld({ '@type': 'Product', name: 'Tree Runner', image: 'https://cdn.example.com/files/TR3MJBW080_SHOE_LEFT.png' }),
      `<img src="https://cdn.example.com/files/TR3MJBW080_SHOE_BACK.png" alt="Tree Runner back">
       <img srcset="https://cdn.example.com/files/TR3MJBW080_SHOE_TOP.png?w=400 400w, https://cdn.example.com/files/TR3MJBW080_SHOE_TOP.png?w=1600 1600w" alt="">
       <img src="https://cdn.example.com/files/A11959_Tree_Runner_Grey_LEFT.png" alt="Tree Runner in grey">
       <img src="https://cdn.example.com/assets/logo.png" alt="logo">
       <img src="https://cdn.example.com/assets/payment-icons.svg">
       <img src="https://cdn.example.com/files/TR3MJBW080_swatch.jpg" width="40" height="40">`,
    );
    expect(readProductPage(html, url).images).toEqual([
      'https://cdn.example.com/files/TR3MJBW080_SHOE_LEFT.png',
      'https://cdn.example.com/files/TR3MJBW080_SHOE_BACK.png',
      'https://cdn.example.com/files/TR3MJBW080_SHOE_TOP.png?w=1600',
    ]);
  });

  it('skips color chips and swatches', () => {
    const html = page(
      '<meta property="og:image" content="https://img.example.com/goods/422992/item/goods_38_422992.jpg">',
      '<img src="https://img.example.com/goods/422992/chip/goods_00_422992_chip.jpg"><img src="https://img.example.com/goods/422992/sub/goods_422992_sub3.jpg">',
    );
    expect(readProductPage(html, url).images).toEqual(['https://img.example.com/goods/422992/item/goods_38_422992.jpg', 'https://img.example.com/goods/422992/sub/goods_422992_sub3.jpg']);
  });

  it('falls back to Open Graph tags and the page title', () => {
    const html = page('<title>Wide-Leg Trouser | Example</title><meta content="https://img.example.com/wlt.jpg" property="og:image"><meta property="product:price:amount" content="89.5">');
    expect(readProductPage(html, url)).toMatchObject({ title: 'Wide-Leg Trouser', price: 89.5, images: ['https://img.example.com/wlt.jpg'], brand: null });
  });

  it('uses large images in page order when the page names no product photo', () => {
    const html = page('<title>Sale</title>', '<img src="/a.jpg" width="600" height="800"><img src="/tiny.jpg" width="20" height="20"><img src="/b.jpg" width="800" height="800">');
    expect(readProductPage(html, url).images).toEqual(['https://shop.example.com/a.jpg', 'https://shop.example.com/b.jpg']);
  });

  it('ignores malformed JSON-LD', () => {
    const html = page('<script type="application/ld+json">{ not json </script><meta property="og:title" content="Cardigan">');
    expect(readProductPage(html, url).title).toBe('Cardigan');
  });
});

describe('decode', () => {
  it('decodes named and numeric entities', () => {
    expect(decode('Men&#39;s Tee &amp; Shorts &#x2014; Navy&nbsp;')).toBe("Men's Tee & Shorts — Navy");
  });
});
