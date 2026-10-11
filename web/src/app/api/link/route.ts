/* Reads a product page someone pastes: name, brand, store, price, category, and the photos that could show the product.
   The browser then picks the right photo and removes its background on the device. */

import { isChallengePage, readProductPage } from '@/lib/product-page';
import { rateLimited, safeFetch } from '@/lib/server/safe-fetch';

const MAX_HTML = 3_000_000;

export async function POST(request: Request) {
  if (rateLimited(request, 'link', 20)) return Response.json({ error: 'Too many links at once; try again in a minute.' }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (typeof body?.url !== 'string') return Response.json({ error: 'Send a product link.' }, { status: 400 });

  try {
    const page = await safeFetch(body.url, 'text/html,application/xhtml+xml', MAX_HTML);
    const product = readProductPage(page.bytes.toString('utf8'), page.url);
    if (isChallengePage(product))
      return Response.json(
        { error: `${page.url.hostname.replace(/^www\./, '')} checks for a full web browser before showing its pages, so Rotation can't read them. Save the product photo, or take a screenshot of the page, and add it by photo instead.` },
        { status: 422 },
      );
    if (!product.title && !product.images.length) return Response.json({ error: "That page doesn't describe a product we can read." }, { status: 422 });
    return Response.json({ ...product, url: page.url.toString() });
  } catch (error) {
    const msg = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The store took too long to respond.';
    return Response.json({ error: msg }, { status: 422 });
  }
}
