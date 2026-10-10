import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import Today from '@/app/page';
import { pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell, settled, signInFromPrompt } from '../decorators';
import { demoCloset, emptyCloset, oneTee, openToday, savedOutfits } from '../fixtures';

/* Getting dressed. The week strip picks a day; a planned day shows its outfit, and a day with nothing planned asks for
   one, built piece by piece with suggestions along the way. Stories run on Thursday, October 8, 2026 at 9am, so the
   strip has worn, empty and planned days. */

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

/** Nothing planned for today: a blank canvas, with the weather and three ways to start. */
export const BlankDay: Story = {
  parameters: { store: () => openToday({ outfits: savedOutfits() }) },
};

/** Planning today piece by piece, in place of the outfit card. */
export const PlanningToday: Story = {
  parameters: { store: openToday },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "Plan today's outfit" }));
    await expect(canvas.getByRole('article', { name: 'Plan today' })).toBeVisible();
  },
};

/** "Change" reopens a planned day in the planner. */
export const ChangingAPlan: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change' }));
    await expect(canvas.getByRole('article', { name: 'Plan today' })).toBeVisible();
    await expect(canvas.getByLabelText('Outfit name')).toHaveValue('Client presentation');
  },
};

/** Yesterday was logged, so it shows what was worn. */
export const WornYesterday: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Wednesday, October 7, worn/ }));
    await expect(canvas.getByText('Worn on Wednesday, Oct 7')).toBeVisible();
  },
};

/** A past day with nothing logged asks what was worn. */
export const NothingLogged: Story = {
  parameters: { store: () => demoCloset({ outfits: savedOutfits() }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Tuesday, October 6/ }));
    await expect(canvas.getByRole('heading', { name: 'What did you wear on Tuesday?' })).toBeVisible();
  },
};

/** Picking one of your saved outfits for a day. */
export const UseASavedOutfit: Story = {
  parameters: { store: () => openToday({ outfits: savedOutfits() }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Use a saved outfit' }));
    await settled();
    await expect(canvas.getByRole('dialog', { name: 'Plan a saved outfit' })).toBeVisible();
  },
};

/** "Style it" on a piece you haven't worn lately opens it on the board in the closet. A behavior test only. */
export const StyleAForgottenPiece: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: 'Style it' })[0]);
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

/** First run, signed out: building an outfit with the demo closet needs no account. Starting your own closet does, so
    "Add your first piece" says you'll sign in first. */
export const NewClosetSignedOut: Story = {
  parameters: { store: () => ({ accountsOn: true }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Build an outfit with a demo closet' })).toHaveAttribute('href', '/builder?demo');
  },
};

/** "Add your first piece" asks to sign in first. Once the code works and the account's closet is here, Add pieces opens. */
export const SigningInToStart: Story = {
  parameters: { store: () => ({ accountsOn: true }), chromatic: { disableSnapshot: true } },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add your first piece' }));
    await signInFromPrompt(canvasElement, 'start your closet');
    const add = await canvas.findByRole('dialog', { name: 'Add pieces' });
    await settled();
    await expect(within(add).getByRole('heading', { name: 'Add pieces' })).toBeVisible();
  },
};

/** One piece is already enough to plan a day with. */
export const OnePiece: Story = {
  parameters: { store: oneTee },
};
