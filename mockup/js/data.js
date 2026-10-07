/* Demo data for one person: Jordan, in San Francisco, who shops at many stores.
   Store names are used for illustration; product names and prices are examples, not live data. */

const APP = { name: 'rotation', tagline: "Style what you own. Shop what's missing." };

const CATS = [
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'outer', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'acc', label: 'Accessories' },
];

/* Stores the email import recognizes in this prototype. */
const SUPPORTED_STORES = [
  'Gap', 'Old Navy', 'Banana Republic', 'J.Crew', 'Madewell', 'Uniqlo', 'Zara', 'H&M',
  "Levi's", 'Nike', 'Lululemon', 'Everlane', 'Abercrombie & Fitch', 'Nordstrom', 'Amazon', 'Target',
];

/* f = formality (1 relaxed, 3 tailored). tone = 'neutral' or a hue that should not clash with another hue.
   denim = wash, used to stop same-wash denim-on-denim.
   source: 'email' (imported from an order confirmation), 'photo' or 'link'. store = where it was bought, when it differs from the brand. */
const CLOSET = [
  { id: 't1', name: 'Soft Crew Tee', brand: 'Gap', source: 'email', type: 'tee', cat: 'top', color: '#F4F2EC', colorName: 'Optic White', tone: 'neutral', f: 1.5, price: 19.95, wears: 41, bought: 'Apr 12, 2025', last: 'Oct 2', size: 'M' },
  { id: 't2', name: 'Organic Pocket Tee', brand: 'Everlane', source: 'email', type: 'pockettee', cat: 'top', color: '#232323', colorName: 'Black', tone: 'neutral', f: 1.5, price: 30, wears: 28, bought: 'Jun 3, 2025', last: 'Sep 29', size: 'M' },
  { id: 't3', name: 'Classic Oxford Shirt', brand: 'J.Crew', source: 'email', type: 'shirt', cat: 'top', color: '#B7CBE2', colorName: 'Light Blue', tone: 'neutral', f: 2.5, price: 79.5, wears: 19, bought: 'Feb 8, 2025', last: 'Sep 15', size: 'M' },
  { id: 't4', name: 'Merino Crew Sweater', brand: 'Uniqlo', source: 'email', type: 'sweater', cat: 'top', color: '#B48A5A', colorName: 'Camel', tone: 'neutral', f: 2, price: 49.9, wears: 12, bought: 'Nov 20, 2024', last: 'Sep 24', size: 'M' },
  { id: 't5', name: 'Striped Boatneck Tee', brand: 'Madewell', source: 'photo', type: 'longsleeve', cat: 'top', color: '#EFE9DC', pattern: 'stripe', colorName: 'Navy Stripe', tone: 'neutral', f: 1.5, price: 39.5, wears: 15, last: 'Sep 27', size: 'M' },
  { id: 't6', name: 'Fleece Hoodie', brand: 'Gap', source: 'email', type: 'hoodie', cat: 'top', color: '#A9A8A4', colorName: 'Heather Grey', tone: 'neutral', f: 1, price: 54.95, wears: 52, bought: 'Oct 1, 2024', last: 'Oct 5', size: 'M' },
  { id: 't7', name: 'Linen Shirt', brand: 'Everlane', source: 'link', type: 'linenshirt', cat: 'top', color: '#E9E1CF', colorName: 'Ecru', tone: 'neutral', f: 2, price: 68, wears: 6, last: 'Aug 30', size: 'M' },
  { id: 't8', name: 'Rib-Knit Long-Sleeve Tee', brand: 'Old Navy', source: 'email', type: 'longsleeve', cat: 'top', color: '#2F4A3A', colorName: 'Forest', tone: 'green', f: 1.5, price: 16.99, wears: 9, bought: 'Jan 14, 2026', last: 'Sep 9', size: 'M' },
  { id: 't9', name: 'Soft Knit Sweater', brand: 'Banana Republic', source: 'email', type: 'sweater', cat: 'top', color: '#6B2633', colorName: 'Burgundy', tone: 'burgundy', f: 2, price: 89, wears: 4, bought: 'Dec 2, 2025', last: 'Mar 3', size: 'M' },

  { id: 'b1', name: 'Loose Straight Jeans', brand: 'Gap', source: 'email', type: 'loosejeans', cat: 'bottom', color: '#46658C', colorName: 'Medium Indigo', tone: 'neutral', denim: 'mid', f: 1.5, price: 69.95, wears: 38, bought: 'Mar 30, 2025', last: 'Oct 3', size: '32 × 30' },
  { id: 'b2', name: 'Original Fit Jeans', brand: "Levi's", source: 'photo', type: 'jeans', cat: 'bottom', color: '#22324D', colorName: 'Dark Rinse', tone: 'neutral', denim: 'dark', f: 1.5, price: 79.5, wears: 30, last: 'Sep 30', size: '32 × 30' },
  { id: 'b3', name: 'Tailored Wool Trousers', brand: 'Banana Republic', source: 'email', type: 'trousers', cat: 'bottom', color: '#3E3E41', colorName: 'Charcoal', tone: 'neutral', f: 3, price: 130, wears: 8, bought: 'Sep 5, 2025', last: 'Sep 22', size: '32' },
  { id: 'b4', name: 'Tapered Jogger', brand: 'Lululemon', source: 'email', type: 'joggers', cat: 'bottom', color: '#1F1F21', colorName: 'Black', tone: 'neutral', f: 1, price: 118, wears: 25, bought: 'May 18, 2025', last: 'Oct 5', size: 'M' },
  { id: 'b5', name: 'Wide Straight Trousers', brand: 'Zara', source: 'email', type: 'widetrousers', cat: 'bottom', color: '#262626', colorName: 'Black', tone: 'neutral', f: 2.5, price: 45.9, wears: 4, bought: 'Jul 2, 2025', last: 'Jul 19', size: '32' },

  { id: 'o1', name: 'Classic Denim Jacket', brand: "Levi's", source: 'email', type: 'denimjacket', cat: 'outer', color: '#5B7BA3', colorName: 'Medium Wash', tone: 'neutral', denim: 'mid', f: 1.5, price: 98, wears: 22, bought: 'Apr 19, 2025', last: 'Sep 26', size: 'M' },
  { id: 'o2', name: 'Classic Trench Coat', brand: 'Abercrombie & Fitch', source: 'email', type: 'trench', cat: 'outer', color: '#C7B693', colorName: 'Stone', tone: 'neutral', f: 2.5, price: 180, wears: 11, bought: 'Oct 28, 2024', last: 'Sep 18', size: 'M' },
  { id: 'o3', name: 'Packable Puffer', brand: 'Uniqlo', source: 'photo', type: 'puffer', cat: 'outer', color: '#1E1E1E', colorName: 'Black', tone: 'neutral', f: 1, price: 79.9, wears: 14, last: 'Mar 11', size: 'M' },
  { id: 'o4', name: 'Wool-Blend Blazer', brand: 'J.Crew', source: 'email', type: 'blazer', cat: 'outer', color: '#26324A', colorName: 'Navy', tone: 'neutral', f: 3, price: 198, wears: 3, bought: 'Feb 21, 2026', last: 'Jun 6', size: 'M' },

  { id: 's1', name: 'Court Sneakers', brand: 'Nike', source: 'email', type: 'sneakers', cat: 'shoes', color: '#F5F4F0', colorName: 'White', tone: 'neutral', f: 1.5, price: 90, wears: 64, bought: 'Mar 9, 2024', last: 'Oct 5', size: '9.5' },
  { id: 's2', name: 'Chelsea Boots', brand: 'Blundstone', store: 'Nordstrom', source: 'email', type: 'boots', cat: 'shoes', color: '#5E3F2C', colorName: 'Rustic Brown', tone: 'neutral', f: 2, price: 230, wears: 33, bought: 'Nov 2, 2023', last: 'Oct 3', size: '9.5' },
  { id: 's3', name: 'Penny Loafers', brand: 'G.H. Bass', store: 'Amazon', source: 'email', type: 'loafers', cat: 'shoes', color: '#4A2E22', colorName: 'Dark Brown', tone: 'neutral', f: 2.5, price: 150, wears: 5, bought: 'Jan 5, 2026', last: 'Jun 6', size: '9.5' },

  { id: 'a1', name: 'Canvas Tote', brand: 'Madewell', source: 'email', type: 'tote', cat: 'acc', color: '#E8E0CC', colorName: 'Ecru', tone: 'neutral', f: 1.5, price: 38, wears: 40, bought: 'Jul 7, 2025', last: 'Oct 3', size: 'One size' },
  { id: 'a2', name: 'Rib-Knit Beanie', brand: 'Old Navy', source: 'email', type: 'beanie', cat: 'acc', color: '#A3532F', colorName: 'Rust', tone: 'rust', f: 1, price: 12.99, wears: 10, bought: 'Dec 9, 2025', last: 'Mar 2', size: 'One size' },
  { id: 'a3', name: 'Washed Baseball Cap', brand: 'H&M', source: 'email', type: 'cap', cat: 'acc', color: '#2A3654', colorName: 'Navy', tone: 'neutral', f: 1, price: 14.99, wears: 18, bought: 'Aug 2, 2025', last: 'Oct 5', size: 'One size' },
];

