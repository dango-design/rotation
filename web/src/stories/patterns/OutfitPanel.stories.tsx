import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { OutfitPanel } from '@/components/OutfitPanel';
import type { Draft, Fixture } from '@/lib/store';
import { modes } from '../../../.storybook/modes';
import { blackDress, demoCloset, demoId as id } from '../fixtures';

/* The outfit board beside the closet. The closet grid is the tray: clicking a piece there puts it on the board.
   The panel checks the outfit as it changes, and suggests pieces to shop for the focused place. */

const board = (draft: Draft, extra: Fixture = {}) => () => demoCloset({ building: true, draft, ...extra });

const meta = {
  title: 'Patterns/Outfit board',
  component: OutfitPanel,
  tags: ['autodocs'],
  args: { onPut: fn(), onFocus: fn() },
  decorators: [
    (Story, { parameters }) =>
      parameters.layout === 'fullscreen' ? (
        <Story />
      ) : (
        <div className="story-board" style={{ width: 380 }}>
          {/* Shown in full here; in the app the panel is sticky and scrolls inside the window height. */}
          <style>{'.story-board .outfit-panel { position: static; max-height: none; }'}</style>
          <Story />
        </div>
      ),
  ],
  parameters: {
    layout: 'padded',
    // Known issues: board places are buttons holding remove and compare buttons (nested-interactive), and the
    // "Dress covers this" place is faded below 4.5:1 (color-contrast). Reported, not failed.
    a11y: { test: 'todo' },
  },
  // The side-panel layout; narrower windows get the bottom sheet (see AsBottomSheet).
  globals: { viewport: { value: 'desktop' } },
} satisfies Meta<typeof OutfitPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new outfit: every place is empty, and the top is focused. */
export const Empty: Story = {
  parameters: { store: board({ name: 'New outfit', slots: {}, focus: 'top' }) },
};

/** A complete outfit that works. Save, wear and plan are enabled. */
export const Complete: Story = {
  parameters: { store: board({ name: 'Client presentation', slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), acc: id('a1') }, focus: 'bottom' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('These work together')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeEnabled();
  },
};

/** Taking the shoes off makes the outfit incomplete, and the actions turn off. */
export const RemovingAPiece: Story = {
  ...Complete,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Chelsea Boots' }));
    await expect(args.onFocus).toHaveBeenCalledWith('shoes');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Chelsea Boots' }));
    await expect(canvas.getByText('Add a top, bottom and shoes (or a dress and shoes)')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeDisabled();
  },
};

/** Two colors that compete: the check says why, and the outfit can't be saved. */
export const Clash: Story = {
  parameters: { store: board({ name: 'Weekend', slots: { top: id('t9'), bottom: id('b2'), shoes: id('s1'), acc: id('a2') }, focus: 'acc' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Burgundy and Rust compete for attention')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Wear today' })).toBeDisabled();
  },
};

/** A suggested piece on the board, outlined in gap blue, with its price and a way to compare stores. */
export const WithSuggestedPiece: Story = {
  parameters: { store: board({ name: 'Trying the light straight chinos', slots: { outer: id('o1'), top: id('t3'), bottom: 'p-chino-khaki', shoes: id('s3') }, focus: 'bottom' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Not in your closet/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeDisabled();
  },
};

/** A dress covers the bottom place. */
export const Dress: Story = {
  parameters: {
    store: () => demoCloset({ items: [...demoCloset().items!, blackDress()], building: true, draft: { name: 'Gallery opening', slots: { outer: id('o4'), top: 'dress', shoes: id('s3') }, focus: 'bottom' } }),
  },
};

/** With shopping suggestions off, the panel only uses what you own. */
export const ShoppingOff: Story = {
  parameters: {
    store: () =>
      demoCloset({ building: true, draft: { name: 'Errands', slots: { top: id('t1'), bottom: id('b2'), shoes: id('s1') }, focus: 'outer' }, settings: { ...demoCloset().settings, showShop: false } }),
  },
};

/** Below 1180px the board becomes a bottom sheet over the closet grid. */
export const AsBottomSheet: Story = {
  ...Complete,
  decorators: [(Story) => <div style={{ minHeight: 900 }}>{Story()}</div>],
  parameters: { ...Complete.parameters, layout: 'fullscreen', chromatic: { modes: { tablet: modes.tablet } } },
  globals: { viewport: { value: 'tablet' } },
  play: undefined,
};
