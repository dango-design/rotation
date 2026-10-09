/* Jordan's demo closet: 30 pieces from 16 stores. It started as the prototype's closet and now mixes
   dresses and a skirt with the jeans and trousers, so the demo reads as anyone's closet.
   Dates are relative to today so the demo always looks current. */

import { addDays, todayISO, weekStart } from './dates';
import type { Item, Plan, Settings, WearEntry } from './types';

type Seed = Omit<Item, 'createdAt' | 'lastWorn'> & { daysAgo: number };

const SEED: Seed[] = [
  { id: 't1', name: 'Soft Crew Tee', brand: 'Gap', source: 'email', type: 'tee', cat: 'top', color: '#F4F2EC', colorName: 'White', tone: 'neutral', f: 1.5, price: 19.95, wears: 41, bought: '2025-04-12', daysAgo: 4, size: 'M' },
  { id: 't2', name: 'Organic Pocket Tee', brand: 'Everlane', source: 'email', type: 'pockettee', cat: 'top', color: '#232323', colorName: 'Black', tone: 'neutral', f: 1.5, price: 30, wears: 28, bought: '2025-06-03', daysAgo: 7, size: 'M' },
  { id: 't3', name: 'Classic Oxford Shirt', brand: 'J.Crew', source: 'email', type: 'shirt', cat: 'top', color: '#B7CBE2', colorName: 'Light Blue', tone: 'neutral', f: 2.5, price: 79.5, wears: 19, bought: '2025-02-08', daysAgo: 21, size: 'M' },
  { id: 't4', name: 'Merino Crew Sweater', brand: 'Uniqlo', source: 'email', type: 'sweater', cat: 'top', color: '#B48A5A', colorName: 'Camel', tone: 'neutral', f: 2, price: 49.9, wears: 12, bought: '2024-11-20', daysAgo: 12, size: 'M' },
  { id: 't5', name: 'Striped Boatneck Tee', brand: 'Madewell', source: 'photo', type: 'longsleeve', cat: 'top', color: '#EFE9DC', pattern: 'stripe', colorName: 'Navy Stripe', tone: 'neutral', f: 1.5, price: 39.5, wears: 15, daysAgo: 9, size: 'M' },
  { id: 't6', name: 'Fleece Hoodie', brand: 'Gap', source: 'email', type: 'hoodie', cat: 'top', color: '#A9A8A4', colorName: 'Heather Grey', tone: 'neutral', f: 1, price: 54.95, wears: 52, bought: '2024-10-01', daysAgo: 1, size: 'M' },
  { id: 't7', name: 'Linen Shirt', brand: 'Everlane', source: 'link', type: 'linenshirt', cat: 'top', color: '#E9E1CF', colorName: 'Ecru', tone: 'neutral', f: 2, price: 68, wears: 6, daysAgo: 37, size: 'M' },
  { id: 't8', name: 'Rib-Knit Long-Sleeve Tee', brand: 'Old Navy', source: 'email', type: 'longsleeve', cat: 'top', color: '#2F4A3A', colorName: 'Forest', tone: 'green', f: 1.5, price: 16.99, wears: 9, bought: '2026-01-14', daysAgo: 27, size: 'M' },
  { id: 't9', name: 'Soft Knit Sweater', brand: 'Banana Republic', source: 'email', type: 'sweater', cat: 'top', color: '#6B2633', colorName: 'Burgundy', tone: 'burgundy', f: 2, price: 89, wears: 4, bought: '2025-12-02', daysAgo: 217, size: 'M' },
  { id: 't10', name: 'Cotton Crop Cardigan', brand: 'J.Crew', source: 'email', type: 'cardigan', cat: 'top', color: '#E3A9B4', colorName: 'Pink', tone: 'pink', f: 2, price: 79.5, wears: 11, bought: '2026-03-14', daysAgo: 5, size: 'M' },
  { id: 'd1', name: 'Knit Midi Dress', brand: 'Everlane', source: 'email', type: 'dress', cat: 'dress', color: '#232323', colorName: 'Black', tone: 'neutral', f: 2, price: 98, wears: 16, bought: '2025-09-22', daysAgo: 8, size: 'M' },
  { id: 'd2', name: 'Utility Shirt Dress', brand: 'Gap', source: 'email', type: 'shirtdress', cat: 'dress', color: '#5E6243', colorName: 'Olive', tone: 'neutral', f: 2, price: 79.95, wears: 7, bought: '2026-04-02', daysAgo: 15, size: 'M' },
  { id: 'd3', name: 'Satin Slip Dress', brand: 'Zara', source: 'photo', type: 'slipdress', cat: 'dress', color: '#6B2633', colorName: 'Burgundy', tone: 'burgundy', f: 2.5, price: 45.9, wears: 3, daysAgo: 64, size: 'M' },
  { id: 'b1', name: 'Loose Straight Jeans', brand: 'Gap', source: 'email', type: 'loosejeans', cat: 'bottom', color: '#46658C', colorName: 'Mid Wash', tone: 'neutral', denim: 'mid', f: 1.5, price: 69.95, wears: 38, bought: '2025-03-30', daysAgo: 3, size: '32 × 30' },
  { id: 'b2', name: 'Original Fit Jeans', brand: "Levi's", source: 'photo', type: 'jeans', cat: 'bottom', color: '#22324D', colorName: 'Dark Rinse', tone: 'neutral', denim: 'dark', f: 1.5, price: 79.5, wears: 30, daysAgo: 6, size: '32 × 30' },
  { id: 'b3', name: 'Tailored Wool Trousers', brand: 'Banana Republic', source: 'email', type: 'trousers', cat: 'bottom', color: '#3E3E41', colorName: 'Charcoal', tone: 'neutral', f: 3, price: 130, wears: 8, bought: '2025-09-05', daysAgo: 14, size: '32' },
  { id: 'b4', name: 'Tapered Jogger', brand: 'Lululemon', source: 'email', type: 'joggers', cat: 'bottom', color: '#1F1F21', colorName: 'Black', tone: 'neutral', f: 1, price: 118, wears: 25, bought: '2025-05-18', daysAgo: 1, size: 'M' },
  { id: 'b5', name: 'Wide Straight Trousers', brand: 'Zara', source: 'email', type: 'widetrousers', cat: 'bottom', color: '#262626', colorName: 'Black', tone: 'neutral', f: 2.5, price: 45.9, wears: 4, bought: '2025-07-02', daysAgo: 79, size: '32' },
  { id: 'b6', name: 'Pleated Midi Skirt', brand: 'Uniqlo', source: 'email', type: 'skirt', cat: 'bottom', color: '#9AAB8E', colorName: 'Sage', tone: 'sage', f: 2, price: 39.9, wears: 6, bought: '2026-05-10', daysAgo: 23, size: 'M' },
  { id: 'o1', name: 'Classic Denim Jacket', brand: "Levi's", source: 'email', type: 'denimjacket', cat: 'outer', color: '#5B7BA3', colorName: 'Mid Wash', tone: 'neutral', denim: 'mid', f: 1.5, price: 98, wears: 22, bought: '2025-04-19', daysAgo: 10, size: 'M' },
  { id: 'o2', name: 'Classic Trench Coat', brand: 'Abercrombie & Fitch', source: 'email', type: 'trench', cat: 'outer', color: '#C7B693', colorName: 'Stone', tone: 'neutral', f: 2.5, price: 180, wears: 11, bought: '2024-10-28', daysAgo: 18, size: 'M' },
  { id: 'o3', name: 'Packable Puffer', brand: 'Uniqlo', source: 'photo', type: 'puffer', cat: 'outer', color: '#1E1E1E', colorName: 'Black', tone: 'neutral', f: 1, price: 79.9, wears: 14, daysAgo: 209, size: 'M' },
  { id: 'o4', name: 'Wool-Blend Blazer', brand: 'J.Crew', source: 'email', type: 'blazer', cat: 'outer', color: '#26324A', colorName: 'Navy', tone: 'neutral', f: 3, price: 198, wears: 3, bought: '2026-02-21', daysAgo: 122, size: 'M' },
  { id: 's1', name: 'Court Sneakers', brand: 'Nike', source: 'email', type: 'sneakers', cat: 'shoes', color: '#F5F4F0', colorName: 'White', tone: 'neutral', f: 1.5, price: 90, wears: 64, bought: '2024-03-09', daysAgo: 1, size: '9.5' },
  { id: 's2', name: 'Chelsea Boots', brand: 'Blundstone', store: 'Nordstrom', source: 'email', type: 'boots', cat: 'shoes', color: '#5E3F2C', colorName: 'Rustic Brown', tone: 'neutral', f: 2, price: 230, wears: 33, bought: '2023-11-02', daysAgo: 3, size: '9.5' },
  { id: 's3', name: 'Penny Loafers', brand: 'G.H. Bass', store: 'Amazon', source: 'email', type: 'loafers', cat: 'shoes', color: '#4A2E22', colorName: 'Dark Brown', tone: 'neutral', f: 2.5, price: 150, wears: 5, bought: '2026-01-05', daysAgo: 122, size: '9.5' },
  { id: 's4', name: 'Ballet Flats', brand: 'A New Day', store: 'Target', source: 'email', type: 'flats', cat: 'shoes', color: '#232323', colorName: 'Black', tone: 'neutral', f: 2, price: 29.99, wears: 20, bought: '2025-08-16', daysAgo: 2, size: '9.5' },
  { id: 'a1', name: 'Canvas Tote', brand: 'Madewell', source: 'email', type: 'tote', cat: 'acc', color: '#E8E0CC', colorName: 'Ecru', tone: 'neutral', f: 1.5, price: 38, wears: 40, bought: '2025-07-07', daysAgo: 3, size: 'One size' },
  { id: 'a2', name: 'Rib-Knit Beanie', brand: 'Old Navy', source: 'email', type: 'beanie', cat: 'acc', color: '#A3532F', colorName: 'Rust', tone: 'rust', f: 1, price: 12.99, wears: 10, bought: '2025-12-09', daysAgo: 218, size: 'One size' },
  { id: 'a3', name: 'Washed Baseball Cap', brand: 'H&M', source: 'email', type: 'cap', cat: 'acc', color: '#2A3654', colorName: 'Navy', tone: 'neutral', f: 1, price: 14.99, wears: 18, bought: '2025-08-02', daysAgo: 1, size: 'One size' },
];

