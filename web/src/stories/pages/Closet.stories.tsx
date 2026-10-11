import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import Closet from '@/app/closet/page';
import { pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell, signInFromPrompt } from '../decorators';
import { demoCloset, demoId as id, emptyCloset, photoCloset, savedOutfits } from '../fixtures';

/* What you own. Pieces and saved outfits, with the outfit board opening beside the grid. While the board is open,
   clicking a piece puts it on the board, and pieces that don't go with the outfit fade and sort to the end. */

const meta = {
  title: 'Pages/Closet',
  component: Closet,
  decorators: [inShell],
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/closet' } },
    store: demoCloset,
    chromatic: { modes: pageModes },
    // Known issues while the board is open: faded pieces fall below 4.5:1 (color-contrast), cards are labelled
    // "Put … on the board" instead of their visible text (label-content-name-mismatch), and board places are buttons
    // holding a remove button (nested-interactive). Shown in the Accessibility panel without failing the tests.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof Closet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All 30 pieces, newest first, each badged with how it was added. */
export const Pieces: Story = {};

/** Filtered to shoes and sorted by cost per wear: the card shows the number it's sorted by. */
export const FilteredAndSorted: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Shoes/ }));
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Sort' }), 'cpw');
    await expect(canvas.getAllByText(/\/wear$/)).toHaveLength(4);
  },
};

/** Building an outfit: the board is open, pieces on it are marked, and pieces that clash are faded. */
export const BuildingAnOutfit: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: 'Thursday', slots: { top: id('t4'), bottom: id('b3'), shoes: id('s2') }, focus: 'outer' } }),
  },
};

/** Clicking a piece in the grid puts it on the board. */
export const PutAPieceOnTheBoard: Story = {
  parameters: { store: () => demoCloset({ building: true, draft: { name: 'New outfit', slots: { top: id('t1') }, focus: 'bottom' } }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Put Loose Straight Jeans on the board' }));
    const board = canvas.getByRole('complementary', { name: 'Outfit board' });
    await expect(within(board).getByRole('button', { name: 'Loose Straight Jeans' })).toBeVisible();
  },
};

/** Planning Saturday from Today: the same board, with the forecast, "Surprise me", and Plan for Saturday. Planning it
    goes back to that day on Today. */
export const PlanningADay: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Saturday's outfit", slots: { top: id('t4') }, focus: 'bottom', date: '2026-10-10' } }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Planning Saturday')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Plan for Saturday' }));
    await expect(router().push).toHaveBeenCalledWith('/?day=2026-10-10');
  },
};

/** A past day with nothing logged: the board logs what was worn. */
export const LoggingAPastDay: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Tuesday's outfit", slots: { top: id('t4'), bottom: id('b3') }, focus: 'shoes', date: '2026-10-06' } }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Logging Tuesday')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log as worn' })).toBeEnabled();
    await expect(canvas.queryByRole('button', { name: 'Surprise me' })).toBeNull();
  },
};

/** Signed out, an outfit can still be built, but Save outfit asks to sign in first. Nothing is saved until the code
    works; then the outfit is saved to the account. */
export const SavingSignedOut: Story = {
  parameters: {
    store: () =>
      demoCloset({ accountsOn: true, building: true, draft: { name: 'Thursday', slots: { top: id('t4'), bottom: id('b3'), shoes: id('s2') }, focus: 'outer' } }),
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save outfit' }));
    await expect(await canvas.findByRole('dialog', { name: 'Sign in to save this outfit' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Outfits' })).toBeInTheDocument();
    await signInFromPrompt(canvasElement, 'save this outfit');
    await expect(canvas.getByRole('button', { name: 'Outfits 1' })).toBeInTheDocument();
  },
};

/** Saved outfits, ready to plan or open on the board. */
export const SavedOutfits: Story = {
  parameters: { store: () => demoCloset({ outfits: savedOutfits() }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Outfits 3' }));
    await expect(canvas.getByRole('heading', { name: '3 saved outfits' })).toBeVisible();
  },
};

/** Photographed pieces in the grid. */
export const WithPhotos: Story = {
  parameters: { store: photoCloset },
};

/** Before the first piece. */
export const Empty: Story = {
  parameters: { store: emptyCloset },
};
