/* On-device storage (IndexedDB). The closet always lives here first, so the app works offline and with
   no account. Each save also notes the change in an outbox; when someone is signed in, sync.ts sends
   those changes to their account and brings back changes from their other devices (decision 013). */

import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';
import type { Applied, Change, Kind, Local, Row } from './sync';
import { time } from './sync';
import type { Item, ListEntry, Outfit, Plan, Settings, WearEntry } from './types';

interface RotationDB extends DBSchema {
  items: { key: string; value: Item };
  images: { key: string; value: Blob };
  outfits: { key: string; value: Outfit };
  plans: { key: string; value: Plan };
  wears: { key: string; value: WearEntry };
  meta: { key: string; value: unknown };
  outbox: { key: string; value: Change };
}

type Tx = IDBPTransaction<RotationDB, StoreNames<RotationDB>[], 'readwrite'>;

let dbPromise: Promise<IDBPDatabase<RotationDB>> | null = null;

export function db() {
  if (!dbPromise) {
    dbPromise = openDB<RotationDB>('rotation', 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('items', { keyPath: 'id' });
          d.createObjectStore('images');
          d.createObjectStore('outfits', { keyPath: 'id' });
          d.createObjectStore('plans', { keyPath: 'date' });
          d.createObjectStore('wears', { keyPath: 'id' });
          d.createObjectStore('meta');
        }
        if (oldVersion < 2) d.createObjectStore('outbox', { keyPath: 'key' });
      },
      // A newer version of the app opened in another tab: reload so this tab runs it too.
      blocking() {
        window.location.reload();
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

const STORE = { item: 'items', outfit: 'outfits', plan: 'plans', wear: 'wears', settings: 'meta', list: 'meta', photo: 'images' } as const;
const CLOSET = ['items', 'images', 'outfits', 'plans', 'wears', 'meta'] as const;

/** Writes to the closet and notes the change for the account, in one transaction. */
async function change(kind: Change['kind'], id: string, deleted: boolean, write: (tx: Tx) => Promise<unknown>) {
  const tx = (await db()).transaction([STORE[kind], 'outbox'], 'readwrite') as unknown as Tx;
  await Promise.all([write(tx), tx.objectStore('outbox').put({ key: `${kind}:${id}`, kind, id, deleted, at: new Date().toISOString() }), tx.done]);
}

export const putItem = (item: Item) => change('item', item.id, false, (tx) => tx.objectStore('items').put(item));
export const deleteItem = (id: string) => change('item', id, true, (tx) => tx.objectStore('items').delete(id));
export const putImage = (id: string, blob: Blob) => change('photo', id, false, (tx) => tx.objectStore('images').put(blob, id));
export const deleteImage = (id: string) => change('photo', id, true, (tx) => tx.objectStore('images').delete(id));
export const putOutfit = (o: Outfit) => change('outfit', o.id, false, (tx) => tx.objectStore('outfits').put(o));
export const deleteOutfit = (id: string) => change('outfit', id, true, (tx) => tx.objectStore('outfits').delete(id));
export const putPlan = (p: Plan) => change('plan', p.date, false, (tx) => tx.objectStore('plans').put(p));
export const deletePlan = (date: string) => change('plan', date, true, (tx) => tx.objectStore('plans').delete(date));
export const putWear = (w: WearEntry) => change('wear', w.id, false, (tx) => tx.objectStore('wears').put(w));
export const putSettings = (s: Settings) => change('settings', 'settings', false, (tx) => tx.objectStore('meta').put(s, 'settings'));
export const putList = (l: ListEntry[]) => change('list', 'list', false, (tx) => tx.objectStore('meta').put(l, 'list'));

/** Empties the closet on this device, including changes not yet sent and which account it belonged to. */
export async function clearAll() {
  const d = await db();
  await Promise.all([...CLOSET, 'outbox' as const].map((s) => d.clear(s)));
}

/* Sync bookkeeping, kept in meta beside the settings. */

interface SyncMeta {
  /** The account this closet belongs to. */
  owner?: string;
  /** synced_at of the last record pulled. */
  cursor?: string;
}

export const syncMeta = async () => ((await (await db()).get('meta', 'sync')) ?? {}) as SyncMeta;
export const setSyncMeta = async (m: SyncMeta) => (await db()).put('meta', m, 'sync');

/** Notes everything on the device as a change, so the first sign-in adds this closet to the account.
    The changes are dated long ago: where the account already has a record, its version is kept. */
export async function queueEverything() {
  const d = await db();
  const tx = d.transaction([...CLOSET, 'outbox'], 'readwrite') as unknown as Tx;
  const outbox = tx.objectStore('outbox');
  const at = new Date(0).toISOString();
  const note = async (kind: Change['kind'], id: string) => {
    const key = `${kind}:${id}`;
    if (!(await outbox.get(key))) await outbox.put({ key, kind, id, deleted: false, at });
  };
  const [items, outfits, plans, wears, photos, settings, list] = await Promise.all([
    tx.objectStore('items').getAllKeys(),
    tx.objectStore('outfits').getAllKeys(),
    tx.objectStore('plans').getAllKeys(),
    tx.objectStore('wears').getAllKeys(),
    tx.objectStore('images').getAllKeys(),
    tx.objectStore('meta').get('settings'),
    tx.objectStore('meta').get('list'),
  ]);
  await Promise.all([
    ...items.map((id) => note('item', id)),
    ...outfits.map((id) => note('outfit', id)),
    ...plans.map((id) => note('plan', id)),
    ...wears.map((id) => note('wear', id)),
    ...photos.map((id) => note('photo', id)),
    ...(settings ? [note('settings', 'settings')] : []),
    ...(list ? [note('list', 'list')] : []),
  ]);
  await tx.done;
}

/** The device's side of a sync. Writes here don't note changes: they came from the account. */
export const local: Local = {
  async changes() {
    return (await db()).getAll('outbox');
  },

  async read(kind: Kind, id: string) {
    const d = await db();
    if (kind === 'settings' || kind === 'list') return d.get('meta', kind);
    return d.get(STORE[kind], id);
  },

  async readPhoto(id) {
    return (await db()).get('images', id);
  },

  async sent(changes) {
    const tx = (await db()).transaction('outbox', 'readwrite');
    await Promise.all([
      ...changes.map(async (c) => {
        const now = await tx.store.get(c.key);
        if (now && now.at === c.at) await tx.store.delete(c.key);
      }),
      tx.done,
    ]);
  },

  async apply(rows: Row[]): Promise<Applied> {
    const tx = (await db()).transaction([...CLOSET, 'outbox'], 'readwrite') as unknown as Tx;
    const outbox = tx.objectStore('outbox');
    const applied: Applied = { rows: [], droppedPhotos: [] };
    for (const r of rows) {
      const key = `${r.kind}:${r.id}`;
      const mine = await outbox.get(key);
      // This device changed it more recently; that change goes up on the next sync.
      if (mine && time(mine.at) > time(r.updated_at)) continue;
      if (mine) await outbox.delete(key);
      if (r.kind === 'settings' || r.kind === 'list') {
        if (r.deleted) await tx.objectStore('meta').delete(r.kind);
        else await tx.objectStore('meta').put(r.data, r.kind);
      } else if (r.deleted) {
        if (r.kind === 'item') {
          const it = await tx.objectStore('items').get(r.id);
          if (it?.imageId) {
            await tx.objectStore('images').delete(it.imageId);
            applied.droppedPhotos.push(it.imageId);
          }
        }
        await tx.objectStore(STORE[r.kind]).delete(r.id);
      } else {
        await tx.objectStore(STORE[r.kind]).put(r.data as never);
      }
      applied.rows.push(r);
    }
    await tx.done;
    return applied;
  },

  async missingPhotos() {
    const d = await db();
    const [items, have] = await Promise.all([d.getAll('items'), d.getAllKeys('images')]);
    const set = new Set(have);
    return items.flatMap((i) => (i.imageId && !set.has(i.imageId) ? [i.imageId] : []));
  },

  async savePhoto(id, blob) {
    await (await db()).put('images', blob, id);
  },

  async cursor() {
    return (await syncMeta()).cursor;
  },

  async setCursor(cursor) {
    await setSyncMeta({ ...(await syncMeta()), cursor });
  },
};
