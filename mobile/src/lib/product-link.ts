/* Reading a product page on the phone. The web app reads pages on its server, because a browser can't read another
   site's pages. A phone app isn't held to that, so it fetches the page itself and reads it with the web app's own
   reader (@core/product-page). No server is needed. The piece finder then finds the product in the page's photos. */

import { hintFrom, pathWords, type Hint } from '@core/garment-hints';
import { isChallengePage, readProductPage, type ProductPage } from '@core/product-page';

export type Product = ProductPage & { url: string; hint?: Hint };

/** The same reader name the web app's server uses. */
export const READER_HEADERS = { 'user-agent': 'Mozilla/5.0 (compatible; RotationLinkReader/1.0)', 'accept-language': 'en-US,en;q=0.9' };
const TIMEOUT_MS = 10_000;

const siteName = (u: URL) => u.hostname.replace(/^www\./, '');

/** What to do when a store won't show its page to an app. */
export const blockedNote =
  "checks for a full web browser before showing its pages, so Rotation can't read them. Take a screenshot of the product page and add it with Choose from Photos; the piece is cut out of the screenshot.";

/** The first web link in some pasted text, such as a store's share text: "Look at this! https://…". */
export function linkIn(text: string | null | undefined): string | null {
  const m = text?.match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[).,;!?]+$/, '') : null;
}

/** Reads a product page: its name, brand, store, price, category and photos, and what kind of piece it names. */
export async function readLink(text: string): Promise<Product> {
  const raw = linkIn(text) ?? text.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a link. Copy the product page's address and paste it here.");
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error("That doesn't look like a web link.");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), { headers: { ...READER_HEADERS, accept: 'text/html,application/xhtml+xml' }, signal: ctrl.signal });
  } catch {
    throw new Error(ctrl.signal.aborted ? 'The store took too long to respond.' : "Couldn't reach that page. Check the link and the connection.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok)
    throw new Error(res.status === 403 || res.status === 429 ? `${siteName(url)} ${blockedNote}` : `The store's page answered with an error (${res.status}).`);

  const final = new URL(res.url || url.toString());
  const page = readProductPage(await res.text(), final);
  if (isChallengePage(page)) throw new Error(`${siteName(final)} ${blockedNote}`);
  if (!page.title && !page.images.length) throw new Error("That page doesn't describe a product we can read.");
  return { ...page, url: final.toString(), hint: hintFrom(page.title, page.category, pathWords(final.toString())) };
}