/* Pieces the engine can recommend. Each is a kind of item, with matching options from several stores.
   style = fit with Jordan's saved looks (0-1). fit = the size to buy, from past orders where known. */
const CATALOG = [
  {
    id: 'n1', name: 'Light Straight Chinos', phrase: 'one pair of light straight chinos', type: 'chinos', cat: 'bottom', color: '#C4AE84', colorName: 'Khaki', tone: 'neutral', f: 2, style: 0.96,
    why: "You don't own a light-colored bottom yet.",
    options: [
      { store: 'Uniqlo', product: 'Chino Pants', price: 39.9, fit: 'Likely 32, based on your other bottoms' },
      { store: 'Gap', product: 'Straight Khakis', price: 59.95, fit: 'Your size: 32 × 30, from past orders' },
      { store: 'J.Crew', product: 'Classic Chino', price: 79.5, fit: 'Likely 32 × 30, based on your other bottoms' },
    ],
  },
  {
    id: 'n2', name: 'Light-Wash Straight Jeans', phrase: 'one pair of light-wash straight jeans', type: 'jeans', cat: 'bottom', color: '#9DB6CF', colorName: 'Light Wash', tone: 'neutral', denim: 'light', f: 1.5, style: 0.9,
    why: 'Your jeans are mid and dark wash; a light wash adds contrast with your darker tops.',
    options: [
      { store: "Levi's", product: 'Straight Jeans, Light Wash', price: 69.5, fit: 'Your size: 32 × 30, from past orders' },
      { store: 'Gap', product: 'Straight Jeans, Light Wash', price: 69.95, fit: 'Your size: 32 × 30, from past orders' },
      { store: 'Madewell', product: 'Straight Jean, Light Wash', price: 128, fit: 'Likely 31 × 30; this brand runs large' },
    ],
  },
  {
    id: 'n3', name: 'Pleated Wide Trousers', phrase: 'one pair of pleated wide trousers', type: 'widetrousers', cat: 'bottom', color: '#E4DAC4', colorName: 'Oatmeal', tone: 'neutral', f: 2.5, style: 0.82,
    why: 'A dressier bottom that still works with your sneakers.',
    options: [
      { store: 'Zara', product: 'Pleated Wide-Leg Trousers', price: 49.9, fit: 'Your size: 32, from past orders' },
      { store: 'Abercrombie & Fitch', product: 'Relaxed Pleated Trouser', price: 90, fit: 'Likely 32, based on your other bottoms' },
      { store: 'Banana Republic', product: 'Pleated Wide-Leg Trouser', price: 120, fit: 'Your size: 32, from past orders' },
    ],
  },
  {
    id: 'n4', name: 'Utility Chore Jacket', type: 'chorejacket', cat: 'outer', color: '#5E6243', colorName: 'Army Olive', tone: 'neutral', f: 2, style: 0.92,
    why: 'Your trench, denim jacket and puffer already cover every outfit you own.',
    options: [{ store: 'Madewell', product: 'Utility Chore Jacket', price: 128, fit: '' }],
  },
  {
    id: 'n5', name: 'Soft Knit Cardigan', type: 'cardigan', cat: 'top', color: '#D7CBB3', colorName: 'Oat Heather', tone: 'neutral', f: 2, style: 0.86,
    why: 'A light layer that works over your tees and shirts alike.',
    options: [
      { store: 'Uniqlo', product: 'Soft Knit Cardigan', price: 49.9, fit: 'Your size: M, from past orders' },
      { store: 'J.Crew', product: 'Cotton Cardigan', price: 98, fit: 'Your size: M, from past orders' },
    ],
  },
  {
    id: 'n6', name: 'Wool-Blend Car Coat', type: 'coat', cat: 'outer', color: '#B08355', colorName: 'Camel', tone: 'neutral', f: 2.5, style: 0.78,
    why: 'Your trench, denim jacket and puffer already cover every outfit you own.',
    options: [{ store: 'Banana Republic', product: 'Wool-Blend Car Coat', price: 260, fit: '' }],
  },
  {
    id: 'n7', name: 'Fleece Hoodie', type: 'hoodie', cat: 'top', color: '#A9A8A4', colorName: 'Heather Grey', tone: 'neutral', f: 1, style: 0.95, dupOf: 't6',
    why: 'You already own one in Heather Grey and have worn it 52 times.',
    options: [{ store: 'Gap', product: 'Fleece Hoodie', price: 54.95, fit: '' }],
  },
  {
    id: 'n8', name: 'Denim Shirt', type: 'shirt', cat: 'top', color: '#5A7699', colorName: 'Medium Wash', tone: 'neutral', denim: 'mid', f: 2, style: 0.74,
    why: 'Pairs with your dark jeans and tailored trousers.',
    options: [
      { store: "Levi's", product: 'Western Denim Shirt', price: 69.5, fit: 'Your size: M, from past orders' },
      { store: 'Madewell', product: 'Denim Shirt', price: 88, fit: 'Your size: M, from past orders' },
    ],
  },
  {
    id: 'n9', name: 'White Oxford Shirt', type: 'shirt', cat: 'top', color: '#F3F2EE', colorName: 'White', tone: 'neutral', f: 2.5, style: 0.88, similarTo: 't3',
    why: 'Close to your Light Blue Oxford, so it ranks lower.',
    options: [
      { store: 'Uniqlo', product: 'Oxford Shirt', price: 39.9, fit: 'Your size: M, from past orders' },
      { store: 'J.Crew', product: 'Oxford Shirt', price: 79.5, fit: 'Your size: M, from past orders' },
    ],
  },
];
CATALOG.forEach((p) => (p.price = Math.min(...p.options.map((o) => o.price))));

/* Stores Jordan marked as favorites; their options are listed first. */
const FAVORITE_STORES = ['Gap', "Levi's", 'Uniqlo'];

/* Planner week: Mon Oct 5 to Fri Oct 9, 2026. Today is Tue Oct 6. */
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

const PERSON = { first: 'Jordan', last: 'Lee', city: 'San Francisco', inbox: 'Gmail' };
