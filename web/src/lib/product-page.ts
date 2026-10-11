/* Reads a product page's HTML: name, brand, store, price, category, and every photo that could show the product,
   best first. Product pages carry many images (the gallery, other colors, "complete the look", logos), so photos
   the page says belong to the product come first and unrelated ones are left out. */

export interface ProductPage {
  title: string;
  brand: string | null;
  store: string;
  price: number | null;
  /** Category and breadcrumb words, used with the title to tell which garment the page is about. */
  category: string;
  /** Absolute image URLs, most likely to show the product first. */
  images: string[];
}

export const MAX_IMAGES = 8;

/** Bot checks and access-denied pages that some stores show, instead of the product, to anything but a full browser. */
const CHALLENGE =
  /^\s*(client challenge|access denied|just a moment|attention required|pardon our interruption|robot or human|are you a (robot|human)|security check|request rejected|checking your browser|please verify you are a human|bot verification)\b/i;

/** The store sent a bot check instead of the product page. Rotation doesn't try to get past these. */
export const isChallengePage = (page: Pick<ProductPage, 'title'>) => CHALLENGE.test(page.title);

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', trade: '™', reg: '®' };

export const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();

/** Attributes of an HTML tag, lowercased names, decoded values. */
function attrs(tag: string) {
  const out: Record<string, string> = {};
  for (const [, name, , dq, sq, bare] of tag.matchAll(/([^\s"'<>\/=]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g))
    out[name.toLowerCase()] = decode(dq ?? sq ?? bare ?? '');
  return out;
}

const tags = (html: string, name: string) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]));

function metas(html: string, key: string) {
  return tags(html, 'meta')
    .filter((a) => (a.property ?? a.name ?? a.itemprop ?? '').toLowerCase() === key)
    .map((a) => a.content)
    .filter(Boolean);
}

type Node = Record<string, unknown>;
const isType = (n: Node, t: string) => n['@type'] === t || (Array.isArray(n['@type']) && n['@type'].includes(t));

/** Every JSON-LD object on the page, flattened out of arrays and @graph. */
function jsonLd(html: string): Node[] {
  const nodes: Node[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    nodes.push(v as Node);
    walk((v as Node)['@graph']);
  };
  for (const [, body] of html.matchAll(/<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(body.trim()));
    } catch {
      /* ignore malformed blocks */
    }
  }
  return nodes;
}

/** Image URLs from a JSON-LD image value: a string, an ImageObject, or a list of either. */
function ldImages(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(ldImages);
  if (v && typeof v === 'object') {
    const o = v as Node;
    return ldImages(o.contentUrl ?? o.url);
  }
  return [];
}

const text = (v: unknown): string | undefined => (typeof v === 'string' ? decode(v) || undefined : v && typeof v === 'object' ? text((v as Node).name) : undefined);

function ldPrice(offers: unknown): number | undefined {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  for (const o of list as Node[]) {
    const spec = o.priceSpecification as Node | undefined;
    const raw = o.price ?? o.lowPrice ?? spec?.price;
    if (raw !== undefined && raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  }
}

/** The largest candidate in a srcset ("a.jpg 400w, b.jpg 1200w"). */
function largestInSrcset(srcset: string) {
  let best: { url: string; w: number } | undefined;
  for (const part of srcset.split(/,\s+(?=\S)/)) {
    const [url, d = '1x'] = part.trim().split(/\s+/);
    const w = parseFloat(d) * (d.endsWith('x') ? 1000 : 1);
    if (url && (!best || w > best.w)) best = { url, w };
  }
  return best?.url;
}

const JUNK = /(^|[\/_.-])(logo|icon|icons|sprite|favicon|badge|flag|flags|payment|placeholder|spacer|pixel|blank|loader|loading|avatar|rating|stars?|swatch|swatches|chip|chips|social|banner|promo)([\/_.-]|$)/i;

function usable(raw: string | undefined, base: URL): URL | undefined {
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return;
  try {
    const u = new URL(raw.trim(), base);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
    if (/\.svg$/i.test(u.pathname) || JUNK.test(u.pathname)) return;
    return u;
  } catch {
    return;
  }
}

/** The width a URL asks the image server for, or 0 when it asks for the original. */
function askedWidth(u: URL) {
  for (const k of ['width', 'w', 'wid', 'sw', 'imwidth']) {
    const v = Number(u.searchParams.get(k));
    if (v) return v;
  }
  const m = /[_-](\d{2,4})x\d{0,4}(?=\.\w+$)/.exec(u.pathname);
  return m ? Number(m[1]) : 0;
}

/** Shopify serves any width; ask for one big enough to cut out cleanly instead of a gallery thumbnail. */
function bigEnough(u: URL) {
  if (u.hostname !== 'cdn.shopify.com' && !u.pathname.startsWith('/cdn/shop/')) return u;
  const out = new URL(u);
  out.pathname = out.pathname.replace(/_\d{2,4}x\d{0,4}(?=\.\w+$)/, '');
  out.searchParams.delete('height');
  out.searchParams.delete('crop');
  out.searchParams.set('width', '1200');
  return out;
}

/** One key per photo, so the same image at different sizes is only listed once. */
function photoKey(u: URL) {
  const path = u.pathname.toLowerCase().replace(/([_-])\d{2,4}x\d{0,4}(?=\.\w+$)/, '').replace(/@\dx(?=\.\w+$)/, '');
  return /\.(jpe?g|png|webp|gif|avif)$/.test(path) ? u.host + path : u.host + path + u.search;
}

const STOP = new Set(['with', 'from', 'this', 'that', 'your', 'womens', 'mens', 'women', 'men', 'unisex', 'kids', 'size', 'color', 'colour', 'shop', 'online', 'free', 'shipping']);
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)));

