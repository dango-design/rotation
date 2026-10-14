/* The demo closet's photos. Each demo piece points at its store's product photo; the demo loads it through the
   image route and cuts the piece out on this device, the same way adding a piece from a product link does.
   Cutouts are kept in this browser's cache, so later visits show them straight away. Nothing is saved on Rotation's
   servers, and a photo the store has moved or blocks just leaves the piece drawn. */

import { TYPES } from './catalog-meta';
import { hintFrom } from './garment-hints';
import type { Item } from './types';
import { findInProductPhoto } from './vision/find';

const CACHE = 'rotation-demo-photos-v1';

async function cached(url: string): Promise<Blob | null> {
  try {
    const hit = await (await caches.open(CACHE)).match(url);
    return hit ? await hit.blob() : null;
  } catch {
    return null;
  }
}

async function keep(url: string, blob: Blob) {
  try {
    await (await caches.open(CACHE)).put(url, new Response(blob, { headers: { 'content-type': blob.type } }));
  } catch {
    /* no cache in this browser (private mode); the photo is cut again next visit */
  }
}

/** Lets the page paint and respond between cutouts, which each hold the main thread for a moment. */
const idle = () => new Promise<void>((done) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => done(), { timeout: 1500 }) : setTimeout(done, 50)));

/**
 * Brings in the demo pieces' photos, calling `onPhoto` as each one is ready: cached cutouts first, then the rest in
 * the order given (put the pieces on screen first). Stops as soon as `stopped()` says the demo has gone.
 */
export async function loadDemoPhotos(items: Item[], onPhoto: (id: string, cutout: Blob) => void, stopped: () => boolean) {
  const todo: Item[] = [];
  for (const it of items) {
    if (!it.imageUrl) continue;
    const hit = await cached(it.imageUrl);
    if (stopped()) return;
    if (hit) onPhoto(it.id, hit);
    else todo.push(it);
  }
  for (const it of todo) {
    await idle();
    if (stopped()) return;
    try {
      const pieces = await findInProductPhoto(it.imageUrl!, 0, hintFrom(it.name, TYPES[it.type].label));
      const cut = pieces.find((p) => p.cutout);
      if (!cut || stopped()) continue;
      await keep(it.imageUrl!, cut.blob);
      onPhoto(it.id, cut.blob);
    } catch {
      /* the store moved or blocked this photo; the piece stays drawn */
    }
  }
}
