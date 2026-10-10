import type { Metadata } from 'next';
import { GarmentDefs } from '@/components/GarmentDefs';
import { Shell } from '@/components/Shell';
import { fontVariables } from '@/lib/fonts';
import { StoreProvider } from '@/lib/store';
import { THEME_SCRIPT } from '@/lib/theme-script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotation — style what you own',
  description: 'A closet and outfit planner for clothes from any store. Style what you own, and find the pieces that unlock the most new outfits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The head script sets data-theme before React hydrates, hence suppressHydrationWarning.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <GarmentDefs />
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