/** Long path tokens (product codes, file stems) shared between URLs of the same product's photos. */
const tokens = (u: URL) => new Set(u.pathname.split(/[\/_.,-]+/).filter((t) => t.length >= 5 && /\d/.test(t)));

export function readProductPage(html: string, pageUrl: URL): ProductPage {
  const ld = jsonLd(html);
  const product = ld.find((n) => isType(n, 'Product') || isType(n, 'ProductGroup'));
  const crumbs = ld.find((n) => isType(n, 'BreadcrumbList'));

  // The variant the link points to (e.g. ?variant=123 or a color-specific URL) has that color's photos. Other
  // variants' photos are left out: a different color is a different piece.
  const variants = (Array.isArray(product?.hasVariant) ? product.hasVariant : []) as Node[];
  const sameUrl = (v: Node) => {
    if (typeof v.url !== 'string') return false;
    try {
      const u = new URL(v.url, pageUrl);
      return u.pathname === pageUrl.pathname && u.search === pageUrl.search && pageUrl.search !== '';
    } catch {
      return false;
    }
  };
  const variant = variants.find(sameUrl);

  const title = decode(text(product?.name) ?? metas(html, 'og:title')[0] ?? /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '');
  const brand = text(product?.brand) ?? metas(html, 'product:brand')[0] ?? metas(html, 'og:brand')[0] ?? null;
  const store = metas(html, 'og:site_name')[0] ?? pageUrl.hostname.replace(/^www\./, '').split('.')[0];
  const metaPrice = metas(html, 'product:price:amount')[0] ?? metas(html, 'og:price:amount')[0];
  const price = ldPrice(variant?.offers) ?? ldPrice(product?.offers) ?? (metaPrice && !Number.isNaN(Number(metaPrice)) ? Number(metaPrice) : null);

  const crumbNames = ((crumbs?.itemListElement as Node[] | undefined) ?? [])
    .map((c) => text(c.name) ?? text(c.item))
    .filter((n): n is string => !!n && !/^home$/i.test(n) && n !== title);
  const category = [text(product?.category), ...metas(html, 'product:category'), ...crumbNames].filter(Boolean).join(' / ');

  // Photos the page says are the product, then everything else that looks related.
  const primary: (string | undefined)[] = [
    ...ldImages(variant?.image),
    ...ldImages(product?.image),
    ...(variant || product?.image ? [] : ldImages(variants[0]?.image)),
    ...metas(html, 'og:image:secure_url'),
    ...metas(html, 'og:image'),
    ...metas(html, 'og:image:url'),
    ...metas(html, 'twitter:image'),
    ...metas(html, 'twitter:image:src'),
    ...metas(html, 'image'),
    ...tags(html, 'link')
      .filter((a) => /(^|\s)image_src(\s|$)/i.test(a.rel ?? ''))
      .map((a) => a.href),
  ];

  const seen = new Map<string, number>();
  const images: URL[] = [];
  const add = (u: URL | undefined) => {
    if (!u) return;
    const key = photoKey(u);
    const at = seen.get(key);
    if (at !== undefined) {
      // The same photo again: keep the larger size.
      const [had, now] = [askedWidth(images[at]), askedWidth(u)];
      if (had && (!now || now > had)) images[at] = u;
      return;
    }
    if (images.length >= MAX_IMAGES) return;
    seen.set(key, images.length);
    images.push(u);
  };
  primary.forEach((raw) => add(usable(raw, pageUrl)));

  // Gallery images in the markup: kept when their URL shares a product code with a known product photo. Other
  // colors of the same product usually have the same alt text but a different code, so alt text only counts when
  // the known photos have no code. With no known product photo, large images are kept in page order.
  const titleWords = words(title);
  const known = images.map(tokens).filter((k) => k.size);
  const related = (u: URL, alt: string) => {
    const t = tokens(u);
    if (known.length) return known.some((k) => [...t].some((x) => k.has(x)));
    const a = words(alt);
    const shared = [...titleWords].filter((w) => a.has(w)).length;
    return shared >= Math.min(2, titleWords.size) && shared > 0;
  };
  const markup = [
    ...tags(html, 'link')
      .filter((a) => (a.rel ?? '').toLowerCase() === 'preload' && (a.as ?? '').toLowerCase() === 'image')
      .map((a) => ({ src: largestInSrcset(a.imagesrcset ?? '') ?? a.href, alt: '', w: 0, itemprop: '' })),
    ...tags(html, 'img').map((a) => ({
      src: largestInSrcset(a['data-srcset'] ?? a.srcset ?? '') ?? a['data-zoom-image'] ?? a['data-large_image'] ?? a['data-src'] ?? a['data-original'] ?? a.src,
      alt: a.alt ?? '',
      w: Math.min(Number(a.width) || Infinity, Number(a.height) || Infinity),
      itemprop: (a.itemprop ?? '').toLowerCase(),
    })),
  ];
  const hadPrimary = images.length > 0;
  for (const m of markup) {
    if (m.w < 150) continue;
    const u = usable(m.src, pageUrl);
    if (u && (m.itemprop === 'image' || related(u, m.alt) || (!hadPrimary && m.w !== Infinity && m.w >= 300))) add(u);
  }
  if (!images.length) for (const m of markup) if (m.w >= 150) add(usable(m.src, pageUrl));

  return {
    title: title.split(/\s[|–—-]\s/)[0].slice(0, 80),
    brand: brand ?? null,
    store,
    price: price ?? null,
    category,
    images: images.map((u) => bigEnough(u).toString()),
  };
}
