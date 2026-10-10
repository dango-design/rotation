'use client';

/* App state. Real closets persist to IndexedDB on the device and to the person's account (decision 013).
   Building a closet and saving need an account (decision 014): signed out, nothing is saved, and anything
   that would save asks to sign in first. `?demo` loads Jordan's demo closet in memory only, so anyone can
   build outfits without an account and share the link without touching anyone's data. A fixture (Storybook)
   is also held in memory, with the weather given instead of fetched, so every render is repeatable. */

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as cloud from './account';
import type { Account } from './account';
import { CATALOG } from './catalog';
import { TYPES } from './catalog-meta';
import * as store from './db';
import { todayISO } from './dates';
import { demoData } from './demo';
import { sync, type Row, type SyncResult } from './sync';
import type { Background, Item, Layout, ListEntry, Outfit, OutfitSlots, Piece, Plan, Settings, Slot, WearEntry } from './types';
import { wornOn } from './wear';
import { forecast, geocode, skyWord, type Forecast } from './weather';

export const DEFAULT_SETTINGS: Settings = { city: '', favoriteStores: [], showShop: true, occasion: 'work' };

export interface Draft {
  name: string;
  slots: OutfitSlots;
  layout?: Layout;
  bg?: Background;
  focus: Slot;
  /** The day to plan it for, when it was started from a day on Today. */
  date?: string;
}

interface State {
  ready: boolean;
  demo: boolean;
  items: Item[];
  images: Record<string, string>;
  outfits: Outfit[];
  plans: Plan[];
  wears: WearEntry[];
  settings: Settings;
  list: ListEntry[];
  /** The account this device's closet belongs to, from the last sign-in here. Null when it belongs to no one. */
  owner: string | null;
}

/** A closet held in memory for Storybook and tests. Nothing loads from or saves to the device. */
export interface Fixture extends Partial<Pick<State, 'demo' | 'items' | 'images' | 'outfits' | 'plans' | 'wears' | 'list'>> {
  settings?: Partial<Settings>;
  /** Used as is; a fixture never fetches the weather. */
  weather?: Forecast | null;
  draft?: Draft;
  /** Open the outfit board beside the closet. */
  building?: boolean;
  /** Show the sign-in form as if this build had accounts set up. Nothing is sent. Signed out, saving then asks to sign in,
      and entering any code signs in as a made-up account. On when `account` is given. */
  accountsOn?: boolean;
  /** Signed in, for showing the account screens. Nothing syncs. */
  account?: Account;
  syncState?: SyncState;
}

/** Where the closet stands with the account: off when no one is signed in. */
export type SyncState = 'off' | 'syncing' | 'synced' | 'offline' | 'error';

const EMPTY: State = { ready: false, demo: false, items: [], images: {}, outfits: [], plans: [], wears: [], settings: DEFAULT_SETTINGS, list: [], owner: null };

/* Closets saved before bags and jewelry had their own categories kept every accessory in one "acc" slot.
   Each piece's category now comes from its type, and a bag or piece of jewelry moves to its own slot. */
