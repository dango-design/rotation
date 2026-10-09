import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import Fill from '@/app/fill/page';
import { modes, pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell } from '../decorators';
import { demoCloset, oneTee } from '../fixtures';

/* What's missing. The pieces that would add the most new outfits with what you own, each with store options and
   previews of the outfits it unlocks; then what wasn't recommended, and why. Piece first, store second. */

const meta = {
  title: 'Pages/Fill the gap',
  component: Fill,
  decorators: [inShell],
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/fill' } },
    store: demoCloset,
    // The pick cards change layout at 1320px too, so this page also gets a laptop snapshot.
    chromatic: { modes: { ...pageModes, laptop: modes.laptop } },
    // Known issue: section titles are h3 straight after the page's h1 (heading-order). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof Fill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Modes merge with the page's, so a story turns one off rather than listing fewer. */
const noLaptop = { laptop: { disable: true } };

/** The top three picks for Jordan's closet. */
export const Picks: Story = {};

/** "Try with my closet" opens the piece on the board, styled with what you own. */
export const TryWithMyCloset: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: 'Try with my closet' })[0]);
    await expect(router().push).toHaveBeenCalledWith('/closet');
  },
};

/** Shopping off: the page says so and offers to turn it back on. */
export const ShoppingOff: Story = {
  parameters: { store: () => demoCloset({ settings: { ...demoCloset().settings, showShop: false } }), chromatic: { modes: noLaptop } },
};

/** Too little to pair with, so nothing to suggest. */
export const NothingToSuggest: Story = {
  parameters: { store: oneTee, chromatic: { modes: noLaptop } },
};
