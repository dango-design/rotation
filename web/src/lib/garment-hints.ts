/* What a product's name says it is. "Wide-leg jeans" is a bottom, so on a model photo the jeans are the piece to cut
   out, not the top or the shoes. Also used to suggest the type when photo tagging is off. */

import type { GarmentType } from './types';

/** The parts of an outfit the clothing parser can find separately in a photo. */
export type ParserPart = 'top' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'hat' | 'scarf' | 'belt' | 'sunglasses';
/** Parts a product name can describe: the parser's, plus jewelry, which it can't see. */
export type Part = ParserPart | 'jewelry';

export const PART_LABEL: Record<Part, string> = {
  top: 'Top',
  bottom: 'Bottoms',
  dress: 'Dress',
  shoes: 'Shoes',
  bag: 'Bag',
  hat: 'Hat',
  scarf: 'Scarf',
  belt: 'Belt',
  sunglasses: 'Sunglasses',
  jewelry: 'Jewelry',
};

/** A reasonable type to start from when only the part is known. */
export const PART_TYPE: Record<Part, GarmentType> = {
  top: 'tee',
  bottom: 'chinos',
  dress: 'dress',
  shoes: 'sneakers',
  bag: 'tote',
  hat: 'cap',
  scarf: 'scarf',
  belt: 'belt',
  sunglasses: 'sunglasses',
  jewelry: 'necklace',
};

export interface Hint {
  part: Part;
  type?: GarmentType;
}