export function demoData() {
  const today = todayISO();
  const items: Item[] = SEED.map(({ daysAgo, ...rest }) => ({
    ...rest,
    id: `demo-${rest.id}`,
    lastWorn: addDays(today, -daysAgo),
    createdAt: `${rest.bought ?? '2025-01-01'}T12:00:00.000Z`,
  }));
  const id = (short: string) => `demo-${short}`;
  const mon = weekStart(today);
  const plans: Plan[] = [
    { date: today, name: 'Client presentation', slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), acc: id('a1') } },
    { date: addDays(today, 1), name: 'Client lunch', slots: { top: id('d2'), shoes: id('s4'), acc: id('a1') } },
    { date: addDays(today, 2), name: 'Errands', slots: { outer: id('o1'), top: id('t1'), bottom: id('b2'), shoes: id('s1') } },
    { date: addDays(today, 3), name: 'Dinner out', slots: { outer: id('o4'), top: id('d3'), shoes: id('s3') } },
  ];
  const wears: WearEntry[] = [
    { id: 'demo-w1', date: addDays(today, -1), slots: { top: id('t6'), bottom: id('b4'), shoes: id('s1'), acc: id('a3') } },
  ];
  if (mon !== today && addDays(today, -1) !== mon) {
    wears.push({ id: 'demo-w0', date: mon, slots: { top: id('t2'), bottom: id('b6'), shoes: id('s1') } });
  }
  const settings: Settings = { city: 'San Francisco', lat: 37.7749, lon: -122.4194, favoriteStores: ['Gap', "Levi's", 'Uniqlo'], showShop: true, occasion: 'work' };
  return { items, plans, wears, settings };
}
