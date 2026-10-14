/* Reads a product page someone pastes: name, brand, store, price, category, and the photos that could show the product.
   The browser then picks the right photo and removes its background on the device. */

import { isChallengePage, readProductPage } from '@/lib/product-page';
import { rateLimited, RefusedError, safeFetch } from '@/lib/server/safe-fetch';

const MAX_HTML = 3_000_000;

/** What to say when a store won't show its page to anything but a full browser. Rotation doesn't try to get past these. */
const blocked = (url: URL) =>
  Response.json(
    {
      error: `${url.hostname.replace(/^www\./, '')} checks for a full web browser before showing its pages, so Rotation can't read them. Save the product photo, or take a screenshot of the page, and add it by photo instead.`,
      blocked: true,
    },
    { status: 422 },
  );

export async function POST(request: Request) {
  if (rateLimited(request, 'link', 20)) return Response.json({ error: 'Too many links at once; try again in a minute.' }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (typeof body?.url !== 'string') return Response.json({ error: 'Send a product link.' }, { status: 400 });

  try {
    const page = await safeFetch(body.url, 'text/html,application/xhtml+xml', MAX_HTML);
    const html = page.bytes.toString('utf8');
    const product = readProductPage(html, page.url);
    if (isChallengePage(product, html)) return blocked(page.url);
    if (!product.title && !product.images.length) return Response.json({ error: "That page doesn't describe a product we can read." }, { status: 422 });
    return Response.json({ ...product, url: page.url.toString() });
  } catch (error) {
    // Stores like Madewell turn link readers away at the door (Access Denied, Too Many Requests).
    if (error instanceof RefusedError && (error.status === 403 || error.status === 429)) return blocked(error.url);
    const msg = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The store took too long to respond.';
    return Response.json({ error: msg }, { status: 422 });
  }
}
