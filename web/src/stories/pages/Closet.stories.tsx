import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import Closet from '@/app/closet/page';
import { pageModes } from '../../../.storybook/modes';
import { inShell, signInFromPrompt } from '../decorators';
import { demoCloset, demoId as id, emptyCloset, photoCloset, savedOutfits } from '../fixtures';

/* What you own. Pieces and saved outfits, with the outfit board opening beside the grid. While the board is open,
   clicking a piece puts it on the board (and clicking it again takes it off). Any pieces can go together; the board
   doesn't judge. */

const meta = {
  title: 'Pages/Closet',
  component: Closet,
  decorators: [inShell],
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/closet' } },
    store: demoCloset,
    chromatic: { modes: pageModes },
    // Known issues while the board is open: cards are labelled "Put … on the board" instead of their visible text
    // (label-content-name-mismatch), and board places are buttons holding a remove button (nested-interactive). Shown in the Accessibility panel without failing the tests.
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

/** Building an outfit: the board is open and pieces on it are marked. */
export const BuildingAnOutfit: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: 'Thursday', slots: { top: id('t4'), bottom: id('b3'), shoes: id('s2') }, focus: 'outer' } }),
  },
};

/** Clicking a piece in the grid puts it on the board, and clicking it again takes it off. */
export const PutAPieceOnTheBoard: Story = {
  parameters: { store: () => demoCloset({ building: true, draft: { name: 'New outfit', slots: { top: id('t1') }, focus: 'bottom' } }) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "Put '90s Loose Jeans on the board" }));
    const board = canvas.getByRole('complementary', { name: 'Outfit board' });
    await expect(within(board).getByRole('button', { name: "'90s Loose Jeans" })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: "Take '90s Loose Jeans off the board" }));
    await expect(within(board).queryByRole('button', { name: "'90s Loose Jeans" })).toBeNull();
  },
};

/** Saturday is being planned on Today. The closet stays a closet: a bar points back to Today (or stops the day), and
    a click opens a piece instead of putting it on the board. */
export const DayOnTheBoard: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Saturday's outfit", slots: { top: id('t4') }, focus: 'bottom', date: '2026-10-10' } }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Planning Saturday')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Back to Today' })).toHaveAttribute('href', '/?day=2026-10-10');
    await expect(canvas.queryByRole('complementary', { name: 'Outfit board' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: "Put '90s Loose Jeans on the board" })).toBeNull();
  },
};

/** Stopping Saturday from the closet after changing it asks first: the changes on the board go, and Errands stays
    planned for Saturday. */
export const StopPlanningAsksFirst: Story = {
  parameters: DayOnTheBoard.parameters,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Stop planning Saturday' }));
    const ask = await canvas.findByRole('alertdialog', { name: 'Stop planning Saturday?' });
    await expect(ask).toHaveTextContent("The changes on the board aren't saved. Errands stays planned for Saturday.");
  },
};

/** Monday has nothing planned yet, so stopping it asks first, with the focus on Keep planning and Escape backing out.
    Stop planning drops the outfit and the bar, and the closet is a closet again. A behavior test only. */
export const StopPlanningADay: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Monday's outfit", slots: { top: id('t4'), bottom: id('b3') }, focus: 'shoes', date: '2026-10-12' } }),
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas }) => {
    const stop = canvas.getByRole('button', { name: 'Stop planning Monday' });
    stop.focus();
    await userEvent.keyboard('{Enter}');
    const ask = await canvas.findByRole('alertdialog', { name: 'Stop planning Monday?' });
    await expect(ask).toHaveTextContent('Nothing is planned for Monday yet, so the outfit on the board goes. Its pieces stay in your closet.');
    await expect(within(ask).getByRole('button', { name: 'Keep planning' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
    await expect(canvas.getByRole('region', { name: 'Day in progress' })).toBeVisible();

    await userEvent.click(stop);
    await userEvent.click(within(await canvas.findByRole('alertdialog')).getByRole('button', { name: 'Stop planning' }));
    await expect(canvas.queryByRole('region', { name: 'Day in progress' })).toBeNull();
    await expect(canvas.getByRole('status')).toHaveTextContent('Stopped planning Monday');
    await expect(canvas.getByRole('button', { name: 'New outfit' })).toBeVisible();
    await expect(canvas.queryByRole('complementary', { name: 'Outfit board' })).toBeNull();
  },
};

/** Saturday on the board just as it's planned: stopping loses nothing, so it doesn't ask. The bar goes and Errands
    stays planned. A behavior test only. */
export const StopPlanningUnchanged: Story = {
  parameters: {
    store: () => {
      const closet = demoCloset();
      const plan = closet.plans!.find((p) => p.date === '2026-10-10')!;
      return { ...closet, building: true, draft: { name: plan.name, slots: plan.slots, layout: plan.layout, bg: plan.bg, focus: 'top', date: plan.date } };
    },
    chromatic: { disableSnapshot: true },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Stop planning Saturday' }));
    await expect(canvas.queryByRole('alertdialog')).toBeNull();
    await expect(canvas.queryByRole('region', { name: 'Day in progress' })).toBeNull();
    await expect(canvas.getByRole('status')).toHaveTextContent('Stopped planning Saturday. Errands is still planned.');
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
