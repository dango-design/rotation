import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import { Shell } from '@/components/Shell';
import { pageModes } from '../../../.storybook/modes';
import { settled } from '../decorators';
import { demoCloset, shoppingList } from '../fixtures';

/* The app frame around every page: three tabs (Today, Closet, Fill the gap), the "You" section, storage status,
   the add button, and the shopping bag. On phones the sidebar becomes a scrolling bar of tabs at the top. */

const Page = () => (
  <header className="page-head">
    <div>
      <div className="eyebrow">Page content</div>
      <h1>The page goes here</h1>
    </div>
  </header>
);

const meta = {
  title: 'Patterns/Navigation',
  component: Shell,
  args: { children: <Page /> },
  argTypes: { children: { control: false } },
  parameters: { layout: 'fullscreen', store: demoCloset },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On Today, with the closet count beside Closet. Snapshotted at every layout; the other stories at desktop only. */
export const Today: Story = {
  parameters: { chromatic: { modes: pageModes } },
};

/** The active tab follows the page. */
export const OnCloset: Story = {
  parameters: { nextjs: { navigation: { pathname: '/closet' } } },
};

/** In the "You" section. */
export const OnClosetReport: Story = {
  parameters: { nextjs: { navigation: { pathname: '/insights' } } },
};

/** The demo closet says so, everywhere, and links out to start a real one. */
export const DemoCloset: Story = {
  parameters: { store: () => demoCloset({ demo: true }) },
};

/** The bag shows how many pieces are on the shopping list, and opens it. */
export const WithShoppingList: Story = {
  parameters: {
    store: () => demoCloset({ list: shoppingList() }),
    // Known issue: drawers are <aside role="dialog">, and aside can't take that role (aria-allowed-role). Reported, not failed.
    a11y: { test: 'todo' },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Shopping list, 3 items' }));
    await settled();
    await expect(canvas.getByRole('dialog', { name: 'Shopping list' })).toBeVisible();
  },
};

/** "Add pieces" opens the add dialog over the page; Escape closes it. */
export const AddPieces: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add pieces' }));
    await settled();
    await expect(canvas.getByRole('dialog', { name: 'Add pieces' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Add pieces' })).toBeNull();
  },
};