function migrate<T extends { slots: OutfitSlots }>(list: T[], items: Item[]): T[] {
  return list.map((o) => {
    const it = o.slots.acc ? items.find((i) => i.id === o.slots.acc) : undefined;
    if (!it || it.cat === 'acc') return o;
    const { acc, ...rest } = o.slots;
    return { ...o, slots: { ...rest, [it.cat === 'dress' ? 'top' : it.cat]: acc } };
  });
}
const withCats = (items: Item[]) => items.map((i) => (TYPES[i.type] && TYPES[i.type].cat !== i.cat ? { ...i, cat: TYPES[i.type].cat } : i));
const byCreated = (items: Item[]) => [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/** The closet as saved on this device. */
async function fromDevice(): Promise<State> {
  const [d, meta] = await Promise.all([store.loadAll(), store.syncMeta()]);
  const images: Record<string, string> = {};
  d.images.forEach((blob, id) => (images[id] = URL.createObjectURL(blob)));
  const items = byCreated(withCats(d.items));
  return {
    ready: true,
    demo: false,
    items,
    images,
    outfits: migrate(d.outfits, items),
    plans: migrate(d.plans, items),
    wears: migrate(d.wears, items),
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
    list: d.list ?? [],
    owner: meta.owner ?? null,
  };
}

/** Replaces, adds or removes one record in a list, keeping the others in place. */
function put<T>(list: T[], key: (t: T) => string, id: string, value: T | null): T[] {
  const at = list.findIndex((x) => key(x) === id);
  if (!value) return at < 0 ? list : list.filter((_, i) => i !== at);
  return at < 0 ? [...list, value] : list.map((x, i) => (i === at ? value : x));
}

/** Folds changes from the account into the closet on screen. `photos` are object URLs for photos just downloaded. */
function mergeRows(p: State, rows: Row[], photos: Record<string, string>, dropped: string[]): State {
  if (!rows.length && !Object.keys(photos).length && !dropped.length) return p;
  let { items, outfits, plans, wears, settings, list } = p;
  for (const r of rows) {
    const v = r.deleted ? null : r.data;
    if (r.kind === 'item') items = put(items, (i) => i.id, r.id, v as Item | null);
    else if (r.kind === 'outfit') outfits = put(outfits, (o) => o.id, r.id, v as Outfit | null);
    else if (r.kind === 'plan') plans = put(plans, (x) => x.date, r.id, v as Plan | null);
    else if (r.kind === 'wear') wears = put(wears, (w) => w.id, r.id, v as WearEntry | null);
    else if (r.kind === 'settings') settings = { ...DEFAULT_SETTINGS, ...(v as Settings | null) };
    else if (r.kind === 'list') list = (v as ListEntry[] | null) ?? [];
  }
  items = byCreated(withCats(items));
  const images = { ...p.images, ...photos };
  for (const id of dropped) {
    if (images[id]) URL.revokeObjectURL(images[id]);
    delete images[id];
  }
  return { ...p, items, images, outfits: migrate(outfits, items), plans: migrate(plans, items), wears: migrate(wears, items), settings, list };
}

/** How long after a change to sync, so a burst of edits goes up together. */
const SYNC_DELAY = 1500;
/** How often an open app checks the account for changes from other devices. */
const SYNC_EVERY = 60_000;

const uid =() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

function useStoreValue(fixture?: Fixture) {
  const [s, setS] = useState<State>(() =>
    fixture
      ? {
          ready: true,
          demo: fixture.demo ?? false,
          items: fixture.items ?? [],
          images: fixture.images ?? {},
          outfits: fixture.outfits ?? [],
          plans: fixture.plans ?? [],
          wears: fixture.wears ?? [],
          settings: { ...DEFAULT_SETTINGS, ...fixture.settings },
          list: fixture.list ?? [],
          owner: fixture.account?.id ?? null,
        }
      : EMPTY,
  );
  /** Set once: a fixture keeps its data in memory and its weather fixed. */
  const [fixed] = useState(() => (fixture ? { weather: fixture.weather ?? null } : null));
  const [draft, setDraft] = useState<Draft>(fixture?.draft ?? { name: 'New outfit', slots: {}, focus: 'top' });
  /** The outfit board is open beside the closet. */
  const [building, setBuilding] = useState(fixture?.building ?? false);
  const [forecastFor, setForecastFor] = useState<{ key: string; data: Forecast | null } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (fixed) return;
    const demo = new URLSearchParams(window.location.search).has('demo');
    if (demo) {
      // Deferred so the first render matches the server; demo mode is chosen once per page load.
      queueMicrotask(() => {
        const d = demoData();
        setS({ ...EMPTY, ready: true, demo: true, items: d.items, plans: d.plans, wears: d.wears, settings: d.settings });
        setDraft({ name: 'Client presentation', slots: d.plans[0].slots, focus: 'bottom' });
      });
      return;
    }
    fromDevice()
      .then(setS)
      .catch(() => setS({ ...EMPTY, ready: true }));
  }, [fixed]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }, []);

  /* The account. `remote` is set while someone is signed in and this device's closet is theirs. A fixture never
     picks up this build's Supabase settings, so a story looks the same on every machine. */
  const [accountsOn] = useState(() => (fixture ? (fixture.accountsOn ?? Boolean(fixture.account)) : cloud.accountsOn));
  const [account, setAccount] = useState<Account | null>(fixture?.account ?? null);
  const [syncState, setSyncState] = useState<SyncState>(fixture?.syncState ?? (fixture?.account ? 'synced' : 'off'));
  const remote = useRef<ReturnType<typeof cloud.remoteFor> | null>(null);
  const accountId = useRef<string | null>(null);
  const running = useRef<Promise<number> | null>(null);
  const again = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Building a closet and saving need an account (decision 014). Signed out, nothing is saved: the actions below
     do nothing, and the screens ask to sign in first with `requireAccount`. The demo is a sandbox that's never
     saved, and a build without accounts set up keeps the closet on the device, as before. A closet that belongs
     to an account stays open while its session lapses (offline, say); its changes go up at the next sign-in. */
  const needsAccount = accountsOn && s.ready && !s.demo && !s.owner;
  /** For actions run later, after a sign-in, which would otherwise see the closet as it was when they were made. */
  const locked = useRef(needsAccount);
  useLayoutEffect(() => {
    locked.current = needsAccount;
  }, [needsAccount]);
  /** Why the sign-in prompt is open, as in "Sign in to save this outfit". */
  const [signInAsk, setSignInAsk] = useState<string | null>(null);
  /** What the person was doing when asked to sign in, to finish once their closet is here. */
  const pending = useRef<(() => void) | null>(null);

  /** Runs `then` straight away when this closet is saved; signed out, asks to sign in first and runs it after.
      `why` finishes "Sign in to …". */
  const requireAccount = useCallback((why: string, then: () => void) => {
    if (!locked.current) return then();
    pending.current = then;
    setSignInAsk(why);
  }, []);

  const closeSignIn = useCallback(() => {
    pending.current = null;
    setSignInAsk(null);
  }, []);

  /** After signing in from the prompt, once the first sync has brought the account's closet here: close the prompt
      and finish what the person started. Waiting for the account's closet keeps a settings or shopping list change
      from replacing the account's copy. If the account can't be reached, the person starts again. */
  const settleSignIn = useCallback(
    (ok: boolean) => {
      const then = pending.current;
      pending.current = null;
      setSignInAsk(null);
      toast(ok ? 'Signed in' : "Signed in. Your closet will show up when Rotation can reach your account.");
      if (ok) then?.();
    },
    [toast],
  );
  const asking = useRef(false);
  useLayoutEffect(() => {
    asking.current = signInAsk !== null;
  }, [signInAsk]);

  /** Swaps the closet on screen for a new one, letting go of the old photos. */
  const replace = useCallback((next: State) => {
    setS((p) => {
      Object.values(p.images).forEach((u) => URL.revokeObjectURL(u));
      return next;
    });
  }, []);

  /** Sends this device's changes and brings back the account's. Resolves to the number of changes still waiting. */
  const runSync = useCallback((): Promise<number> => {
    if (fixed) return Promise.resolve(0);
    if (running.current) {
      again.current = true;
      return running.current;
    }
    const run = (async () => {
      let left = (await store.local.changes()).length;
      let ok = false;
      do {
        again.current = false;
        ok = false;
        const r = remote.current;
        if (!r) break;
        if (!navigator.onLine) {
          setSyncState('offline');
          break;
        }
        setSyncState('syncing');
        try {
          const res: SyncResult = await sync(store.local, r);
          if (remote.current !== r) break;
          const urls = Object.fromEntries(Object.entries(res.photos).map(([id, b]) => [id, URL.createObjectURL(b)]));
          setS((p) => mergeRows(p, res.rows, urls, res.droppedPhotos));
          left = res.left;
          ok = true;
          setSyncState(left ? 'syncing' : 'synced');
          again.current ||= left > 0;
        } catch {
          setSyncState(navigator.onLine ? 'error' : 'offline');
          break;
        }
      } while (again.current);
      if (asking.current && remote.current) settleSignIn(ok);
      return left;
    })();
    running.current = run;
    return run.finally(() => (running.current = null));
  }, [fixed, settleSignIn]);

  const scheduleSync = useCallback(() => {
    if (!remote.current) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void runSync(), SYNC_DELAY);
  }, [runSync]);

  // Follows sign-in and sign-out, here or in another tab.
  const live = !fixed && s.ready && !s.demo;
  useEffect(() => {
    const sb = cloud.supabase();
    if (!live || !sb) return;
    let gone = false;

    const start = async (a: Account) => {
      if (remote.current && accountId.current === a.id) return;
      const meta = await store.syncMeta();
      if (gone) return;
      if (meta.owner && meta.owner !== a.id) {
        // Another account's closet was left on this device. It isn't this person's to see or upload.
        await store.clearAll();
        replace({ ...EMPTY, ready: true });
      }
      if (meta.owner !== a.id) {
        // First sign-in on this device: add the closet already here to the account.
        await store.queueEverything();
        await store.setSyncMeta({ owner: a.id });
      }
      remote.current = cloud.remoteFor(sb, a.id);
      accountId.current = a.id;
      setS((p) => (p.owner === a.id ? p : { ...p, owner: a.id }));
      setAccount(a);
      void runSync();
    };

    const stop = async () => {
      if (!remote.current) return;
      remote.current = null;
      accountId.current = null;
      setAccount(null);
      setSyncState('off');
      // Signing out in another tab empties the closet on this device; show what's left.
      replace(await fromDevice());
    };

    // Supabase advises against awaiting its calls inside this callback, so the work runs just after.
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      const a = cloud.toAccount(session?.user);
      setTimeout(() => void (gone ? undefined : a ? start(a) : stop()), 0);
    });
    return () => {
      gone = true;
      data.subscription.unsubscribe();
    };
  }, [live, runSync, replace]);

  // While signed in: sync when the app comes back into view, gets focus or goes online, and every minute while it's open.
  // Focus matters on its own: switching back to a window that stayed in view doesn't change its visibility.
  useEffect(() => {
    if (!account || fixed) return;
    const nudge = () => document.visibilityState === 'visible' && void runSync();
    const offline = () => setSyncState('offline');
    const every = setInterval(nudge, SYNC_EVERY);
    document.addEventListener('visibilitychange', nudge);
    window.addEventListener('focus', nudge);
    window.addEventListener('online', nudge);
    window.addEventListener('offline', offline);
    return () => {
      clearInterval(every);
      document.removeEventListener('visibilitychange', nudge);
      window.removeEventListener('focus', nudge);
      window.removeEventListener('online', nudge);
      window.removeEventListener('offline', offline);
    };
  }, [account, fixed, runSync]);

  // Weather for the saved city; a forecast for an old city is ignored.
  const { lat, lon } = s.settings;
  const placeKey = lat !== undefined && lon !== undefined ? `${lat},${lon}` : '';
  useEffect(() => {
    if (!placeKey || fixed) return;
    const [la, lo] = placeKey.split(',').map(Number);
    forecast(la, lo)
      .then((data) => setForecastFor({ key: placeKey, data }))
      .catch(() => setForecastFor({ key: placeKey, data: null }));
  }, [placeKey, fixed]);
  const weather = fixed ? fixed.weather : placeKey && forecastFor?.key === placeKey ? forecastFor.data : null;

  const persist = useCallback(<T,>(fn: () => Promise<T>) => (s.demo || fixed ? undefined : void fn().then(scheduleSync, () => {})), [s.demo, fixed, scheduleSync]);

  const itemById = useCallback((id?: string) => (id ? s.items.find((i) => i.id === id) : undefined), [s.items]);
  const wearableById = useCallback(
    (id?: string): Item | Piece | undefined => (id ? s.items.find((i) => i.id === id) ?? CATALOG.find((p) => p.id === id) : undefined),
    [s.items],
  );

  const addItem = useCallback(
    (fields: Omit<Item, 'id' | 'createdAt' | 'wears'> & { wears?: number }, image?: Blob) => {
      if (locked.current) return;
      const item: Item = { wears: 0, ...fields, id: uid(), createdAt: new Date().toISOString() };
      if (image) item.imageId = item.id;
      setS((p) => ({ ...p, items: [...p.items, item], images: image ? { ...p.images, [item.id]: URL.createObjectURL(image) } : p.images }));
      persist(async () => {
        if (image) await store.putImage(item.id, image);
        await store.putItem(item);
      });
      return item;
    },
    [persist],
  );

  const updateItem = useCallback(
    (item: Item) => {
      if (locked.current) return;
      setS((p) => ({ ...p, items: p.items.map((i) => (i.id === item.id ? item : i)) }));
      persist(() => store.putItem(item));
    },
    [persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      if (locked.current) return;
      setS((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
      persist(async () => {
        await store.deleteItem(id);
        await store.deleteImage(id);
      });
    },
    [persist],
  );

  /** Log an outfit as worn: adds a wear to every piece and records the day. */
  const wear = useCallback(
    (slots: OutfitSlots, date = todayISO(), layout?: Layout, bg?: Background) => {
      if (locked.current) return;
      const ids = Object.values(slots).filter(Boolean) as string[];
      const entry: WearEntry = { id: uid(), date, slots, ...(layout ? { layout } : {}), ...(bg ? { bg } : {}) };
      setS((p) => {
        const items = p.items.map((i) => (ids.includes(i.id) ? wornOn(i, date) : i));
        persist(async () => {
          await store.putWear(entry);
          await Promise.all(items.filter((i) => ids.includes(i.id)).map(store.putItem));
        });
        return { ...p, items, wears: [...p.wears, entry] };
      });
    },
    [persist],
  );

  const saveOutfit = useCallback(
    (name: string, slots: OutfitSlots, layout?: Layout, bg?: Background) => {
      if (locked.current) return;
      const o: Outfit = { id: uid(), name, slots, ...(layout ? { layout } : {}), ...(bg ? { bg } : {}), createdAt: new Date().toISOString() };
      setS((p) => ({ ...p, outfits: [...p.outfits, o] }));
      persist(() => store.putOutfit(o));
      return o;
    },
    [persist],
  );

  const removeOutfit = useCallback(
    (id: string) => {
      if (locked.current) return;
      setS((p) => ({ ...p, outfits: p.outfits.filter((o) => o.id !== id) }));
      persist(() => store.deleteOutfit(id));
    },
    [persist],
  );

  const setPlan = useCallback(
    (date: string, plan: Omit<Plan, 'date'> | null) => {
      if (locked.current) return;
      setS((p) => ({ ...p, plans: [...p.plans.filter((x) => x.date !== date), ...(plan ? [{ ...plan, date }] : [])] }));
      persist(async () => {
        if (plan) await store.putPlan({ ...plan, date });
        else await store.deletePlan(date);
      });
    },
    [persist],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      if (locked.current) return;
      setS((p) => {
        const settings = { ...p.settings, ...patch };
        persist(() => store.putSettings(settings));
        return { ...p, settings };
      });
    },
    [persist],
  );

  const setCity = useCallback(
    async (city: string) => {
      if (!city.trim()) return updateSettings({ city: '', lat: undefined, lon: undefined }), true;
      const hit = await geocode(city).catch(() => null);
      if (!hit) return false;
      updateSettings({ city: hit.name, lat: hit.lat, lon: hit.lon });
      return true;
    },
    [updateSettings],
  );

  const setList = useCallback(
    (fn: (l: ListEntry[]) => ListEntry[]) => {
      if (locked.current) return;
      setS((p) => {
        const list = fn(p.list);
        persist(() => store.putList(list));
        return { ...p, list };
      });
    },
    [persist],
  );
  const addToList = useCallback((key: string) => setList((l) => (l.some((e) => e.key === key) ? l : [...l, { key, addedAt: new Date().toISOString() }])), [setList]);
  const removeFromList = useCallback((key: string) => setList((l) => l.filter((e) => e.key !== key)), [setList]);

  /** Deletes the closet from this device and, when signed in, from the account too. The person stays signed in.
      Works signed out too: anyone can delete what's on their device. */
  const resetAll = useCallback(async () => {
    const r = remote.current;
    if (r) await r.wipe();
    const { owner } = await store.syncMeta();
    await store.clearAll();
    if (r) await store.setSyncMeta({ owner });
    replace({ ...EMPTY, ready: true, owner: r ? (owner ?? null) : null });
  }, [replace]);

  /** Everything, images included, as one JSON file the person keeps. */
  const exportData = useCallback(async () => {
    const images: Record<string, string> = {};
    await Promise.all(
      Object.entries(s.images).map(async ([id, url]) => {
        const blob = await (await fetch(url)).blob();
        images[id] = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(blob);
        });
      }),
    );
    const { items, outfits, plans, wears, settings, list } = s;
    return JSON.stringify({ app: 'rotation', version: 1, exportedAt: new Date().toISOString(), items, outfits, plans, wears, settings, list, images });
  }, [s]);

  const importData = useCallback(async (json: string) => {
    if (locked.current) return;
    const d = JSON.parse(json);
    if (d.app !== 'rotation') throw new Error('Not a Rotation export');
    // Signed in, the file's closet goes up to the account, and anything only in the account comes back down.
    const { owner } = await store.syncMeta();
    await store.clearAll();
    if (remote.current) await store.setSyncMeta({ owner });
    const images: Record<string, string> = {};
    for (const [id, dataUrl] of Object.entries(d.images ?? {}) as [string, string][]) {
      const blob = await (await fetch(dataUrl)).blob();
      await store.putImage(id, blob);
      images[id] = URL.createObjectURL(blob);
    }
    await Promise.all([
      ...d.items.map(store.putItem),
      ...(d.outfits ?? []).map(store.putOutfit),
      ...(d.plans ?? []).map(store.putPlan),
      ...(d.wears ?? []).map(store.putWear),
      store.putSettings({ ...DEFAULT_SETTINGS, ...d.settings }),
      store.putList(d.list ?? []),
    ]);
    const items = withCats(d.items);
    replace({
      ready: true,
      demo: false,
      items,
      images,
      outfits: migrate(d.outfits ?? [], items),
      plans: migrate(d.plans ?? [], items),
      wears: migrate(d.wears ?? [], items),
      settings: { ...DEFAULT_SETTINGS, ...d.settings },
      list: d.list ?? [],
      owner: remote.current ? (owner ?? null) : null,
    });
    scheduleSync();
  }, [replace, scheduleSync]);

  // A fixture sends nothing, so the sign-in steps can be clicked through in Storybook. Any code signs in as a made-up account.
  const sendCode = useCallback((email: string) => (fixed ? Promise.resolve() : cloud.sendCode(email)), [fixed]);
  const verifyCode = useCallback(
    async (email: string, code: string) => {
      if (!fixed) return cloud.verifyCode(email, code);
      const a: Account = { id: 'story-account', email };
      locked.current = false;
      setS((p) => ({ ...p, owner: a.id }));
      setAccount(a);
      setSyncState('synced');
      if (asking.current) settleSignIn(true);
      return a;
    },
    [fixed, settleSignIn],
  );

  /** Signs out here and takes the closet off this device; it stays in the account. When some changes haven't
      reached the account (offline, say), resolves to how many without signing out, unless `anyway`. */
  const signOut = useCallback(
    async (anyway = false) => {
      if (fixed) return setAccount(null), setSyncState('off'), setS((p) => ({ ...p, owner: null })), 0;
      const left = await runSync();
      if (left && !anyway) return left;
      clearTimeout(syncTimer.current);
      remote.current = null;
      accountId.current = null;
      await store.clearAll();
      replace({ ...EMPTY, ready: true });
      setAccount(null);
      setSyncState('off');
      // The session is forgotten here even when the server can't be reached.
      await cloud.signOut().catch(() => {});
      return 0;
    },
    [fixed, runSync, replace],
  );

  /** Keeps demo mode on while moving around the app. */
  const href = useCallback((path: string) => (s.demo ? `${path}${path.includes('?') ? '&' : '?'}demo` : path), [s.demo]);
  const imageFor = useCallback((i?: { imageId?: string }) => (i?.imageId ? s.images[i.imageId] : undefined), [s.images]);
  /** Opens the outfit board in the closet with this outfit on it; the caller navigates to the closet. */
  const build = useCallback((d: Draft) => (setDraft(d), setBuilding(true)), []);

  return useMemo(
    () => ({
      ...s,
      catalog: CATALOG,
      weather,
      skyWord: weather ? skyWord(weather.sky) : undefined,
      draft,
      setDraft,
      building,
      setBuilding,
      build,
      toastMsg,
      toast,
      itemById,
      wearableById,
      imageFor,
      href,
      addItem,
      updateItem,
      removeItem,
      wear,
      saveOutfit,
      removeOutfit,
      setPlan,
      updateSettings,
      setCity,
      addToList,
      removeFromList,
      resetAll,
      exportData,
      importData,
      /** This build can sign people in. */
      accountsOn,
      account,
      syncState,
      /** Signed out with accounts on: nothing here is saved until the person signs in. */
      needsAccount,
      requireAccount,
      signInAsk,
      closeSignIn,
      sendCode,
      verifyCode,
      signOut,
      syncNow: runSync,
    }),
    [s, weather, draft, building, build, toastMsg, toast, itemById, wearableById, imageFor, href, addItem, updateItem, removeItem, wear, saveOutfit, removeOutfit, setPlan, updateSettings, setCity, addToList, removeFromList, resetAll, exportData, importData, accountsOn, account, syncState, needsAccount, requireAccount, signInAsk, closeSignIn, sendCode, verifyCode, signOut, runSync],
  );
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children, fixture }: { children: React.ReactNode; fixture?: Fixture }) {
  const value = useStoreValue(fixture);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
