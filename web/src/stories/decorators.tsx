import type { Decorator } from '@storybook/nextjs-vite';
import { Shell } from '@/components/Shell';

/** Drawers and dialogs are fixed to the window; give the canvas a window's height so they show (and snapshot) in full. */
export const overlay: Decorator = (Story) => <div style={{ minHeight: 860 }}>{Story()}</div>;

/** The app frame: sidebar, shopping bag, demo banner, and the real drawers and dialogs. */
export const inShell: Decorator = (Story) => <Shell>{Story()}</Shell>;

/** Waits for drawers and dialogs to finish animating in, so a play function checks them where they come to rest.
    Skips endless animations (spinners) and paused ones (Storybook pauses animations while it checks accessibility). */
export const settled = () =>
  Promise.all(
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined)),
  );
