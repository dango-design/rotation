/* Logging a wear. Today's week strip can log any earlier day, so a piece's "last worn" only ever moves forward:
   logging last Monday after wearing something on Thursday still counts the wear, but Thursday stays the last time. */

import type { Item } from './types';

/** The piece after it's worn on `date` (YYYY-MM-DD, so later days compare as later strings). */
export const wornOn = (item: Item, date: string): Item => ({
  ...item,
  wears: item.wears + 1,
  lastWorn: !item.lastWorn || date > item.lastWorn ? date : item.lastWorn,
});
