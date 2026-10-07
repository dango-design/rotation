/* Demo data for one customer: Jordan, a loyalty member in San Francisco.
   Product names and prices are illustrative, not live Gap Inc. catalog data. */

const GAP_INC = ['Gap', 'Old Navy', 'Banana Republic', 'Athleta'];

const CATS = [
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'outer', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'acc', label: 'Accessories' },
];

/* f = formality (1 relaxed, 3 tailored). tone = 'neutral' or a hue that should not clash with another hue.
   denim = wash, used to stop same-wash denim-on-denim. */
const CLOSET = [
  { id: 't1', name: 'Soft Crew Tee', brand: 'Gap', type: 'tee', cat: 'top', color: '#F4F2EC', colorName: 'Optic White', tone: 'neutral', f: 1.5, price: 19.95, wears: 41, bought: 'Apr 12, 2025', last: 'Oct 2', size: 'M' },
  { id: 't2', name: 'Organic Pocket Tee', brand: 'Gap', type: 'pockettee', cat: 'top', color: '#232323', colorName: 'True Black', tone: 'neutral', f: 1.5, price: 24.95, wears: 28, bought: 'Jun 3, 2025', last: 'Sep 29', size: 'M' },
  { id: 't3', name: 'Classic Oxford Shirt', brand: 'Gap', type: 'shirt', cat: 'top', color: '#B7CBE2', colorName: 'Light Blue', tone: 'neutral', f: 2.5, price: 59.95, wears: 19, bought: 'Feb 8, 2025', last: 'Sep 15', size: 'M' },
  { id: 't4', name: 'Merino Crew Sweater', brand: 'Banana Republic', type: 'sweater', cat: 'top', color: '#B48A5A', colorName: 'Camel', tone: 'neutral', f: 2, price: 90, wears: 12, bought: 'Nov 20, 2024', last: 'Sep 24', size: 'M' },
  { id: 't5', name: 'Striped Boatneck Tee', brand: 'Uniqlo', type: 'longsleeve', cat: 'top', color: '#EFE9DC', pattern: 'stripe', colorName: 'Navy Stripe', tone: 'neutral', f: 1.5, price: 24.9, wears: 15, bought: 'Added by photo', last: 'Sep 27', size: 'M' },
  { id: 't6', name: 'Fleece Hoodie', brand: 'Gap', type: 'hoodie', cat: 'top', color: '#A9A8A4', colorName: 'Heather Grey', tone: 'neutral', f: 1, price: 54.95, wears: 52, bought: 'Oct 1, 2024', last: 'Oct 5', size: 'M' },
  { id: 't7', name: 'Linen Shirt', brand: 'Everlane', type: 'linenshirt', cat: 'top', color: '#E9E1CF', colorName: 'Ecru', tone: 'neutral', f: 2, price: 68, wears: 6, bought: 'Added by link', last: 'Aug 30', size: 'M' },
  { id: 't8', name: 'Rib-Knit Long-Sleeve Tee', brand: 'Old Navy', type: 'longsleeve', cat: 'top', color: '#2F4A3A', colorName: 'Forest', tone: 'green', f: 1.5, price: 16.99, wears: 9, bought: 'Jan 14, 2026', last: 'Sep 9', size: 'M' },
  { id: 't9', name: 'Soft Knit Sweater', brand: 'Gap', type: 'sweater', cat: 'top', color: '#6B2633', colorName: 'Burgundy', tone: 'burgundy', f: 2, price: 59.95, wears: 4, bought: 'Dec 2, 2025', last: 'Mar 3', size: 'M' },

  { id: 'b1', name: "Loose Straight Jeans", brand: 'Gap', type: 'loosejeans', cat: 'bottom', color: '#46658C', colorName: 'Medium Indigo', tone: 'neutral', denim: 'mid', f: 1.5, price: 69.95, wears: 38, bought: 'Mar 30, 2025', last: 'Oct 3', size: '32' },
  { id: 'b2', name: 'Original Fit Jeans', brand: "Levi's", type: 'jeans', cat: 'bottom', color: '#22324D', colorName: 'Dark Rinse', tone: 'neutral', denim: 'dark', f: 1.5, price: 79.5, wears: 30, bought: 'Added by photo', last: 'Sep 30', size: '32' },
  { id: 'b3', name: 'Tailored Wool Trousers', brand: 'Banana Republic', type: 'trousers', cat: 'bottom', color: '#3E3E41', colorName: 'Charcoal', tone: 'neutral', f: 3, price: 130, wears: 8, bought: 'Sep 5, 2025', last: 'Sep 22', size: '32' },
  { id: 'b4', name: 'Tapered Jogger', brand: 'Athleta', type: 'joggers', cat: 'bottom', color: '#1F1F21', colorName: 'Black', tone: 'neutral', f: 1, price: 99, wears: 25, bought: 'May 18, 2025', last: 'Oct 5', size: 'M' },
  { id: 'b5', name: 'Wide Straight Trousers', brand: 'Uniqlo', type: 'widetrousers', cat: 'bottom', color: '#262626', colorName: 'Black', tone: 'neutral', f: 2.5, price: 49.9, wears: 4, bought: 'Added by photo', last: 'Jul 19', size: '32' },

  { id: 'o1', name: 'Classic Denim Jacket', brand: 'Gap', type: 'denimjacket', cat: 'outer', color: '#5B7BA3', colorName: 'Medium Wash', tone: 'neutral', denim: 'mid', f: 1.5, price: 89.95, wears: 22, bought: 'Apr 12, 2025', last: 'Sep 26', size: 'M' },
  { id: 'o2', name: 'Classic Trench Coat', brand: 'Banana Republic', type: 'trench', cat: 'outer', color: '#C7B693', colorName: 'Stone', tone: 'neutral', f: 2.5, price: 250, wears: 11, bought: 'Oct 28, 2024', last: 'Sep 18', size: 'M' },
  { id: 'o3', name: 'Packable Puffer', brand: 'Uniqlo', type: 'puffer', cat: 'outer', color: '#1E1E1E', colorName: 'Black', tone: 'neutral', f: 1, price: 79.9, wears: 14, bought: 'Added by photo', last: 'Mar 11', size: 'M' },
  { id: 'o4', name: 'Wool-Blend Blazer', brand: 'Gap', type: 'blazer', cat: 'outer', color: '#26324A', colorName: 'Navy', tone: 'neutral', f: 3, price: 128, wears: 3, bought: 'Feb 21, 2026', last: 'Jun 6', size: 'M' },

  { id: 's1', name: 'Court Sneakers', brand: 'Nike', type: 'sneakers', cat: 'shoes', color: '#F5F4F0', colorName: 'White', tone: 'neutral', f: 1.5, price: 90, wears: 64, bought: 'Added by photo', last: 'Oct 5', size: '9.5' },
  { id: 's2', name: 'Chelsea Boots', brand: 'Blundstone', type: 'boots', cat: 'shoes', color: '#5E3F2C', colorName: 'Rustic Brown', tone: 'neutral', f: 2, price: 230, wears: 33, bought: 'Added by link', last: 'Oct 3', size: '9.5' },
  { id: 's3', name: 'Penny Loafers', brand: 'G.H. Bass', type: 'loafers', cat: 'shoes', color: '#4A2E22', colorName: 'Dark Brown', tone: 'neutral', f: 2.5, price: 150, wears: 5, bought: 'Added by photo', last: 'Jun 6', size: '9.5' },

  { id: 'a1', name: 'Canvas Tote', brand: 'Gap', type: 'tote', cat: 'acc', color: '#E8E0CC', colorName: 'Ecru', tone: 'neutral', f: 1.5, price: 29.95, wears: 40, bought: 'Jul 7, 2025', last: 'Oct 3', size: 'One size' },
  { id: 'a2', name: 'Rib-Knit Beanie', brand: 'Old Navy', type: 'beanie', cat: 'acc', color: '#A3532F', colorName: 'Rust', tone: 'rust', f: 1, price: 12.99, wears: 10, bought: 'Dec 9, 2025', last: 'Mar 2', size: 'One size' },
  { id: 'a3', name: 'Washed Baseball Cap', brand: 'Gap', type: 'cap', cat: 'acc', color: '#2A3654', colorName: 'Navy', tone: 'neutral', f: 1, price: 24.95, wears: 18, bought: 'Aug 2, 2025', last: 'Oct 5', size: 'One size' },
];

