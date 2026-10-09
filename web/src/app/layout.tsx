import type { Metadata } from 'next';
import { GarmentDefs } from '@/components/GarmentDefs';
import { Shell } from '@/components/Shell';
import { fontVariables } from '@/lib/fonts';
import { StoreProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotation — style what you own',
  description: 'A closet and outfit planner for clothes from any store. Style what you own, and find the pieces that unlock the most new outfits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <GarmentDefs />
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
