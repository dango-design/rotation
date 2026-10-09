'use client';

/* Light, dark, or follow the device. The choice is a per-device preference, so it lives in
   localStorage (readable before first paint) rather than with the closet in IndexedDB. */

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { THEME_KEY as KEY } from './theme-script';

export type ThemePref = 'system' | 'light' | 'dark';

function read(): ThemePref {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function apply(pref: ThemePref) {
  if (pref === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = pref;
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => void listeners.delete(onChange);
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {}
  apply(pref);
  listeners.forEach((l) => l());
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, read, () => 'system');
}

/** Keeps <html data-theme> on the saved choice: React's dev remount clears attributes the
    head script set, and another tab may change the choice. */
export function useThemeSync() {
  useLayoutEffect(() => {
    apply(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY && e.key !== null) return;
      apply(read());
      listeners.forEach((l) => l());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