/* New Gap items the engine can recommend. style = how well the item fits Jordan's saved looks (0-1). */
const CATALOG = [
  { id: 'n1', name: 'Straight Khakis', brand: 'Gap', type: 'chinos', cat: 'bottom', color: '#C4AE84', colorName: 'Khaki', tone: 'neutral', f: 2, price: 59.95, style: 0.96, stock: 'In stock in 32 × 30', why: "You don't own a light-colored bottom yet." },
  { id: 'n2', name: "Straight Jeans", brand: 'Gap', type: 'jeans', light: true, cat: 'bottom', color: '#9DB6CF', colorName: 'Light Wash', tone: 'neutral', denim: 'light', f: 1.5, price: 69.95, style: 0.9, stock: 'In stock in 32 × 30', why: "Your jeans are mid and dark wash; a light wash adds contrast with your darker tops." },
  { id: 'n3', name: 'Relaxed Pleated Trousers', brand: 'Gap', type: 'widetrousers', cat: 'bottom', color: '#E4DAC4', colorName: 'Oatmeal', tone: 'neutral', f: 2.5, price: 79.95, style: 0.82, stock: 'Low stock in 32', why: "A dressier bottom that still works with your sneakers." },
  { id: 'n4', name: 'Utility Chore Jacket', brand: 'Gap', type: 'chorejacket', cat: 'outer', color: '#5E6243', colorName: 'Army Olive', tone: 'neutral', f: 2, price: 98, style: 0.92, stock: 'In stock in M', why: "Your trench, denim jacket and puffer already cover every outfit you own." },
  { id: 'n5', name: 'Soft Knit Cardigan', brand: 'Gap', type: 'cardigan', cat: 'top', color: '#D7CBB3', colorName: 'Oat Heather', tone: 'neutral', f: 2, price: 69.95, style: 0.86, stock: 'In stock in M', why: "A light layer that works over your tees and shirts alike." },
  { id: 'n6', name: 'Wool-Blend Car Coat', brand: 'Gap', type: 'coat', cat: 'outer', color: '#B08355', colorName: 'Camel', tone: 'neutral', f: 2.5, price: 168, style: 0.78, stock: 'In stock in M', why: "Your trench, denim jacket and puffer already cover every outfit you own." },
  { id: 'n7', name: 'Fleece Hoodie', brand: 'Gap', type: 'hoodie', cat: 'top', color: '#A9A8A4', colorName: 'Heather Grey', tone: 'neutral', f: 1, price: 54.95, style: 0.95, stock: 'In stock in M', dupOf: 't6', why: "You already own it in Heather Grey and have worn it 52 times." },
  { id: 'n8', name: 'Denim Shirt', brand: 'Gap', type: 'shirt', cat: 'top', color: '#5A7699', colorName: 'Medium Wash', tone: 'neutral', denim: 'mid', f: 2, price: 59.95, style: 0.74, stock: 'In stock in M', why: "Pairs with your dark jeans and tailored trousers." },
  { id: 'n9', name: 'Classic Oxford Shirt', brand: 'Gap', type: 'shirt', cat: 'top', color: '#F3F2EE', colorName: 'White', tone: 'neutral', f: 2.5, price: 59.95, style: 0.88, stock: 'In stock in M', similarTo: 't3', why: "Close to your Light Blue Oxford, so it ranks lower." },
];