// Checked in order, so specific phrases win over single words: "shirt dress" is a dress, "denim jacket" a jacket,
// "bootcut jeans" jeans, "high-top sneakers" shoes and "belt bag" a bag.
const RULES: [RegExp, Part, GarmentType?][] = [
  [/\bshirt[\s-]?dress(es)?\b/, 'dress', 'shirtdress'],
  [/\bslip[\s-]dress(es)?\b/, 'dress', 'slipdress'],
  [/\bdress(es)?\b(?![\s-]+(shirt|pants?|trousers?|shoes?|boots?|socks?|code))/, 'dress', 'dress'],
  [/\b(jumpsuit|romper|playsuit|overalls?|dungarees|boilersuit)\b/, 'dress', 'jumpsuit'],
  [/\b(denim|jean|trucker)\s+jacket\b/, 'top', 'denimjacket'],
  [/\b(chore|work|barn|field|utility)\s+(coat|jacket)\b|\bover-?shirt\b|\bshacket\b|\bshirt[\s-]jacket\b/, 'top', 'chorejacket'],
  [/\b(blazer|sport\s?coat|suit\s+jacket)\b/, 'top', 'blazer'],
  [/\b(trench|raincoat)\b/, 'top', 'trench'],
  [/\b(puffer|down\s+jacket|parka|quilted\s+jacket|anorak)\b/, 'top', 'puffer'],
  [/\b(over|top|pea|wool|car)\s?coat\b|\bcoat\b/, 'top', 'coat'],
  [/\bjacket\b/, 'top', 'chorejacket'],
  [/\b(sneakers?|trainers?|runners?|running\s+shoes?|high[\s-]tops?|low[\s-]tops?|plimsolls?)\b/, 'shoes', 'sneakers'],
  [/\bboots?\b(?![\s-]?cut)|\bbooties\b|\bchelsea\b/, 'shoes', 'boots'],
  [/\b(flats|ballet\s+flats?|ballerinas?|mary\s+janes?)\b/, 'shoes', 'flats'],
  [/\b(loafers?|mules?|oxfords|derbys?|brogues?|moccasins?|clogs?)\b/, 'shoes', 'loafers'],
  [/\b(shoes?|sandals?|heels|pumps|slides|espadrilles|slippers)\b/, 'shoes'],
  [/\b(crossbody|cross-body|sling|belt\s+bag|bum\s+bag|fanny\s+pack|camera\s+bag)\b/, 'bag', 'crossbody'],
  [/\b(backpack|rucksack|daypack)\b/, 'bag', 'backpack'],
  [/\b(clutch|evening\s+bag|minaudiere|pouch)\b/, 'bag', 'clutch'],
  [/(?<!paper\s?)\b(bag|tote|purse|handbag|satchel|duffel|hobo)\b/, 'bag', 'tote'],
  [/\bbeanie\b|\bwatch\s+cap\b|\btoque\b/, 'hat', 'beanie'],
  [/\bcap\b(?![\s-]sleeve)|\b(hat|fedora)\b/, 'hat', 'cap'],
  [/\b(necklace|pendant|choker)\b/, 'jewelry', 'necklace'],
  [/\b(earrings?|studs|hoops|huggies)\b/, 'jewelry', 'earrings'],
  [/\b(bracelet|bangle|cuff)\b/, 'jewelry', 'bracelet'],
  [/\bwatch\b/, 'jewelry', 'watch'],
  [/\b(scarf|scarves|bandana|shawl)\b/, 'scarf', 'scarf'],
  [/\bbelt\b/, 'belt', 'belt'],
  [/\b(sunglasses|sunnies|shades)\b/, 'sunglasses', 'sunglasses'],
  [/\bcardigan\b/, 'top', 'cardigan'],
  [/\b(hoodie|hoody|sweatshirt|half[\s-]zip|quarter[\s-]zip)\b/, 'top', 'hoodie'],
  [/\b(sweater|jumper|pullover|turtleneck|mock[\s-]?neck)\b/, 'top', 'sweater'],
  [/\bpocket\s+(tee|t-shirt)\b/, 'top', 'pockettee'],
  [/\blong[\s-]sleeve\s+(tee|t-shirt|top)\b|\bhenley\b/, 'top', 'longsleeve'],
  [/\b(tee|t-shirt|tshirt|tank|cami|camisole|polo)\b/, 'top', 'tee'],
  [/\b(linen|camp|cuban|resort|flannel|chambray|denim|western)\s+shirt\b/, 'top', 'linenshirt'],
  [/\bshirt\b/, 'top', 'shirt'],
  [/\b(blouse|top|bodysuit|tunic)\b/, 'top', 'tee'],
  [/\b(skirt|skort)\b/, 'bottom', 'skirt'],
  [/\bshorts\b/, 'bottom', 'shorts'],
  [/\b(wide|loose|baggy|relaxed|barrel|balloon|bootcut|boot[\s-]cut|flare|flared|carpenter|dad|mom|boyfriend)[\s-]+(leg\s+|fit\s+)?jeans?\b/, 'bottom', 'loosejeans'],
  [/\bjeans?\b/, 'bottom', 'jeans'],
  [/\bchinos?\b|\bkhakis\b/, 'bottom', 'chinos'],
  [/\b(jogger|joggers|sweatpants?|track\s?pants?|lounge\s+pants?)\b/, 'bottom', 'joggers'],
  [/\b(wide|palazzo)[\s-]+(leg\s+)?(trousers?|pants?)\b|\bculottes\b/, 'bottom', 'widetrousers'],
  [/\b(trousers?|slacks|suit\s+pants?|dress\s+pants?|tailored\s+pants?)\b/, 'bottom', 'trousers'],
  [/\b(pants?|leggings|cargos?)\b/, 'bottom'],
  [/\bdenim\b/, 'bottom', 'jeans'],
];

/** The part and type a product's name (and category) describe, or undefined when it names no garment. */
export function hintFrom(...texts: (string | null | undefined)[]): Hint | undefined {
  // The name says the most, then the category and breadcrumbs, then the link's path.
  for (const raw of texts) {
    if (!raw) continue;
    const s = raw.toLowerCase().replace(/[_+]/g, ' ');
    for (const [re, part, type] of RULES) if (re.test(s)) return type ? { part, type } : { part };
  }
}

/** Words from a product link's path, e.g. "/products/mens-relaxed-chino-pant?variant=1" → "mens relaxed chino pant". */
export const pathWords = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname).replace(/[\/_.-]+/g, ' ').replace(/\b\d+\b/g, ' ').trim();
  } catch {
    return '';
  }
};
