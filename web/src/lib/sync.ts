/* Sync between this device and the person's account (decision 013).

   The closet on the device is what the screens read, so the app works offline and with no account.
   Every save also notes a change in the device's outbox (db.ts). A sync sends those changes, then asks
   the account for everything that changed since the last sync, from this device or another one.

   Of two edits to the same record, the newer one wins. The server keeps the newer of what it has and
   what arrives (see the migration in supabase/), and the device keeps its own change when it is newer
   than what comes down. This file is the order of those steps; db.ts and account.ts do the reading and
   writing, so the steps can be tested with neither. */

/** The kinds of record an account keeps. Settings and the shopping list are one record each. */
export type Kind = 'item' | 'outfit' | 'plan' | 'wear' | 'settings' | 'list';

/** A change on this device that the account hasn't taken yet. One per record or photo; a newer change replaces an older one. */
export interface Change {
  /** `${kind}:${id}` */
  key: string;
  kind: Kind | 'photo';
  id: string;
  deleted: boolean;
  /** When the change was made (ISO). */
  at: string;
}

/** A record as the account stores it. */
export interface Row {
  kind: Kind;
  id: string;
  /** The record as the app stores it; null once deleted. */
  data: unknown;
  deleted: boolean;
  updated_at: string;
  /** When the server took the change; devices pull everything after the last one they saw. */
  synced_at: string;
}

export type Outgoing = Omit<Row, 'synced_at'>;

/** The device's side. */
export interface Local {
  changes(): Promise<Change[]>;
  /** The record as it is now, or undefined if it's gone. */
  read(kind: Kind, id: string): Promise<unknown>;
  readPhoto(id: string): Promise<Blob | undefined>;
  /** Forget changes the account has taken, unless the record changed again since. */
  sent(changes: Change[]): Promise<void>;
  /** Write what came down, except where this device has a newer change of its own. Returns what was written. */
  apply(rows: Row[]): Promise<Applied>;
  /** Photos that pieces on this device point to but this device doesn't have. */
  missingPhotos(): Promise<string[]>;
  savePhoto(id: string, blob: Blob): Promise<void>;
  cursor(): Promise<string | undefined>;
  setCursor(at: string): Promise<void>;
}

export interface Applied {
  rows: Row[];
  /** Photos removed from the device because their piece was deleted elsewhere. */
  droppedPhotos: string[];
}

/** The account's side. */
export interface Remote {
  push(rows: Outgoing[]): Promise<void>;
  /** Records changed after `since`, oldest first. */
  pull(since: string | undefined, limit: number): Promise<Row[]>;
  /** Adds a photo. A photo already in the account is left as it is: photo ids are never reused. */
  upload(id: string, blob: Blob): Promise<void>;
  download(id: string): Promise<Blob | null>;
  remove(ids: string[]): Promise<void>;
}

export interface SyncResult extends Applied {
  /** Photos downloaded for pieces from other devices. */
  photos: Record<string, Blob>;
  /** Changes still waiting, made while this sync ran. */
  left: number;
}

const BATCH = 200;
const PAGE = 500;
/** Pulls start a little before the last one ended, in case a change was committed late. Applying a change twice is harmless. */
const OVERLAP_MS = 10_000;

/** Photos the account didn't have, so they aren't asked for again on every sync. */
const unavailable = new Set<string>();

/** A timestamp in ms. Postgres gives microseconds, which not every JavaScript engine can parse, so they're trimmed. */
export const time = (iso: string) => Date.parse(iso.replace(/(\.\d{3})\d+/, '$1'));

/** Runs `fn` over `list`, a few at a time. */
async function few<T>(list: T[], fn: (t: T) => Promise<void>, at = 4) {
  for (let i = 0; i < list.length; i += at) await Promise.all(list.slice(i, i + at).map(fn));
}

export async function sync(local: Local, remote: Remote): Promise<SyncResult> {
  const changes = await local.changes();

  // Photos first, so a device that pulls a new piece can download its photo straight away.
  const photos = changes.filter((c) => c.kind === 'photo');
  const removed = photos.filter((c) => c.deleted).map((c) => c.id);
  if (removed.length) await remote.remove(removed);
  await few(
    photos.filter((c) => !c.deleted),
    async (c) => {
      const blob = await local.readPhoto(c.id);
      if (blob) await remote.upload(c.id, blob);
    },
  );

  const records = changes.filter((c): c is Change & { kind: Kind } => c.kind !== 'photo');
  for (let i = 0; i < records.length; i += BATCH) {
    const rows = await Promise.all(
      records.slice(i, i + BATCH).map(async (c): Promise<Outgoing> => {
        const data = c.deleted ? undefined : await local.read(c.kind, c.id);
        // A record deleted after its change was noted goes up as deleted.
        const deleted = data === undefined;
        return { kind: c.kind, id: c.id, data: deleted ? null : data, deleted, updated_at: c.at };
      }),
    );
    await remote.push(rows);
  }
  await local.sent(changes);

  const cursor = await local.cursor();
  let since = cursor ? new Date(time(cursor) - OVERLAP_MS).toISOString() : undefined;
  const applied: Applied = { rows: [], droppedPhotos: [] };
  for (;;) {
    const page = await remote.pull(since, PAGE);
    if (page.length) {
      const a = await local.apply(page);
      applied.rows.push(...a.rows);
      applied.droppedPhotos.push(...a.droppedPhotos);
      since = page[page.length - 1].synced_at;
      await local.setCursor(since);
    }
    if (page.length < PAGE) break;
  }

  const downloaded: Record<string, Blob> = {};
  await few(
    (await local.missingPhotos()).filter((id) => !unavailable.has(id)),
    async (id) => {
      const blob = await remote.download(id);
      if (!blob) return void unavailable.add(id);
      await local.savePhoto(id, blob);
      downloaded[id] = blob;
    },
  );

  return { ...applied, photos: downloaded, left: (await local.changes()).length };
}
