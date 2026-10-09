'use client';

/* App state. Real closets persist to IndexedDB on the device; `?demo` loads Jordan's demo closet
   in memory only, so it can be explored and shared without touching anyone's data. A fixture (Storybook)
   is also held in memory, with the weather given instead of fetched, so every render is repeatable. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG } from './catalog';
import { TYPES } from './catalog-meta';
import * as store from './db';
import { todayISO } from './dates';
import { demoData } from './demo';
import type { Item, Layout, ListEntry, Outfit, OutfitSlots, Piece, Plan, Settings, Slot, WearEntry } from './types';
import { wornOn } from './wear';
import { forecast, geocode, skyWord, type Forecast } from './weather';

export const DEFAULT_SETTINGS: Settings = { city: '', favoriteStores: [], showShop: true, occasion: 'work' };

export interface Draft {
  name: string;
  slots: OutfitSlots;
  layout?: Layout;
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
}

/** A closet held in memory for Storybook and tests. Nothing loads from or saves to the device. */
export interface Fixture extends Partial<Pick<State, 'demo' | 'items' | 'images' | 'outfits' | 'plans' | 'wears' | 'list'>> {
  settings?: Partial<Settings>;
  /** Used as is; a fixture never fetches the weather. */
  weather?: Forecast | null;
  draft?: Draft;
  /** Open the outfit board beside the closet. */
  building?: boolean;
}

const EMPTY: State = { ready: false, demo: false, items: [], images: {}, outfits: [], plans: [], wears: [], settings: DEFAULT_SETTINGS, list: [] };

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

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

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
    store
      .loadAll()
      .then((d) => {
        const images: Record<string, string> = {};
        d.images.forEach((blob, id) => (images[id] = URL.createObjectURL(blob)));
        const items = withCats(d.items).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setS({
          ready: true,
          demo: false,
          items,
          images,
          outfits: migrate(d.outfits, items),
          plans: migrate(d.plans, items),
          wears: migrate(d.wears, items),
          settings: { ...DEFAULT_SETTINGS, ...d.settings },
          list: d.list ?? [],
        });
      })
      .catch(() => setS({ ...EMPTY, ready: true }));
  }, [fixed]);

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

  const persist = useCallback(<T,>(fn: () => Promise<T>) => (s.demo || fixed ? undefined : void fn().catch(() => {})), [s.demo, fixed]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const itemById = useCallback((id?: string) => (id ? s.items.find((i) => i.id === id) : undefined), [s.items]);
  const wearableById = useCallback(
    (id?: string): Item | Piece | undefined => (id ? s.items.find((i) => i.id === id) ?? CATALOG.find((p) => p.id === id) : undefined),
    [s.items],
  );

  const addItem = useCallback(
    (fields: Omit<Item, 'id' | 'createdAt' | 'wears'> & { wears?: number }, image?: Blob) => {
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
      setS((p) => ({ ...p, items: p.items.map((i) => (i.id === item.id ? item : i)) }));
      persist(() => store.putItem(item));
    },
    [persist],
  );

  const removeItem = useCallback(
    (id: string) => {
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
    (slots: OutfitSlots, date = todayISO(), layout?: Layout) => {
      const ids = Object.values(slots).filter(Boolean) as string[];
      const entry: WearEntry = { id: uid(), date, slots, ...(layout ? { layout } : {}) };
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
    (name: string, slots: OutfitSlots, layout?: Layout) => {
      const o: Outfit = { id: uid(), name, slots, ...(layout ? { layout } : {}), createdAt: new Date().toISOString() };
      setS((p) => ({ ...p, outfits: [...p.outfits, o] }));
      persist(() => store.putOutfit(o));
      return o;
    },
    [persist],
  );

  const removeOutfit = useCallback(
    (id: string) => {
      setS((p) => ({ ...p, outfits: p.outfits.filter((o) => o.id !== id) }));
      persist(() => store.deleteOutfit(id));
    },
    [persist],
  );

  const setPlan = useCallback(
    (date: string, plan: Omit<Plan, 'date'> | null) => {
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

  const resetAll = useCallback(async () => {
    await store.clearAll();
    Object.values(s.images).forEach((u) => URL.revokeObjectURL(u));
    setS({ ...EMPTY, ready: true });
  }, [s.images]);

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
    const d = JSON.parse(json);
    if (d.app !== 'rotation') throw new Error('Not a Rotation export');
    await store.clearAll();
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
    setS({ ready: true, demo: false, items, images, outfits: migrate(d.outfits ?? [], items), plans: migrate(d.plans ?? [], items), wears: migrate(d.wears ?? [], items), settings: { ...DEFAULT_SETTINGS, ...d.settings }, list: d.list ?? [] });
  }, []);

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
    }),
    [s, weather, draft, building, build, toastMsg, toast, itemById, wearableById, imageFor, href, addItem, updateItem, removeItem, wear, saveOutfit, removeOutfit, setPlan, updateSettings, setCity, addToList, removeFromList, resetAll, exportData, importData],
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
