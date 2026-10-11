'use client';

/* The weather and the suggested outfit for a day, shared by Today and the outfit board when it plans a day. */

import { useRouter } from 'next/navigation';
import { fmt, todayISO } from './dates';
import { SLOTS } from './engine';
import { useStore } from './store';
import { suggest } from './today';
import type { Layout, OutfitSlots, Settings } from './types';
import { skyWord } from './weather';

export function useDays() {
  const st = useStore();
  const router = useRouter();
  const today = todayISO();

  const wxFor = (date: string) => {
    if (date === today && st.weather) return { temp: st.weather.now, sky: st.weather.sky, word: st.skyWord ?? '' };
    const d = st.weather?.days.find((x) => x.date === date);
    return d ? { temp: d.high, sky: d.sky, word: skyWord(d.sky) } : undefined;
  };

  const suggestFor = (date: string, n: number, occasion: Settings['occasion'] = st.settings.occasion) => {
    const wx = wxFor(date);
    return suggest(st.items, { occasion, today: date, shuffle: n, temp: wx?.temp, sky: wx?.sky, skyWord: wx?.word });
  };

  /** Opens the outfit board beside the closet for a day: logging for a past day, planning for today or later. */
  const startPlanning = (day: string, opts: { slots?: OutfitSlots; layout?: Layout; shuffle?: number; name?: string } = {}) => {
    const slots = opts.slots ?? {};
    const name = opts.name ?? (day === today ? "Today's outfit" : `${fmt(day, { weekday: 'long' })}'s outfit`);
    st.build({ name, slots, layout: opts.layout, focus: SLOTS.find((s) => slots[s]) ?? 'top', date: day, shuffle: opts.shuffle });
    router.push(st.href('/closet'));
  };

  return { today, wxFor, suggestFor, startPlanning };
}