/* Planner week: Mon Oct 5 to Sun Oct 11, 2026. Today is Tue Oct 6. */
const WEEK = [
  { key: 'mon', day: 'Mon', date: 5, temp: 64, sky: 'sun', events: ['Work from home'], outfit: { top: 't6', bottom: 'b4', shoes: 's1', acc: 'a3' }, worn: true },
  { key: 'tue', day: 'Tue', date: 6, temp: 61, sky: 'fog', events: ['Client presentation · 2 PM'], outfit: { outer: 'o2', top: 't3', bottom: 'b1', shoes: 's2', acc: 'a1' }, today: true },
  { key: 'wed', day: 'Wed', date: 7, temp: 66, sky: 'sun', events: ['Client lunch · 12:30 PM'], outfit: { top: 't7', bottom: 'b3', shoes: 's3' } },
  { key: 'thu', day: 'Thu', date: 8, temp: 63, sky: 'cloud', events: [], outfit: { outer: 'o1', top: 't1', bottom: 'b2', shoes: 's1' } },
  { key: 'fri', day: 'Fri', date: 9, temp: 59, sky: 'wind', events: ['Dinner in Hayes Valley · 7:30 PM'], outfit: { outer: 'o4', top: 't9', bottom: 'b5', shoes: 's3' }, rediscover: 'o4' },
];

const TRIP = {
  name: 'Sonoma weekend',
  days: 'Sat Oct 10 – Sun Oct 11',
  high: 78,
  low: 52,
  event: 'Winery dinner · Sat 7 PM',
  pack: ['t1', 't5', 't7', 'b2', 'o1', 's1', 's2', 'a1'],
  missing: 'n1',
  honest: 'b3',
};

const PERSON = { first: 'Jordan', last: 'Lee', tier: 'Gap Inc. rewards member', city: 'San Francisco' };
