/* Reads a screenshot of a product page from its lines of text: the product's name, the price, and the brand and store.
   The text comes from whichever text reader the device has (Apple's on an iPhone build, Tesseract elsewhere); this
   only decides what the lines mean, so it's the same everywhere. It fills in what it reads clearly and leaves the
   rest; the person checks every field before saving. */

import { KNOWN_STORES } from './catalog-meta';
import { hintFrom } from './garment-hints';

/** One line of text, positioned in fractions of the image's width (all four, so sizes compare across the image). */
export interface TextLine {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageText {
  name?: string;
  price?: number;
  brand?: string;
  store?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Buttons, menus and notices on store pages, and the phone's own status bar and browser controls. */
const UI =
  /\b(add to (bag|cart|basket)|size (guide|chart)|find your size|free (shipping|returns)|sign in|wish ?list|reviews?|rated|out of 5|you may also like|complete the look|shop (similar|the look|all)|recently viewed|pick ?up|in stock|klarna|afterpay|affirm|interest[- ]free|payments of|select (a )?size|color:|size:|details|description|share)\b/i;
/** Prices in these lines are promotions, not the product's price. */
const NOT_THE_PRICE = /\b(over|off|save|shipping|orders?|rewards?|credit|gift card|installments?|payments? of|per month|\/mo)\b/i;
const PRICE = /\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g;
const HAS_PRICE = /\$\s?\d/;
const DOMAIN = /\b(?:www\.)?((?:[a-z0-9-]+\.)+(?:com|co\.uk|co|net|org|us|ca|shop|store))\b/i;

function storeFor(domain: string): string {
  const labels = domain.toLowerCase().split('.').filter((l) => !['www', 'com', 'co', 'uk', 'net', 'org', 'us', 'ca', 'shop', 'store'].includes(l));
  for (const label of labels) {
    const exact = KNOWN_STORES.find((s) => norm(s) === label);
    if (exact) return exact;
  }
  for (const label of labels) {
    const near = KNOWN_STORES.find((s) => norm(s).length >= 3 && (label.startsWith(norm(s)) || norm(s).startsWith(label)));
    if (near) return near;
  }
  const main = labels[0] ?? domain;
  return main.charAt(0).toUpperCase() + main.slice(1);
}

/** Lines of the same size that follow each other closely, joined: product names often wrap onto a second line. */
function paragraphs(lines: TextLine[]) {
  const out: { text: string; h: number; y: number }[] = [];
  let cur: (TextLine & { parts: string[] }) | null = null;
  for (const l of lines) {
    const follows =
      cur && Math.abs(l.h - cur.h) / Math.max(l.h, cur.h) <= 0.2 && l.y - (cur.y + cur.h) <= 0.9 * cur.h && l.y >= cur.y && Math.abs(l.x - cur.x) <= 2 * cur.h;
    if (cur && follows) {
      cur.parts.push(l.text);
      cur.y = l.y;
    } else {
      if (cur) out.push({ text: cur.parts.join(' '), h: cur.h, y: cur.y });
      cur = { ...l, parts: [l.text] };
    }
  }
  if (cur) out.push({ text: cur.parts.join(' '), h: cur.h, y: cur.y });
  return out;
}

export function readPageText(raw: TextLine[]): PageText {
  const lines = raw
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text.length >= 2)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const out: PageText = {};

  // The product's name: the biggest text that names a garment, and isn't a button, a menu or a sentence.
  const names = paragraphs(lines.filter((l) => !l.text.includes('$') && !UI.test(l.text)))
    // "Crew Sweater | Store Name": the store's name after a separator isn't part of the product's.
    .map((p) => ({ ...p, text: p.text.replace(/\s+[|–—-]\s+[^|–—]{2,30}$/, (m) => (hintFrom(m) ? m : '')).trim() }))
    .filter((p) => {
      const words = p.text.split(' ').length;
      return words >= 2 && words <= 14 && p.text.length <= 100 && !!hintFrom(p.text) && !/[.!?]$/.test(p.text);
    });
  names.sort((a, b) => b.h - a.h || a.y - b.y);
  if (names[0]) out.name = names[0].text;

  // The price: the first price on the page, or the lower of a sale price and the original beside it.
  const priced = lines.filter((l) => HAS_PRICE.test(l.text) && !NOT_THE_PRICE.test(l.text));
  if (priced.length) {
    const first = priced[0];
    const near = priced.filter((l) => l.y - first.y <= 2 * first.h);
    const prices = near.flatMap((l) => [...l.text.matchAll(PRICE)].map((m) => Number(m[1].replace(/,/g, '')))).filter((p) => p > 0);
    if (prices.length) out.price = Math.min(...prices);
  }

  // The store: the site in the browser's address bar, when the screenshot shows it.
  const domain = lines.map((l) => DOMAIN.exec(l.text)?.[1]).find(Boolean);
  if (domain) out.store = storeFor(domain);

  // The brand: a known brand's name on the page (its logo or above the name), else the store.
  const brand = lines.find((l) => KNOWN_STORES.some((s) => norm(l.text) === norm(s)));
  out.brand = brand ? KNOWN_STORES.find((s) => norm(brand.text) === norm(s)) : out.store;
  if (!out.brand) delete out.brand;
  return out;
}
