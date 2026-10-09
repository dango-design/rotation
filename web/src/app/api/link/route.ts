/* Reads a product page someone pastes: name, brand, store, price, category, and the photos that could show the product.
   The browser then picks the right photo and removes its background on the device. */

import { readProductPage } from '@/lib/product-page';
import { safeFetch } from '@/lib/server/safe-fetch';

const MAX_HTML = 3_000_000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.url !== 'string') return Response.json({ error: 'Send a product link.' }, { status: 400 });

  try {
    const page = await safeFetch(body.url, 'text/html,application/xhtml+xml', MAX_HTML);
    const product = readProductPage(page.bytes.toString('utf8'), page.url);
    if (!product.title && !product.images.length) return Response.json({ error: "That page doesn't describe a product we can read." }, { status: 422 });
    return Response.json({ ...product, url: page.url.toString() });
  } catch (error) {
    const msg = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The store took too long to respond.';
    return Response.json({ error: msg }, { status: 422 });
  }
}
