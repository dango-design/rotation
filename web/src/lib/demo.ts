/* Jordan's demo closet: 30 real pieces from 11 stores, each with its product page and the store's own product
   photo. The photos aren't copied into Rotation: the demo loads each one from the store and cuts it out on the
   device, the same way adding a piece from a product link does (see demo-photos.ts). Until a photo is ready, or
   if a store moves it, the piece is drawn from its type and color. Names, colors and prices are as listed on the
   store's site in October 2026. Dates are relative to today so the demo always looks current. */

import { addDays, todayISO, weekStart } from './dates';
import type { Item, Plan, Settings, WearEntry } from './types';

type Seed = Omit<Item, 'createdAt' | 'lastWorn' | 'source'> & { daysAgo: number };

const SEED: Seed[] = [
  { id: 't1', name: 'Organic Cotton VintageSoft T-Shirt', brand: 'Gap', type: 'tee', cat: 'top', color: '#F4F2EC', colorName: 'White', tone: 'neutral', f: 1.5, price: 24.95, wears: 41, bought: '2025-04-12', daysAgo: 4, size: 'M',
    link: 'https://www.gap.com/browse/product.do?pid=795346012',
    imageUrl: 'https://content.gapinc.com/b/0062/772/669/cn62772669.png' },
  { id: 't2', name: 'Box-Cut Pocket Tee', brand: 'Everlane', type: 'pockettee', cat: 'top', color: '#232323', colorName: 'Black', tone: 'neutral', f: 1.5, price: 24, wears: 28, bought: '2025-06-03', daysAgo: 7, size: 'M',
    link: 'https://www.everlane.com/products/womens-organic-cotton-box-cut-pocket-tee-black',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0623/7916/3734/files/43360b00_a25c_ec93d607-7104-4c0b-b051-e003e1d162f1.jpg' },
  { id: 't3', name: '1983 Oxford Shirt', brand: 'J.Crew', type: 'shirt', cat: 'top', color: '#B7CBE2', colorName: 'Light Blue', tone: 'neutral', f: 2.5, price: 148, wears: 19, bought: '2025-02-08', daysAgo: 21, size: 'M',
    link: 'https://www.jcrew.com/p/mens/categories/clothing/shirts/1983-oxford-shirt-in-cotton/CQ953',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CQ953_YD4463' },
  { id: 't4', name: 'Merino Sweater', brand: 'Uniqlo', type: 'sweater', cat: 'top', color: '#E9C3C3', colorName: 'Pink', tone: 'pink', f: 2, price: 49.9, wears: 12, bought: '2024-11-20', daysAgo: 12, size: 'M',
    link: 'https://www.uniqlo.com/us/en/products/E469410-000/00?colorDisplayCode=10',
    imageUrl: 'https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/469410/item/goods_10_469410.jpg' },
  { id: 't5', name: 'Striped Heavyweight Boatneck Tee', brand: 'J.Crew', type: 'longsleeve', cat: 'top', color: '#EFE9DC', colorName: 'Ivory Stripe', tone: 'neutral', pattern: 'stripe', f: 1.5, price: 69.99, wears: 15, bought: '2025-05-20', daysAgo: 9, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/tees-and-tanks/boatneck-t-shirt-in-striped-heavyweight-cotton/CV419',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CV419_YD6091' },
  { id: 't6', name: 'VintageSoft Relaxed Zip Hoodie', brand: 'Gap', type: 'hoodie', cat: 'top', color: '#BDBCB8', colorName: 'Heather Grey', tone: 'neutral', f: 1, price: 69.95, wears: 52, bought: '2024-10-01', daysAgo: 1, size: 'M',
    link: 'https://www.gap.com/browse/product.do?pid=414188082',
    imageUrl: 'https://content.gapinc.com/b/0062/017/552/cn62017552.png' },
  { id: 't7', name: 'The Must-Have Shirt in Linen', brand: 'Everlane', type: 'linenshirt', cat: 'top', color: '#A3A89B', colorName: 'Agave Green', tone: 'neutral', f: 2, price: 62, wears: 6, bought: '2025-07-11', daysAgo: 37, size: 'M',
    link: 'https://www.everlane.com/products/womens-relaxed-linen-shirt-agave-green',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0623/7916/3734/files/d18ae3e5_0185.jpg' },
  { id: 't8', name: 'Snug Crew-Neck Long-Sleeve Tee', brand: 'Old Navy', type: 'longsleeve', cat: 'top', color: '#1F1F1F', colorName: 'Black', tone: 'neutral', f: 1.5, price: 19.99, wears: 9, bought: '2026-01-14', daysAgo: 27, size: 'M',
    link: 'https://oldnavy.gap.com/browse/product.do?pid=909485002',
    imageUrl: 'https://content.gapinc.com/b/0063/481/432/cn63481432.png' },
  { id: 't9', name: 'Merino Crew-Neck Sweater', brand: 'Banana Republic', type: 'sweater', cat: 'top', color: '#232323', colorName: 'Black', tone: 'neutral', f: 2, price: 120, wears: 4, bought: '2025-12-02', daysAgo: 217, size: 'M',
    link: 'https://bananarepublic.gap.com/browse/product.do?pid=815791082',
    imageUrl: 'https://content.gapinc.com/b/0063/359/911/cn63359911.png' },
  { id: 't10', name: 'Jackie Cardigan', brand: 'J.Crew', type: 'cardigan', cat: 'top', color: '#C8323A', colorName: 'Vintage Red', tone: 'red', f: 2, price: 128, wears: 11, bought: '2026-03-14', daysAgo: 5, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/sweaters/cardigan/jackie-cardigan-in-premium-ultrafine-cotton/CJ755',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CJ755_RD5812' },
  { id: 'd1', name: 'Rib Sweater Midi Dress', brand: 'Gap', type: 'dress', cat: 'dress', color: '#232323', colorName: 'Black', tone: 'neutral', f: 2, price: 79.95, wears: 16, bought: '2025-09-22', daysAgo: 8, size: 'M',
    link: 'https://www.gap.com/browse/product.do?pid=816435012',
    imageUrl: 'https://content.gapinc.com/b/0059/861/601/cn59861601.png' },
  { id: 'd2', name: 'Poplin Cinched Midi Shirtdress', brand: 'Gap', type: 'shirtdress', cat: 'dress', color: '#7A6A62', colorName: 'Brown Stripe', tone: 'neutral', f: 2, price: 99.95, wears: 7, bought: '2026-04-02', daysAgo: 15, size: 'M',
    link: 'https://www.gap.com/browse/product.do?pid=875487022',
    imageUrl: 'https://content.gapinc.com/b/0061/266/521/cn61266521.png' },
  { id: 'd3', name: 'Gwyneth Slip Dress', brand: 'J.Crew', type: 'slipdress', cat: 'dress', color: '#9AB0A2', colorName: 'Sage', tone: 'sage', f: 2.5, price: 148, wears: 3, bought: '2025-08-09', daysAgo: 64, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/dresses-and-jumpsuits/gwyneth-slip-dress-in-cupro-blend/CV632',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CV632_GR5818' },
  { id: 'b1', name: "'90s Loose Jeans", brand: 'Gap', type: 'loosejeans', cat: 'bottom', color: '#34507A', colorName: 'Dark Wash', tone: 'neutral', denim: 'dark', f: 1.5, price: 79.95, wears: 38, bought: '2025-03-30', daysAgo: 3, size: '32 × 30',
    link: 'https://www.gap.com/browse/product.do?pid=455517002',
    imageUrl: 'https://content.gapinc.com/b/0063/100/709/cn63100709.png' },
  { id: 'b2', name: '501 Original Fit Jeans', brand: "Levi's", type: 'jeans', cat: 'bottom', color: '#5D7FA8', colorName: 'Medium Wash', tone: 'neutral', denim: 'mid', f: 1.5, price: 69.5, wears: 30, bought: '2025-01-18', daysAgo: 6, size: '32 × 30',
    link: 'https://www.levi.com/US/en_US/clothing/men/jeans/501-original-fit-jeans/p/005012483',
    imageUrl: 'https://lsco.scene7.com/is/image/lsco/005012483-front-pdp-ld' },
  { id: 'b3', name: 'Tailored Slim Italian Barathea Suit Pant', brand: 'Banana Republic', type: 'trousers', cat: 'bottom', color: '#232A3D', colorName: 'Navy', tone: 'neutral', f: 3, price: 230, wears: 8, bought: '2025-09-05', daysAgo: 14, size: '32',
    link: 'https://bananarepublic.gap.com/browse/product.do?pid=906710002',
    imageUrl: 'https://content.gapinc.com/b/0063/032/972/cn63032972.png' },
  { id: 'b4', name: 'VintageSoft Classic Joggers', brand: 'Gap', type: 'joggers', cat: 'bottom', color: '#1F1F21', colorName: 'Black', tone: 'neutral', f: 1, price: 59.95, wears: 25, bought: '2025-05-18', daysAgo: 1, size: 'M',
    link: 'https://www.gap.com/browse/product.do?pid=737295072',
    imageUrl: 'https://content.gapinc.com/b/0056/939/225/cn56939225.png' },
  { id: 'b5', name: '365 High Rise Pleated Trousers', brand: 'Gap', type: 'widetrousers', cat: 'bottom', color: '#262626', colorName: 'Black', tone: 'neutral', f: 2.5, price: 89.95, wears: 4, bought: '2025-07-02', daysAgo: 79, size: '32',
    link: 'https://www.gap.com/browse/product.do?pid=800532022',
    imageUrl: 'https://content.gapinc.com/b/0059/548/109/cn59548109.png' },
  { id: 'b6', name: 'Midi Skirt in Compact Cotton Poplin', brand: 'J.Crew', type: 'skirt', cat: 'bottom', color: '#45474B', colorName: 'Dark Ebony', tone: 'neutral', f: 2, price: 148, wears: 6, bought: '2026-05-10', daysAgo: 23, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/skirts/pleated/midi-skirt-in-compact-cotton-poplin/CX739',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CX739_GY6237' },
  { id: 'o1', name: 'Trucker Jacket', brand: "Levi's", type: 'denimjacket', cat: 'outer', color: '#9DB6CF', colorName: 'Light Wash', tone: 'neutral', denim: 'light', f: 1.5, price: 89.5, wears: 22, bought: '2025-04-19', daysAgo: 10, size: 'M',
    link: 'https://www.levi.com/US/en_US/clothing/men/outerwear/trucker-jacket/p/723340631',
    imageUrl: 'https://lsco.scene7.com/is/image/lsco/723340631-front-pdp-ld' },
  { id: 'o2', name: 'Icon Trench Coat', brand: 'J.Crew', type: 'trench', cat: 'outer', color: '#C9AE86', colorName: 'Vintage Khaki', tone: 'neutral', f: 2.5, price: 295.99, wears: 11, bought: '2024-10-28', daysAgo: 18, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/coats-and-jackets/rain-jacket/icon-trench-coat/BF456',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/BF456_BR6302' },
  { id: 'o3', name: 'Signature Puffer Jacket', brand: 'J.Crew', type: 'puffer', cat: 'outer', color: '#C8323A', colorName: 'Vintage Red', tone: 'red', f: 1, price: 177.99, wears: 14, bought: '2024-12-03', daysAgo: 209, size: 'M',
    link: 'https://www.jcrew.com/p/womens/categories/clothing/coats-and-jackets/quilted-and-puffer/signature-puffer-jacket-with-primaloftreg/CP698',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CP698_RD5812' },
  { id: 'o4', name: 'Agnes Blazer in Lightspun Wool Blend', brand: 'J.Crew', type: 'blazer', cat: 'outer', color: '#26324A', colorName: 'Navy Pinstripe', tone: 'neutral', f: 3, price: 328, wears: 3, bought: '2026-02-21', daysAgo: 122, size: 'M',
    link: 'https://www.jcrew.com/m/womens/categories/clothing/blazers/Classic/agnes-blazer-in-lightspun-wool-blend/MQ241',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CX550_WZ8754' },
  { id: 's1', name: 'Court Vision Low Next Nature', brand: 'Nike', type: 'sneakers', cat: 'shoes', color: '#F5F4F0', colorName: 'White', tone: 'neutral', f: 1.5, price: 85, wears: 64, bought: '2024-03-09', daysAgo: 1, size: '9.5',
    link: 'https://www.nike.com/t/court-vision-low-next-nature-mens-shoes-M967RF/DH2987-100',
    imageUrl: 'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/0084df47-cf15-41d5-aab6-984460364e41/NIKE+COURT+VISION+LO+NN.png' },
  { id: 's2', name: 'Classics #585 Chelsea Boots', brand: 'Blundstone', type: 'boots', cat: 'shoes', color: '#5E3F2C', colorName: 'Rustic Brown', tone: 'neutral', f: 2, price: 219.95, wears: 33, bought: '2023-11-02', daysAgo: 3, size: '9.5',
    link: 'https://www.blundstone.com/products/rustic-brown-premium-leather-chelsea-boots-womens-style-585',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0903/6349/4707/files/product-image_2026-08-18_585_p_usa_hero.jpg' },
  { id: 's3', name: 'Larson Weejuns Penny Loafers', brand: 'G.H. Bass', type: 'loafers', cat: 'shoes', color: '#1E1E1E', colorName: 'Black', tone: 'neutral', f: 2.5, price: 195, wears: 5, bought: '2026-01-05', daysAgo: 122, size: '9.5',
    link: 'https://www.ghbass.com/products/men-larson-weejuns-penny-loafer-black',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0975/3129/8160/files/product_14334670_larson_20wj_mm_black_001-001-064_main_sq_gy.jpg' },
  { id: 's4', name: 'The Daily Flat', brand: "Rothy's", type: 'flats', cat: 'shoes', color: '#232323', colorName: 'Black', tone: 'neutral', f: 2, price: 100, wears: 20, bought: '2025-08-16', daysAgo: 2, size: '9.5',
    link: 'https://www.rothys.com/products/womens-daily-flat-black',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0877/4986/files/441_DailyFlat_Black_Side_6500.jpg' },
  { id: 'a1', name: 'Medium Seaport Tote Bag in Canvas', brand: 'J.Crew', type: 'tote', cat: 'bag', color: '#E8E0CC', colorName: 'Natural', tone: 'neutral', f: 1.5, price: 89.5, wears: 40, bought: '2025-07-07', daysAgo: 3, size: 'One size',
    link: 'https://www.jcrew.com/p/mens/categories/accessories/bags/messengers-and-totes/medium-seaport-tote-bag-in-canvas/CT152',
    imageUrl: 'https://www.jcrew.com/s7-img-facade/CT152_PP7792' },
  { id: 'a2', name: 'Ribbed Beanie', brand: 'Old Navy', type: 'beanie', cat: 'acc', color: '#232323', colorName: 'Black', tone: 'neutral', f: 1, price: 14.99, wears: 10, bought: '2025-12-09', daysAgo: 218, size: 'One size',
    link: 'https://oldnavy.gap.com/browse/product.do?pid=905873102',
    imageUrl: 'https://content.gapinc.com/b/0062/840/270/cn62840270.png' },
  { id: 'a3', name: 'Gap Logo Baseball Hat', brand: 'Gap', type: 'cap', cat: 'acc', color: '#4A3A33', colorName: 'Terra Brown', tone: 'neutral', f: 1, price: 29.95, wears: 18, bought: '2025-08-02', daysAgo: 1, size: 'One size',
    link: 'https://www.gap.com/browse/product.do?pid=912376022',
    imageUrl: 'https://content.gapinc.com/b/0062/675/157/cn62675157.png' },
];

export function demoData() {
  const today = todayISO();
  const items: Item[] = SEED.map(({ daysAgo, ...rest }) => ({
    ...rest,
    source: 'link' as const,
    id: `demo-${rest.id}`,
    lastWorn: addDays(today, -daysAgo),
    createdAt: `${rest.bought ?? '2025-01-01'}T12:00:00.000Z`,
  }));
  const id = (short: string) => `demo-${short}`;
  const mon = weekStart(today);
  const plans: Plan[] = [
    { date: today, name: 'Client presentation', slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') } },
    { date: addDays(today, 1), name: 'Client lunch', slots: { top: id('d2'), shoes: id('s4'), bag: id('a1') } },
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
