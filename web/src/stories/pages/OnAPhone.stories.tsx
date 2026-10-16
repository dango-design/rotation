import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import Closet from '@/app/closet/page';
import Fill from '@/app/fill/page';
import Today from '@/app/page';
import SettingsPage from '@/app/settings/page';
import { expectNoSidewaysScroll, inShell, settled } from '../decorators';
import { demoCloset, demoId as id } from '../fixtures';

/* On a 375px phone the page only scrolls up and down. Each story opens a page, or a drawer or dialog on it, and checks
   that nothing is wider than the screen and that no field or double tap zooms the page in. The pages' own stories are
   the snapshots; these are the guard. */

const meta = {
  title: 'Pages/On a phone',
  decorators: [inShell],
  globals: { viewport: { value: 'smallPhone' } },
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    chromatic: { disableSnapshot: true },
    // The pages' known issues (see their own stories) are reported there, not failed here.
    a11y: { test: 'todo' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Today, with the week strip scrolling inside its own row. */
export const TodayFits: Story = {
  render: () => <Today />,
  parameters: { nextjs: { navigation: { pathname: '/' } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Week' })).toBeVisible();
    await expectNoSidewaysScroll();
  },
};

/** Planning Saturday on Today: the outfit board is a sheet along the bottom. */
export const PlanningADayFits: Story = {
  render: () => <Today />,
  parameters: {
    nextjs: { navigation: { pathname: '/' } },
    store: () => demoCloset({ building: true, draft: { name: "Saturday's outfit", slots: { top: id('t4') }, focus: 'bottom', date: '2026-10-10' } }),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the board' }));
    await expect(canvas.getByText('Planning Saturday')).toBeVisible();
    await expectNoSidewaysScroll();
  },
};

/** The closet with the board open, its sort menu, and the board's date field. */
export const ClosetWithTheBoardFits: Story = {
  render: () => <Closet />,
  parameters: {
    nextjs: { navigation: { pathname: '/closet' } },
    store: () => demoCloset({ building: true, draft: { name: 'New outfit', slots: { top: id('t1'), bottom: id('b3') }, focus: 'shoes' } }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Sort' })).toBeVisible();
    await expect(canvas.getByLabelText('Plan date')).toBeInTheDocument();
    await expectNoSidewaysScroll();
  },
};

/** Fill the gap, with a pick's other stores open. */
export const FillTheGapFits: Story = {
  render: () => <Fill />,
  parameters: { nextjs: { navigation: { pathname: '/fill' } } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '2 more stores, from $59.95' }));
    await expectNoSidewaysScroll();
  },
};

/** Settings, with its city field. */
export const SettingsFits: Story = {
  render: () => <SettingsPage />,
  parameters: { nextjs: { navigation: { pathname: '/settings' } } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Off on this server/)).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'City' })).toBeVisible();
    await expectNoSidewaysScroll();
  },
};

/** Add pieces, pasting a product link. */
export const AddingALinkFits: Story = {
  render: () => <Closet />,
  parameters: { nextjs: { navigation: { pathname: '/closet' } } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add pieces' }));
    const dialog = await canvas.findByRole('dialog', { name: 'Add pieces' });
    await userEvent.click(within(dialog).getByRole('button', { name: /^Product link/ }));
    await settled();
    await expect(within(dialog).getByRole('textbox')).toBeVisible();
    await expectNoSidewaysScroll();
  },
};

/** A piece's drawer, editing it: name, type, color, price, size and date bought. */
export const EditingAPieceFits: Story = {
  render: () => <Closet />,
  parameters: { nextjs: { navigation: { pathname: '/closet' } } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: /'90s Loose Jeans/ })[0]);
    const drawer = await canvas.findByRole('dialog', { name: "'90s Loose Jeans" });
    await settled();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Edit' }));
    await settled();
    await expect(within(drawer).getByRole('heading', { name: 'Edit piece' })).toBeVisible();
    await expectNoSidewaysScroll();
  },
};
