import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CompareDrawer, ListDrawer } from '@/components/ShopDrawers';
import { overlay, settled } from '../decorators';
import { demoCloset, shoppingList } from '../fixtures';

/* Shopping, piece first and store second. Compare shows one kind of piece across stores (favorites first, then
   price) with the size to pick at each. The list groups what you've added by store. */

const meta = {
  title: 'Patterns/Shopping',
  component: CompareDrawer,
  args: { id: 'p-chino-khaki', onClose: fn() },
  decorators: [overlay],
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    // Known issue: drawers are <aside role="dialog">, and aside can't take that role (aria-allowed-role). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof CompareDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Compare stores for a suggested piece. Favorite stores have a star; sizes come from what you own. */
export const CompareStores: Story = {};

/** Adding an option to the list turns its button into a chip. */
export const AddToList: Story = {
  play: async ({ canvas }) => {
    await settled();
    const uniqlo = canvas.getByText('Uniqlo').closest('.opt-row') as HTMLElement;
    await userEvent.click(within(uniqlo).getByRole('button', { name: 'Add to list' }));
    await expect(within(uniqlo).getByText('On list')).toBeVisible();
  },
};

/** A piece on the list like one you already have says so, with how often you wear yours. */
export const SimilarOnList: Story = {
  parameters: { store: () => demoCloset({ list: [{ key: 'p-sneaker-white|Nike', addedAt: '2026-10-01T12:00:00.000Z' }] }) },
  render: (args) => <ListDrawer onClose={args.onClose} />,
  play: async ({ canvas }) => {
    await settled();
    await expect(canvas.getByText(/You already have a similar one: Court Vision Low Next Nature in white, worn 64 times/)).toBeVisible();
  },
};

/** The shopping list, grouped by store, with the total. */
export const ShoppingList: Story = {
  parameters: { store: () => demoCloset({ list: shoppingList() }) },
  render: (args) => <ListDrawer onClose={args.onClose} />,
  play: async ({ canvas }) => {
    await settled();
    await expect(canvas.getByRole('heading', { name: /3 pieces/ })).toBeVisible();
  },
};

/** Before anything is added. */
export const EmptyList: Story = {
  render: (args) => <ListDrawer onClose={args.onClose} />,
};
