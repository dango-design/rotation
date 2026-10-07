/* Reads a product page someone pastes: name, brand, store, price and the product photo.
   Only public http(s) hosts are fetched; private and local network addresses are refused. */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_HTML = 2_000_000;
const MAX_IMAGE = 5_000_000;
const TIMEOUT_MS = 8000;

function isPrivate(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('::ffff:');
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only web links are supported.');
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivate(a.address))) throw new Error('That address is not allowed.');
}

/** Fetch with a size limit, following up to three redirects and re-checking each hop. */
async function safeFetch(raw: string, accept: string, maxBytes: number) {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept, 'user-agent': 'Mozilla/5.0 (compatible; RotationLinkReader/1.0)', 'accept-language': 'en-US,en;q=0.9' },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url);
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`The store returned ${res.status}.`);
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('That page is too large to read.');
      }
      chunks.push(value);
    }
    return { url, type: res.headers.get('content-type') ?? '', bytes: Buffer.concat(chunks) };
  }
  throw new Error('Too many redirects.');
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function meta(html: string, key: string) {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i').exec(html);
  return decode((a ?? b)?.[1] ?? '') || undefined;
}

type LdProduct = { '@type'?: string | string[]; name?: string; brand?: string | { name?: string }; image?: string | string[] | { url?: string }; offers?: { price?: string | number } | { price?: string | number }[] };

function findProduct(node: unknown): LdProduct | undefined {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.map(findProduct).find(Boolean);
  const n = node as Record<string, unknown>;
  const type = n['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return n as LdProduct;
  return findProduct(n['@graph']);
}

function jsonLdProduct(html: string) {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    try {
      const p = findProduct(JSON.parse(body));
      if (p) return p;
    } catch {
      /* ignore malformed blocks */
    }
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.url !== 'string') return Response.json({ error: 'Send a product link.' }, { status: 400 });

  try {
    const page = await safeFetch(body.url, 'text/html,application/xhtml+xml', MAX_HTML);
    const html = page.bytes.toString('utf8');
    const ld = jsonLdProduct(html);

    const offers = Array.isArray(ld?.offers) ? ld?.offers[0] : ld?.offers;
    const priceRaw = offers?.price ?? meta(html, 'product:price:amount') ?? meta(html, 'og:price:amount');
    const price = priceRaw !== undefined && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : undefined;
    const brand = typeof ld?.brand === 'string' ? ld.brand : ld?.brand?.name;
    const ldImage = typeof ld?.image === 'string' ? ld.image : Array.isArray(ld?.image) ? ld.image[0] : ld?.image?.url;
    const imageUrl = ldImage ?? meta(html, 'og:image') ?? meta(html, 'twitter:image');
    const store = meta(html, 'og:site_name') ?? page.url.hostname.replace(/^www\./, '').split('.')[0];
    const title = decode(ld?.name ?? meta(html, 'og:title') ?? /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '');

    let image: string | null = null;
    if (imageUrl) {
      try {
        const img = await safeFetch(new URL(imageUrl, page.url).toString(), 'image/*', MAX_IMAGE);
        if (img.type.startsWith('image/')) image = `data:${img.type.split(';')[0]};base64,${img.bytes.toString('base64')}`;
      } catch {
        /* keep going without a photo */
      }
    }

    if (!title && !image) return Response.json({ error: "That page doesn't describe a product we can read." }, { status: 422 });
    return Response.json({ title: title.split(/\s[|–-]\s/)[0].slice(0, 80), brand: brand ?? null, store, price: price ?? null, image });
  } catch (error) {
    const msg = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The store took too long to respond.';
    return Response.json({ error: msg }, { status: 422 });
  }
}
