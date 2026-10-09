/* Fetches public web pages and images for link imports.
   Only public http(s) hosts are fetched; private and local network addresses are refused at every redirect. */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (compatible; RotationLinkReader/1.0)';

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
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivate(a.address))) throw new Error('That address is not allowed.');
}

/** Fetch with a size limit, following up to three redirects and re-checking each hop. */
export async function safeFetch(raw: string, accept: string, maxBytes: number) {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept, 'user-agent': USER_AGENT, 'accept-language': 'en-US,en;q=0.9' },
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

/** Raster image types the browser can decode for background removal. SVG is excluded: it can carry scripts. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const hits = new Map<string, number[]>();

/**
 * Whether a caller has made more than `perMinute` requests to `route` in the last minute. Best effort: counts are
 * kept in memory per server instance, by the address the request came from.
 */
export function rateLimited(request: Request, route: string, perMinute: number) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
  const key = `${route} ${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  if (hits.size > 10_000) hits.clear();
  hits.set(key, recent);
  return recent.length > perMinute;
}

/** Browsers say when a request comes from another site; those are refused so other pages can't use these routes. */
export function fromAnotherSite(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  return site === 'cross-site' || site === 'same-site';
}
