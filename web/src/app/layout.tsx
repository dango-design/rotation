import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { Shell } from '@/components/Shell';
import { StoreProvider } from '@/lib/store';
import { THEME_SCRIPT } from '@/lib/theme-script';
import './globals.css';

const sans = DM_Sans({ variable: '--font-sans', subsets: ['latin'] });
const serif = Instrument_Serif({ variable: '--font-serif', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Rotation — style what you own',
  description: 'A closet and outfit planner for clothes from any store. Style what you own, and find the pieces that unlock the most new outfits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The head script sets data-theme before React hydrates, hence suppressHydrationWarning.
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* Shared definitions used by every garment illustration */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".18" />
              <stop offset=".5" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity=".1" />
            </linearGradient>
            <pattern id="p-stripe" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#EFE9DC" />
              <rect y="7" width="12" height="4" fill="#25324B" />
            </pattern>
          </defs>
        </svg>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
