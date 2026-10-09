/* The closet on this phone. Everything except photos is one JSON snapshot; photos are files (see files.ts).
   Accounts and sync come with Supabase later, as on the web. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Item, ListEntry, Outfit, Plan, Settings, WearEntry } from '@core/types';

const KEY = 'rotation:closet:v1';

export interface Snapshot {
  items: Item[];
  /** Piece id → stored photo reference. */
  images: Record<string, string>;
  outfits: Outfit[];
  plans: Plan[];
  wears: WearEntry[];
  settings: Settings;
  list: ListEntry[];
}

export async function load(): Promise<Partial<Snapshot> | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export const save = (s: Snapshot) => AsyncStorage.setItem(KEY, JSON.stringify(s));
export const clear = () => AsyncStorage.removeItem(KEY);
