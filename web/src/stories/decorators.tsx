import type { Decorator } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
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

/** Signs in through the prompt that opened when saving signed out, then waits for it to close. In a story any code works. */
export async function signInFromPrompt(canvasElement: HTMLElement, why: string) {
  const canvas = within(canvasElement);
  const prompt = await canvas.findByRole('dialog', { name: `Sign in to ${why}` });
  await settled();
  await expect(within(prompt).getByLabelText('Email')).toHaveFocus();
  await userEvent.type(within(prompt).getByLabelText('Email'), 'jordan@example.com');
  await userEvent.click(within(prompt).getByRole('button', { name: 'Email me a code' }));
  await userEvent.type(await within(prompt).findByLabelText('Code'), '123456');
  await userEvent.click(within(prompt).getByRole('button', { name: 'Sign in' }));
  await expect(canvas.queryByRole('dialog', { name: `Sign in to ${why}` })).toBeNull();
}
