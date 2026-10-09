/* Closets for stories. Each is a function so it is built after Storybook fixes the clock (see .storybook/preview.tsx):
   dates in the demo closet are relative to today, and so is the forecast. */

import { addDays, todayISO } from '@/lib/dates';
import { demoData } from '@/lib/demo';
import { garmentSvg } from '@/lib/garments';
import type { Fixture } from '@/lib/store';
import type { GarmentType, Item, Outfit } from '@/lib/types';
import type { Forecast, Sky } from '@/lib/weather';

/** A week of San Francisco weather from today: fog, sun, a rainy day mid-week. */
export function forecast(): Forecast {
  const today = todayISO();
  const week: [number, number, Sky][] = [
    [64, 54, 'fog'],
    [67, 55, 'sun'],
    [63, 53, 'cloud'],
    [58, 51, 'rain'],
    [61, 52, 'cloud'],
    [66, 54, 'sun'],
    [69, 56, 'sun'],
  ];
  return {
    now: 58,
    sky: 'fog',
    summary: '58° and foggy · High 64°',
    days: week.map(([high, low, sky], i) => ({ date: addDays(today, i), high, low, sky })),
  };
}

/** One of Jordan's pieces by its short id (t1–t9 tops, b1–b5 bottoms, o1–o4 layers, s1–s3 shoes, a1–a3 extras). */
export const demoId = (short: string) => `demo-${short}`;

/** Jordan's closet: 24 pieces from 15 stores, plans for the next four days, two logged wears, and the weather. */
export function demoCloset(extra: Fixture = {}): Fixture {
  const d = demoData();
  return { items: d.items, plans: d.plans, wears: d.wears, settings: d.settings, weather: forecast(), ...extra };
}

/** Three saved outfits, for the Outfits view and the "Saved outfits" picker. */
export function savedOutfits(): Outfit[] {
  const at = `${addDays(todayISO(), -10)}T12:00:00.000Z`;
  const id = demoId;
  return [
    { id: 'outfit-1', name: 'Client presentation', slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), acc: id('a1') }, createdAt: at },
    { id: 'outfit-2', name: 'Weekend errands', slots: { outer: id('o1'), top: id('t1'), bottom: id('b2'), shoes: id('s1') }, createdAt: at },
    { id: 'outfit-3', name: 'Dinner out', slots: { outer: id('o4'), top: id('t9'), bottom: id('b5'), shoes: id('s3') }, createdAt: at },
  ];
}

/** A shopping list across two stores. */
export const shoppingList = () => [
  { key: 'p-chino-khaki|Uniqlo', addedAt: '2026-10-01T12:00:00.000Z' },
  { key: 'p-cardigan-oat|Uniqlo', addedAt: '2026-10-01T12:00:00.000Z' },
  { key: 'p-chore-olive|Madewell', addedAt: '2026-10-02T12:00:00.000Z' },
];

/** A closet with nothing in it: the first-run states. */
export const emptyCloset = (): Fixture => ({});

/** One tee: not enough for an outfit, and nothing to suggest yet. */
export const oneTee = (): Fixture => ({ items: [piece({ id: 'tee', name: 'Soft Crew Tee', brand: 'Gap', type: 'tee', cat: 'top', color: '#F4F2EC', colorName: 'White' })] });

/** A piece the person owns, with sensible defaults; for edge cases the demo closet doesn't have. */
export function piece(p: Partial<Item> & Pick<Item, 'id' | 'name' | 'type' | 'cat' | 'color' | 'colorName'>): Item {
  return { brand: '', source: 'manual', tone: 'neutral', f: 2, wears: 0, createdAt: '2026-09-01T12:00:00.000Z', ...p };
}

/** An owned dress, so dress outfits (no bottom) can be shown. */
export const blackDress = () =>
  piece({ id: 'dress', name: 'Black Midi Dress', brand: 'Madewell', source: 'link', type: 'dress', cat: 'dress', color: '#232323', colorName: 'Black', f: 2.5, price: 128, wears: 6, size: 'M' });

/* Stand-ins for photos. The app shows real photos as <img>; these draw a garment into an image so the photo paths
   (cutouts on the tile, and product shots on white that blend into it) render without image files. */
function photoSvg(type: GarmentType, color: string, background?: string) {
  const garment = garmentSvg(type, color).replace('<svg ', '<svg x="20" y="20" width="200" height="200" ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${background ? `<rect width="240" height="240" fill="${background}"/>` : ''}${garment}</svg>`;
}

/** A photo as a URL, for `images` in a fixture or a form preview. Pass a background for a product shot. */
export const photo = (type: GarmentType, color: string, background?: string) => `data:image/svg+xml,${encodeURIComponent(photoSvg(type, color, background))}`;

/** A photo as a file, as if picked from the camera roll. */
export const photoFile = (type: GarmentType, color: string, background?: string) =>
  new File([photoSvg(type, color, background)], `${type}.svg`, { type: 'image/svg+xml' });

/** A closet of three photographed pieces: two background-removed cutouts and a product photo from a link. */
export function photoCloset(): Fixture {
  const items = [
    piece({ id: 'cut-1', name: 'Cropped Cardigan', brand: 'Madewell', source: 'photo', type: 'cardigan', cat: 'top', color: '#9AAB8E', colorName: 'Sage', tone: 'sage', imageId: 'cut-1', wears: 3 }),
    piece({ id: 'cut-2', name: 'Wide Leg Jeans', brand: "Levi's", source: 'photo', type: 'loosejeans', cat: 'bottom', color: '#9DB6CF', colorName: 'Light Wash', denim: 'light', f: 1.5, imageId: 'cut-2', wears: 8 }),
    piece({ id: 'link-1', name: 'Leather Loafer', brand: 'J.Crew', source: 'link', type: 'loafers', cat: 'shoes', color: '#4A2E22', colorName: 'Brown', f: 2.5, imageId: 'link-1', price: 168 }),
  ];
  return {
    items,
    images: { 'cut-1': photo('cardigan', '#9AAB8E'), 'cut-2': photo('loosejeans', '#9DB6CF'), 'link-1': photo('loafers', '#4A2E22', '#ffffff') },
  };
}
