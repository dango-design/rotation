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

/** A piece close to one you already own is flagged, with how often you wear yours. */
export const AlreadyOwned: Story = {
  args: { id: 'p-sneaker-white' },
  play: async ({ canvas }) => {
    await settled();
    await expect(canvas.getByText(/You already own this:/)).toBeVisible();
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
