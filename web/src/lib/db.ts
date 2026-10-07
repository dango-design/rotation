/* On-device storage (IndexedDB). Phase 1 keeps every closet on the person's own device;
   accounts and sync come with Supabase in a later phase. */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Item, ListEntry, Outfit, Plan, Settings, WearEntry } from './types';

interface RotationDB extends DBSchema {
  items: { key: string; value: Item };
  images: { key: string; value: Blob };
  outfits: { key: string; value: Outfit };
  plans: { key: string; value: Plan };
  wears: { key: string; value: WearEntry };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<RotationDB>> | null = null;

export function db() {
  if (!dbPromise) {
    dbPromise = openDB<RotationDB>('rotation', 1, {
      upgrade(d) {
        d.createObjectStore('items', { keyPath: 'id' });
        d.createObjectStore('images');
        d.createObjectStore('outfits', { keyPath: 'id' });
        d.createObjectStore('plans', { keyPath: 'date' });
        d.createObjectStore('wears', { keyPath: 'id' });
        d.createObjectStore('meta');
      },
    });
  }
  return dbPromise;
}

export interface Snapshot {
  items: Item[];
  outfits: Outfit[];
  plans: Plan[];
  wears: WearEntry[];
  settings?: Settings;
  list?: ListEntry[];
}

export async function loadAll(): Promise<Snapshot & { images: Map<string, Blob> }> {
  const d = await db();
  const [items, outfits, plans, wears, settings, list, imageKeys] = await Promise.all([
    d.getAll('items'),
    d.getAll('outfits'),
    d.getAll('plans'),
    d.getAll('wears'),
    d.get('meta', 'settings') as Promise<Settings | undefined>,
    d.get('meta', 'list') as Promise<ListEntry[] | undefined>,
    d.getAllKeys('images'),
  ]);
  const images = new Map<string, Blob>();
  await Promise.all(imageKeys.map(async (k) => images.set(k, (await d.get('images', k))!)));
  return { items, outfits, plans, wears, settings, list, images };
}

export const putItem = async (item: Item) => (await db()).put('items', item);
export const deleteItem = async (id: string) => (await db()).delete('items', id);
export const putImage = async (id: string, blob: Blob) => (await db()).put('images', blob, id);
export const deleteImage = async (id: string) => (await db()).delete('images', id);
export const putOutfit = async (o: Outfit) => (await db()).put('outfits', o);
export const deleteOutfit = async (id: string) => (await db()).delete('outfits', id);
export const putPlan = async (p: Plan) => (await db()).put('plans', p);
export const deletePlan = async (date: string) => (await db()).delete('plans', date);
export const putWear = async (w: WearEntry) => (await db()).put('wears', w);
export const putSettings = async (s: Settings) => (await db()).put('meta', s, 'settings');
export const putList = async (l: ListEntry[]) => (await db()).put('meta', l, 'list');

export async function clearAll() {
  const d = await db();
  await Promise.all((['items', 'images', 'outfits', 'plans', 'wears', 'meta'] as const).map((s) => d.clear(s)));
}
