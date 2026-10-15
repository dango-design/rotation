import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import Fill from '@/app/fill/page';
import { modes, pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell } from '../decorators';
import { demoCloset, oneTee } from '../fixtures';

/* What's missing. The pieces that would add the most new outfits with what you own, each with previews of the outfits it
   unlocks and its best store option (the rest fold away); then what wasn't recommended, and why. Piece first, store second. */

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

/** Each pick shows its best store; the rest open in place, and the button keeps focus to close them again. */
export const MoreStores: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    const more = canvas.getByRole('button', { name: '2 more stores, from $59.95' });
    await userEvent.click(more);
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: 'Add to list · Straight Khakis from Gap' })).toBeVisible();
  },
};

/** An outfit preview opens that outfit on the board. */
export const TryAPreview: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: /^Try it with / })[0]);
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
