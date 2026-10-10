/* The weather and the suggested outfit for a day, shared by Today and the day planner. Same rules as the web app. */

import { useRouter } from 'expo-router';
import { fmt, todayISO } from '@core/dates';
import { suggest } from '@core/today';
import type { Background, Layout, OutfitSlots, Settings } from '@core/types';
import { skyWord, type Sky } from '@core/weather';
import { useStore } from './store';

export function useDays() {
  const st = useStore();
  const router = useRouter();
  const today = todayISO();

  const wxFor = (date: string): { temp: number; sky: Sky; word: string } | undefined => {
    if (date === today && st.weather) return { temp: st.weather.now, sky: st.weather.sky, word: st.skyWord ?? '' };
    const d = st.weather?.days.find((x) => x.date === date);
    return d ? { temp: d.high, sky: d.sky, word: skyWord(d.sky) } : undefined;
  };

  const suggestFor = (date: string, n: number, occasion: Settings['occasion'] = st.settings.occasion) => {
    const wx = wxFor(date);
    return suggest(st.items, { occasion, today: date, shuffle: n, temp: wx?.temp, sky: wx?.sky, skyWord: wx?.word });
  };

  /** Opens the day planner: logging for a past day, planning for today or later. */
  const startPlanning = (day: string, opts: { slots?: OutfitSlots; layout?: Layout; bg?: Background; offset?: number; name?: string } = {}) => {
    const label = day === today ? "Today's outfit" : `${fmt(day, { weekday: 'long' })}'s outfit`;
    st.setPlanSeed({ day, mode: day < today ? 'log' : 'plan', slots: opts.slots, layout: opts.layout, bg: opts.bg, offset: opts.offset ?? 0, name: opts.name ?? label });
    router.push('/plan');
  };

  return { today, wxFor, suggestFor, startPlanning };
}
