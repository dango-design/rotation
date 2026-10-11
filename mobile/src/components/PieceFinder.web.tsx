/* The browser preview of the phone app doesn't run the piece finder; photos are kept as they are. */

import type { Finder } from './PieceFinder';

const none: Finder = { available: false, status: 'failed', find: async () => null, host: <></> };

export const usePieceFinder = (): Finder => none;
export type { Finder, Found } from './PieceFinder';
