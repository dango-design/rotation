/* App state for the phone. It mirrors the web store (web/src/lib/store.tsx) so both apps behave the same:
   the closet is saved on this phone, and the demo closet lives in memory only.
   Everything that decides what to wear or buy comes from the shared engine in @core. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG } from '@core/catalog';
import { TYPES } from '@core/catalog-meta';
import { todayISO } from '@core/dates';
import { demoData } from '@core/demo';
import type { Item, Layout, ListEntry, Outfit, OutfitSlots, Piece, Plan, Settings, Slot, WearEntry } from '@core/types';
import { forecast, geocode, skyWord, type Forecast } from '@core/weather';
import { clearImages, dropImage, imageAsDataUrl, keepImage, uriFor } from './files';
import * as persist from './persist';

export const DEFAULT_SETTINGS: Settings = { city: '', favoriteStores: [], showShop: true, occasion: 'work' };

/** The outfit on the board in the closet's outfit builder. */
export interface Draft {
  name: string;
  slots: OutfitSlots;
  layout?: Layout;
  focus: Slot;
}

/** What the day planner opens with. */
export interface PlanSeed {
  day: string;
  mode: 'plan' | 'log';
  slots?: OutfitSlots;
  layout?: Layout;
  name: string;
  /** Moves "Surprise me" along, so a planner opened from a suggestion doesn't offer the same outfit again. */
  offset: number;
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

const EMPTY: State = { ready: false, demo: false, items: [], images: {}, outfits: [], plans: [], wears: [], settings: DEFAULT_SETTINGS, list: [] };

/* Same migration as the web store: older closets kept bags and jewelry in the accessory slot. */
function migrate<T extends { slots: OutfitSlots }>(list: T[], items: Item[]): T[] {
  return list.map((o) => {
    const it = o.slots.acc ? items.find((i) => i.id === o.slots.acc) : undefined;
    if (!it || it.cat === 'acc') return o;
    const { acc, ...rest } = o.slots;
    return { ...o, slots: { ...rest, [it.cat === 'dress' ? 'top' : it.cat]: acc } };
  });
}
const withCats = (items: Item[]) => items.map((i) => (TYPES[i.type] && TYPES[i.type].cat !== i.cat ? { ...i, cat: TYPES[i.type].cat } : i));

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function fromSnapshot(d: Partial<persist.Snapshot>): State {
  const items = withCats(d.items ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    ready: true,
    demo: false,
    items,
    images: d.images ?? {},
    outfits: migrate(d.outfits ?? [], items),
    plans: migrate(d.plans ?? [], items),
    wears: migrate(d.wears ?? [], items),
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
    list: d.list ?? [],
  };
}

function useStoreValue() {
  const [s, setS] = useState<State>(EMPTY);
  const [draft, setDraft] = useState<Draft>({ name: 'New outfit', slots: {}, focus: 'top' });
  const [planSeed, setPlanSeed] = useState<PlanSeed | null>(null);
  const [forecastFor, setForecastFor] = useState<{ key: string; data: Forecast | null } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; n: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    persist
      .load()
      .then((d) => setS(d ? fromSnapshot(d) : { ...EMPTY, ready: true }))
      .catch(() => setS({ ...EMPTY, ready: true }));
  }, []);

  // Save after every change to a real closet. The demo closet is never saved.
  useEffect(() => {
    if (!s.ready || s.demo) return;
    const t = setTimeout(() => {
      const { items, images, outfits, plans, wears, settings, list } = s;
      persist.save({ items, images, outfits, plans, wears, settings, list }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [s]);

  // Weather for the saved city; a forecast for an old city is ignored.
  const { lat, lon } = s.settings;
  const placeKey = lat !== undefined && lon !== undefined ? `${lat},${lon}` : '';
  useEffect(() => {
    if (!placeKey) return;
    const [la, lo] = placeKey.split(',').map(Number);
    forecast(la, lo)
      .then((data) => setForecastFor({ key: placeKey, data }))
      .catch(() => setForecastFor({ key: placeKey, data: null }));
  }, [placeKey]);
  const weather = placeKey && forecastFor?.key === placeKey ? forecastFor.data : null;

  const toast = useCallback((text: string) => {
    setToastMsg((t) => ({ text, n: (t?.n ?? 0) + 1 }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const itemById = useCallback((id?: string) => (id ? s.items.find((i) => i.id === id) : undefined), [s.items]);
  const wearableById = useCallback(
    (id?: string): Item | Piece | undefined => (id ? (s.items.find((i) => i.id === id) ?? CATALOG.find((p) => p.id === id)) : undefined),
    [s.items],
  );
  const imageFor = useCallback((i?: { imageId?: string }) => (i?.imageId && s.images[i.imageId] ? uriFor(s.images[i.imageId]) : undefined), [s.images]);

  const startDemo = useCallback(() => {
    const d = demoData();
    setS({ ...EMPTY, ready: true, demo: true, items: d.items, plans: d.plans, wears: d.wears, settings: d.settings });
    setDraft({ name: 'Client presentation', slots: d.plans[0].slots, focus: 'bottom' });
  }, []);
  const leaveDemo = useCallback(() => {
    setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
    setPlanSeed(null);
    persist
      .load()
      .then((d) => setS(d ? fromSnapshot(d) : { ...EMPTY, ready: true }))
      .catch(() => setS({ ...EMPTY, ready: true }));
  }, []);

  /** Adds a piece. A photo is copied into the app first; in the demo it is only kept in memory. */
  const addItem = useCallback(
    async (fields: Omit<Item, 'id' | 'createdAt' | 'wears'> & { wears?: number }, photo?: { uri: string; width?: number; height?: number }) => {
      const id = uid();
      const item: Item = { wears: 0, ...fields, id, createdAt: new Date().toISOString() };
      let ref: string | undefined;
      if (photo) {
        ref = s.demo ? photo.uri : await keepImage(id, photo.uri, photo.width && photo.height ? { width: photo.width, height: photo.height } : undefined);
        item.imageId = id;
      }
      setS((p) => ({ ...p, items: [...p.items, item], images: ref ? { ...p.images, [id]: ref } : p.images }));
      return item;
    },
    [s.demo],
  );

  const updateItem = useCallback((item: Item) => setS((p) => ({ ...p, items: p.items.map((i) => (i.id === item.id ? item : i)) })), []);

  const removeItem = useCallback((id: string) => {
    setS((p) => {
      const ref = p.images[id];
      if (ref && !p.demo) dropImage(ref);
      const images = { ...p.images };
      delete images[id];
      return { ...p, items: p.items.filter((i) => i.id !== id), images };
    });
  }, []);

  /** Logs an outfit as worn: adds a wear to every piece and records the day. */
  const wear = useCallback((slots: OutfitSlots, date = todayISO(), layout?: Layout) => {
    const ids = Object.values(slots).filter(Boolean) as string[];
    const entry: WearEntry = { id: uid(), date, slots, ...(layout ? { layout } : {}) };
    setS((p) => ({
      ...p,
      items: p.items.map((i) => (ids.includes(i.id) ? { ...i, wears: i.wears + 1, lastWorn: !i.lastWorn || date > i.lastWorn ? date : i.lastWorn } : i)),
      wears: [...p.wears, entry],
    }));
  }, []);

  const saveOutfit = useCallback((name: string, slots: OutfitSlots, layout?: Layout) => {
    const o: Outfit = { id: uid(), name, slots, ...(layout ? { layout } : {}), createdAt: new Date().toISOString() };
    setS((p) => ({ ...p, outfits: [...p.outfits, o] }));
    return o;
  }, []);

  const removeOutfit = useCallback((id: string) => setS((p) => ({ ...p, outfits: p.outfits.filter((o) => o.id !== id) })), []);

  const setPlan = useCallback(
    (date: string, plan: Omit<Plan, 'date'> | null) =>
      setS((p) => ({ ...p, plans: [...p.plans.filter((x) => x.date !== date), ...(plan ? [{ ...plan, date }] : [])] })),
    [],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => setS((p) => ({ ...p, settings: { ...p.settings, ...patch } })), []);

  const setCity = useCallback(
    async (city: string) => {
      if (!city.trim()) return (updateSettings({ city: '', lat: undefined, lon: undefined }), true);
      const hit = await geocode(city).catch(() => null);
      if (!hit) return false;
      updateSettings({ city: hit.name, lat: hit.lat, lon: hit.lon });
      return true;
    },
    [updateSettings],
  );

  const addToList = useCallback(
    (key: string) => setS((p) => (p.list.some((e) => e.key === key) ? p : { ...p, list: [...p.list, { key, addedAt: new Date().toISOString() }] })),
    [],
  );
  const removeFromList = useCallback((key: string) => setS((p) => ({ ...p, list: p.list.filter((e) => e.key !== key) })), []);

  const resetAll = useCallback(async () => {
    clearImages();
    await persist.clear();
    setS({ ...EMPTY, ready: true });
    setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
  }, []);

  /** Everything, photos included, in the same format as the web app's backup, so a closet can move between them. */
  const exportData = useCallback(async () => {
    const images: Record<string, string> = {};
    for (const [id, ref] of Object.entries(s.images)) images[id] = await imageAsDataUrl(ref).catch(() => '');
    const { items, outfits, plans, wears, settings, list } = s;
    return JSON.stringify({ app: 'rotation', version: 1, exportedAt: new Date().toISOString(), items, outfits, plans, wears, settings, list, images });
  }, [s]);

  const importData = useCallback(async (json: string) => {
    const d = JSON.parse(json);
    if (d.app !== 'rotation' || !Array.isArray(d.items)) throw new Error('Not a Rotation backup');
    clearImages();
    const images: Record<string, string> = {};
    for (const [id, dataUrl] of Object.entries(d.images ?? {}) as [string, string][]) {
      if (dataUrl) images[id] = await keepImage(id, dataUrl);
    }
    const next = fromSnapshot({ ...d, images });
    setS(next);
    await persist.save({ items: next.items, images, outfits: next.outfits, plans: next.plans, wears: next.wears, settings: next.settings, list: next.list });
  }, []);

  return useMemo(
    () => ({
      ...s,
      catalog: CATALOG,
      weather,
      skyWord: weather ? skyWord(weather.sky) : undefined,
      draft,
      setDraft,
      planSeed,
      setPlanSeed,
      toastMsg,
      toast,
      itemById,
      wearableById,
      imageFor,
      startDemo,
      leaveDemo,
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
    [s, weather, draft, planSeed, toastMsg, toast, itemById, wearableById, imageFor, startDemo, leaveDemo, addItem, updateItem, removeItem, wear, saveOutfit, removeOutfit, setPlan, updateSettings, setCity, addToList, removeFromList, resetAll, exportData, importData],
  );
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
