import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Remote, Row } from './sync';
import type { Item } from './types';

/* Two "devices", each with its own IndexedDB, syncing through a fake account that keeps the newer of
   two edits the way the database trigger does (supabase/migrations). */

/** A device: its own copy of db.ts and sync.ts, bound to its own empty database. */
async function device() {
  vi.resetModules();
  globalThis.indexedDB = new IDBFactory();
  const db = await import('./db');
  const { sync } = await import('./sync');
  await db.db();
  return { ...db, sync: (account: Account) => sync(db.local, account.remote()) };
}

class Account {
  rows = new Map<string, Row>();
  photos = new Map<string, Blob>();
  private clock = Date.parse('2026-10-10T12:00:00Z');

  remote(): Remote {
    return {
      push: async (rows) => {
        for (const r of rows) {
          const key = `${r.kind}:${r.id}`;
          const old = this.rows.get(key);
          const keep = old && Date.parse(r.updated_at) < Date.parse(old.updated_at);
          this.rows.set(key, { ...(keep ? old : r), synced_at: new Date((this.clock += 60_000)).toISOString() });
        }
      },
      pull: async (since, limit) =>
        [...this.rows.values()]
          .filter((r) => !since || Date.parse(r.synced_at) > Date.parse(since))
          .sort((a, b) => a.synced_at.localeCompare(b.synced_at))
          .slice(0, limit),
      upload: async (id, blob) => void (this.photos.has(id) || this.photos.set(id, blob)),
      download: async (id) => this.photos.get(id) ?? null,
      remove: async (ids) => ids.forEach((id) => this.photos.delete(id)),
    };
  }
}

const piece = (id: string, name = 'Oxford shirt'): Item => ({
  id,
  name,
  brand: 'Uniqlo',
  source: 'manual',
  type: 'shirt',
  cat: 'top',
  color: '#ffffff',
  colorName: 'White',
  tone: 'neutral',
  f: 2,
  wears: 0,
  createdAt: '2026-10-01T12:00:00.000Z',
});

const at = (iso: string) => vi.setSystemTime(new Date(iso));

afterEach(() => vi.useRealTimers());

describe('sync', () => {
  it('adds this device’s closet to the account and brings it to another device', async () => {
    const account = new Account();
    const laptop = await device();
    await laptop.putItem({ ...piece('p1'), imageId: 'p1' });
    await laptop.putImage('p1', new Blob(['photo'], { type: 'image/png' }));
    await laptop.putSettings({ city: 'Oakland', favoriteStores: ['Gap'], showShop: true, occasion: 'work' });
    const sent = await laptop.sync(account);

    expect(sent.left).toBe(0);
    expect(account.rows.has('item:p1')).toBe(true);
    expect(account.photos.has('p1')).toBe(true);

    const phone = await device();
    const got = await phone.sync(account);
    const closet = await phone.loadAll();
    expect(closet.items.map((i) => i.name)).toEqual(['Oxford shirt']);
    expect(closet.settings?.city).toBe('Oakland');
    expect(closet.images.has('p1')).toBe(true);
    expect(Object.keys(got.photos)).toEqual(['p1']);
    // Nothing on the phone to send back.
    expect(await phone.local.changes()).toEqual([]);
  });

  it('keeps the newer edit when two devices change the same piece', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const account = new Account();
    const laptop = await device();
    const phone = await device();
    at('2026-10-10T09:00:00Z');
    await laptop.putItem(piece('p1'));
    await laptop.sync(account);
    await phone.sync(account);

    // The phone's edit is newer, but the laptop syncs second.
    at('2026-10-10T10:00:00Z');
    await laptop.putItem(piece('p1', 'Laptop name'));
    at('2026-10-10T10:05:00Z');
    await phone.putItem(piece('p1', 'Phone name'));
    await phone.sync(account);
    await laptop.sync(account);

    expect((account.rows.get('item:p1')!.data as Item).name).toBe('Phone name');
    expect((await laptop.loadAll()).items[0].name).toBe('Phone name');
    expect(await laptop.local.changes()).toEqual([]);
  });

  it('keeps a change made on this device when it’s newer than what comes down', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const phone = await device();
    at('2026-10-10T10:05:00Z');
    await phone.putItem(piece('p1', 'Mine, newer'));

    const older: Row = { kind: 'item', id: 'p1', data: piece('p1', 'Theirs, older'), deleted: false, updated_at: '2026-10-10T10:00:00Z', synced_at: '2026-10-10T10:06:00Z' };
    const applied = await phone.local.apply([older]);

    expect(applied.rows).toEqual([]);
    expect((await phone.loadAll()).items[0].name).toBe('Mine, newer');
    expect((await phone.local.changes()).map((c) => c.key)).toEqual(['item:p1']);
  });

  it('doesn’t forget a change made while the last one was being sent', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const phone = await device();
    at('2026-10-10T10:00:00Z');
    await phone.putItem(piece('p1'));
    const sending = await phone.local.changes();
    at('2026-10-10T10:00:01Z');
    await phone.putItem(piece('p1', 'Renamed mid-sync'));
    await phone.local.sent(sending);

    expect((await phone.local.changes()).map((c) => c.at)).toEqual(['2026-10-10T10:00:01.000Z']);
  });

  it('on first sign-in, keeps what the account already has and adds what’s new', async () => {
    const account = new Account();
    const laptop = await device();
    await laptop.putItem(piece('p1', 'In the account'));
    await laptop.sync(account);

    // An older copy of the closet, saved before accounts existed, plus a piece the account doesn't have.
    const phone = await device();
    await phone.putItem(piece('p1', 'Old copy'));
    await phone.putItem(piece('p2', 'Only on the phone'));
    await (await phone.db()).clear('outbox');
    await phone.queueEverything();
    await phone.sync(account);

    expect((account.rows.get('item:p1')!.data as Item).name).toBe('In the account');
    expect(account.rows.has('item:p2')).toBe(true);
    expect((await phone.loadAll()).items.map((i) => i.name).sort()).toEqual(['In the account', 'Only on the phone']);
  });

  it('deletes a piece and its photo on the other device', async () => {
    const account = new Account();
    const laptop = await device();
    await laptop.putItem({ ...piece('p1'), imageId: 'p1' });
    await laptop.putImage('p1', new Blob(['photo'], { type: 'image/png' }));
    await laptop.sync(account);
    const phone = await device();
    await phone.sync(account);
    expect((await phone.loadAll()).images.has('p1')).toBe(true);

    await laptop.deleteItem('p1');
    await laptop.deleteImage('p1');
    await laptop.sync(account);
    expect(account.rows.get('item:p1')).toMatchObject({ deleted: true, data: null });
    expect(account.photos.has('p1')).toBe(false);

    const got = await phone.sync(account);
    const closet = await phone.loadAll();
    expect(closet.items).toEqual([]);
    expect(closet.images.has('p1')).toBe(false);
    expect(got.droppedPhotos).toEqual(['p1']);
  });
});
