import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import Today from '@/app/page';
import { pageModes } from '../../../.storybook/modes';
import { router } from '../../../.storybook/router';
import { inShell, settled, signInFromPrompt } from '../decorators';
import { demoCloset, demoId as id, emptyCloset, oneTee, openToday, savedOutfits } from '../fixtures';

/* Getting dressed. The week strip picks a day; a planned day shows its outfit, and a day with nothing planned asks for
   one, built right on Today: your pieces on one side, the outfit board on the other, as in the closet. Stories run on
   Thursday, October 8, 2026 at 9am, so the strip has worn, empty and planned days. */

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

/** Planning today stays on Today: your pieces beside the outfit board, set to plan today. */
export const PlanningToday: Story = {
  parameters: { store: openToday },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "Plan today's outfit" }));
    await expect(canvas.getByText('Planning today')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: "Put '90s Loose Jeans on the board" }));
    const board = canvas.getByRole('complementary', { name: 'Outfit board' });
    await expect(within(board).getByRole('button', { name: "'90s Loose Jeans" })).toBeVisible();
    await expect(router().push).not.toHaveBeenCalled();
  },
};

/** "Change" opens the planned outfit on the board, on Today. A behavior test only. */
export const ChangingAPlan: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change' }));
    await expect(canvas.getByText('Planning today')).toBeVisible();
    await expect(router().push).not.toHaveBeenCalled();
  },
};

/** Saturday is half planned while Thursday is shown: a bar keeps it from being forgotten, and Back to the board picks it
    up with the forecast, Surprise me, and Plan for Saturday. Planning it shows Saturday's outfit, still on Today. */
export const PlanningADay: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Saturday's outfit", slots: { top: id('t4') }, focus: 'bottom', date: '2026-10-10' } }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1 piece on the outfit board, not planned yet.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the board' }));
    await expect(canvas.getByText('Planning Saturday')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Plan for Saturday' }));
    await expect(canvas.getByText('Planned for Saturday, Oct 10')).toBeVisible();
    await expect(router().push).not.toHaveBeenCalled();
  },
};

/** Planning a day with no city set and no top, bottom and shoes that go together: the board asks for a city, and
    Surprise me says what it needs instead of hiding. */
export const PlanningWithoutACity: Story = {
  parameters: {
    store: () =>
      demoCloset({
        items: demoCloset().items!.filter((i) => i.cat !== 'shoes'),
        weather: null,
        settings: { ...demoCloset().settings, city: '' },
        building: true,
        draft: { name: "Saturday's outfit", slots: {}, focus: 'top', date: '2026-10-10' },
      }),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the board' }));
    const board = canvas.getByRole('complementary', { name: 'Outfit board' });
    await expect(within(board).getByRole('link', { name: 'Add your city' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Surprise me' }));
    await expect(canvas.getByRole('status')).toHaveTextContent(/Surprise me needs a top, bottom and shoes/);
  },
};

/** A past day on the board: it logs what was worn. */
export const LoggingAPastDay: Story = {
  parameters: {
    store: () => demoCloset({ building: true, draft: { name: "Tuesday's outfit", slots: { top: id('t4'), bottom: id('b3') }, focus: 'shoes', date: '2026-10-06' } }),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the board' }));
    await expect(canvas.getByText('Logging Tuesday')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log as worn' })).toBeEnabled();
    await expect(canvas.queryByRole('button', { name: 'Surprise me' })).toBeNull();
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
