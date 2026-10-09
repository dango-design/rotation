import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { OutfitPanel } from '@/components/OutfitPanel';
import type { Draft, Fixture } from '@/lib/store';
import { modes } from '../../../.storybook/modes';
import { demoCloset, demoId as id } from '../fixtures';

/* The outfit board beside the closet. The closet grid is the tray: clicking or dragging a piece there puts it on the
   canvas. Any piece you own can be saved, worn or planned; the check below the canvas says whether the pieces work
   together, and a piece you'd still have to buy holds the outfit back. Pieces to shop sit at the bottom. */

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
    // Known issues: a suggested piece on the canvas is a button holding its Compare button (nested-interactive) and is
    // named differently from its visible tag (label-content-name-mismatch); the empty-canvas hint is --ink-3 on --tile,
    // 4.35:1 (color-contrast). Reported, not failed.
    a11y: { test: 'todo' },
  },
  // The side-panel layout; narrower windows get the bottom sheet (see AsBottomSheet).
  globals: { viewport: { value: 'desktop' } },
} satisfies Meta<typeof OutfitPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new outfit: an empty canvas, and nothing to save yet. */
export const Empty: Story = {
  parameters: { store: board({ name: 'New outfit', slots: {}, focus: 'top' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Your picks show up here')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeDisabled();
  },
};

/** A complete outfit that works, at true-to-life sizes. */
export const Complete: Story = {
  parameters: { store: board({ name: 'Client presentation', slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') }, focus: 'bottom' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('These work together')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeEnabled();
  },
};

/** Selecting a piece shows its tools; removing the shoes leaves an outfit that can still be saved, just not a complete one. */
export const RemovingAPiece: Story = {
  ...Complete,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Chelsea Boots' }));
    await expect(args.onFocus).toHaveBeenCalledWith('shoes');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove from outfit' }));
    await expect(canvas.queryByRole('button', { name: 'Chelsea Boots' })).toBeNull();
    await expect(canvas.queryByText('These work together')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeEnabled();
  },
};

/** Two colors that compete: the check says why. It's a hint; the outfit can still be worn. */
export const Clash: Story = {
  parameters: { store: board({ name: 'Weekend', slots: { top: id('t9'), bottom: id('b2'), shoes: id('s1'), acc: id('a2') }, focus: 'acc' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Burgundy and Rust compete for attention')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Wear today' })).toBeEnabled();
  },
};

/** A suggested piece on the canvas, outlined in gap blue with its price. An outfit with something to buy can't be saved yet. */
export const WithSuggestedPiece: Story = {
  parameters: { store: board({ name: 'Trying the light straight chinos', slots: { outer: id('o1'), top: id('t3'), bottom: 'p-chino-khaki', shoes: id('s3') }, focus: 'bottom' }) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Not in your closet/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save outfit' })).toBeDisabled();
  },
};

/** A dress covers the bottom. */
export const Dress: Story = {
  parameters: { store: board({ name: 'Gallery opening', slots: { outer: id('o4'), top: id('d3'), shoes: id('s3') }, focus: 'bottom' }) },
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
