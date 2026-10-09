import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import Today from '@/app/page';
import { pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell, settled } from '../decorators';
import { demoCloset, emptyCloset, oneTee, savedOutfits } from '../fixtures';

/* Getting dressed. The week strip picks a day; the card shows what was worn, what is planned, or a suggestion with
   the reasons for it. Stories run on Thursday, October 8, 2026 at 9am, so the strip has worn, empty and planned days. */

const meta = {
  title: 'Pages/Today',
  component: Today,
  decorators: [inShell],
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/' } },
    store: demoCloset,
    chromatic: { modes: pageModes },
    // Known issue: week-strip days are labelled "Thursday, October 8, …" but show "Today 8" (label-content-name-mismatch).
    // Shown in the Accessibility panel without failing the tests until it's fixed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof Today>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Jordan's closet: today's planned outfit, the week, the forecast, and the piece that would unlock the most outfits. */
export const Planned: Story = {};

/** "Suggest instead" swaps the plan for a suggestion and explains it: the occasion, the weather, what hasn't been worn lately. */
export const Suggestion: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Suggest instead' }));
    await expect(canvas.getByText("Today's outfit")).toBeVisible();
  },
};

/** Yesterday was logged, so it shows what was worn. */
export const WornYesterday: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Wednesday, October 7, worn/ }));
    await expect(canvas.getByText('Worn on Wednesday, Oct 7')).toBeVisible();
  },
};

/** A past day with nothing logged offers to log a saved outfit. */
export const NothingLogged: Story = {
  parameters: { store: () => demoCloset({ outfits: savedOutfits() }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Tuesday, October 6/ }));
    await expect(canvas.getByRole('heading', { name: 'Nothing logged' })).toBeVisible();
  },
};

/** Picking a saved outfit or a suggestion for a day. */
export const PickASavedOutfit: Story = {
  parameters: { store: () => demoCloset({ outfits: savedOutfits() }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Saved outfits' }));
    await settled();
    await expect(canvas.getByRole('dialog', { name: 'Plan an outfit' })).toBeVisible();
  },
};

/** The pencil opens the outfit on the board in the closet. A behavior test only; it looks like Planned. */
export const ChangeOnTheBoard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change it on the outfit board' }));
    await expect(router().push).toHaveBeenCalledWith('/closet');
  },
};

/** Without a city there is no forecast, and the page asks for one. */
export const NoWeather: Story = {
  parameters: { store: () => demoCloset({ weather: null, settings: { city: '', favoriteStores: ['Gap', "Levi's", 'Uniqlo'] } }) },
};

/** With shopping off, the outfit takes the full width and nothing is for sale. */
export const ShoppingOff: Story = {
  parameters: { store: () => demoCloset({ settings: { ...demoCloset().settings, showShop: false } }) },
};

/** In the evening the greeting changes. */
export const Evening: Story = {
  parameters: { now: '2026-10-08T19:30:00' },
};

/** First run: what Rotation does and how to start, or a demo to look around. */
export const NewCloset: Story = {
  parameters: { store: emptyCloset },
};

/** Not enough for an outfit yet: says what's missing. */
export const AlmostThere: Story = {
  parameters: { store: oneTee },
};
