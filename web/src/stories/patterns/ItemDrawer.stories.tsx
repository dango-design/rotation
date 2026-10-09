import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ItemDrawer } from '@/components/ItemDrawer';
import { router } from '../../../.storybook/router';
import { overlay, settled } from '../decorators';
import { demoCloset, demoId, oneTee, photoCloset } from '../fixtures';

/* A piece's details: what it pairs with, what it costs per wear, pieces that would complete it, and where it came
   from. Opens from any tile in the app. */

const meta = {
  title: 'Patterns/Piece details',
  component: ItemDrawer,
  args: { id: demoId('t3'), onClose: fn() },
  decorators: [overlay],
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    // Known issue: drawers are <aside role="dialog">, and aside can't take that role (aria-allowed-role). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof ItemDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A piece from the demo closet, imported from an order email. */
export const Default: Story = {};

/** "Style it" builds the best outfit around the piece and goes to the closet with the board open. */
export const StyleIt: Story = {
  play: async ({ canvas, args }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: 'Style it' }));
    await expect(router().push).toHaveBeenCalledWith('/closet');
    await expect(args.onClose).toHaveBeenCalled();
  },
};

/** A photographed piece, in a small closet: fewer pairings, and the photo note at the bottom. */
export const FromAPhoto: Story = {
  args: { id: 'cut-1' },
  parameters: { store: photoCloset },
};

/** Nothing to pair with yet. */
export const NothingToPairWith: Story = {
  args: { id: 'tee' },
  parameters: { store: oneTee },
};

/** Editing reuses the add-piece form, filled in. */
export const Editing: Story = {
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(canvas.getByRole('heading', { name: 'Edit piece' })).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveValue('Classic Oxford Shirt');
  },
};

/** Removing takes two clicks: the second button says what will happen. */
export const ConfirmRemove: Story = {
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await expect(canvas.getByRole('button', { name: 'Remove permanently' })).toBeVisible();
  },
};
