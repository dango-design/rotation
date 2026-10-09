/* Viewports at the widths where Rotation's layout changes (globals.css breakpoints: 900, 1180, 1320px),
   and the Chromatic modes that snapshot them. Pages use `pageModes`; components that change in the dark use
   `themeModes`; everything else keeps Chromatic's default. */

export const VIEWPORTS = {
  phone: { name: 'Phone · 390 (≤ 900 layout)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  tablet: { name: 'Tablet · 1024 (≤ 1180 layout)', styles: { width: '1024px', height: '1366px' }, type: 'tablet' },
  laptop: { name: 'Laptop · 1280 (≤ 1320 layout)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  desktop: { name: 'Desktop · 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} as const;

export const modes = {
  phone: { viewport: 'phone', theme: 'light' },
  tablet: { viewport: 'tablet', theme: 'light' },
  laptop: { viewport: 'laptop', theme: 'light' },
  desktop: { viewport: 'desktop', theme: 'light' },
  'desktop dark': { viewport: 'desktop', theme: 'dark' },
} as const;

/** Full pages: the three layouts people actually get, and the desktop one in dark. */
export const pageModes = { phone: modes.phone, tablet: modes.tablet, desktop: modes.desktop, 'desktop dark': modes['desktop dark'] };

/** A component or foundation page in both themes. */
export const themeModes = { light: { theme: 'light' }, dark: { theme: 'dark' } } as const;
