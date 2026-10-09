import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { OutfitBoard } from '@/components/OutfitBoard';
import type { Layout, OutfitSlots, Slot } from '@/lib/types';
import { settled } from '../decorators';
import { demoCloset, demoId as id } from '../fixtures';

/* The outfit canvas, shared by the day planner and the outfit board. It works like a design canvas: pieces start at
   true-to-life sizes (jeans come out taller than a tee, earrings small), and can be dragged, resized from a corner,
   and brought forward or sent back. Keyboard: arrows nudge, ] and [ restack, Delete removes, Escape deselects.
   Here the canvas keeps its own state, so every change sticks. */

function Canvas({ slots: initialSlots, layout: initialLayout, onLayout, onRemove }: { slots: OutfitSlots; layout?: Layout; onLayout: (l?: Layout) => void; onRemove: (s: Slot) => void }) {
  const [slots, setSlots] = useState(initialSlots);
  const [layout, setLayout] = useState(initialLayout);
  return (
    <div style={{ width: 380 }}>
      <OutfitBoard
        slots={slots}
        layout={layout}
        onLayout={(l) => (setLayout(l), onLayout(l))}
        onRemove={(s) => {
          const next = { ...slots };
          delete next[s];
          setSlots(next);
          onRemove(s);
        }}
      />
    </div>
  );
}

const outfit: OutfitSlots = { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') };

const meta = {
  title: 'Patterns/Outfit canvas',
  component: Canvas,
  args: { slots: outfit, onLayout: fn(), onRemove: fn() },
  argTypes: { slots: { control: 'object' }, layout: { control: 'object' } },
  parameters: {
    layout: 'padded',
    store: demoCloset,
    // Known issue: pieces are buttons that can hold the trial tag's Compare button (nested-interactive). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A fresh flat lay: every piece at its true size, in its usual spot. */
export const TrueToLifeSizes: Story = {};

/** Without a layer, the pieces spread out to use the space. */
export const WithoutALayer: Story = {
  args: { slots: { top: id('t1'), bottom: id('b2'), shoes: id('s1'), acc: id('a3') } },
};

/** A dress sits in the middle and needs no bottom. */
export const Dress: Story = {
  args: { slots: { outer: id('o1'), top: id('d1'), shoes: id('s4'), bag: id('a1') } },
};

/** Arranged by hand: the coat moved behind the shirt and made smaller, the bag brought to the front. Shown hovered,
    so "Tidy up" (back to true sizes) is visible. */
export const HandArranged: Story = {
  parameters: { pseudo: { hover: ['.canvas'] } },
  args: {
    layout: {
      outer: { id: id('o2'), x: 2, y: 2, w: 52, z: 0 },
      top: { id: id('t3'), x: 34, y: 4, w: 48, z: 1 },
      bottom: { id: id('b1'), x: 40, y: 36, w: 58, z: 2 },
      shoes: { id: id('s2'), x: 6, y: 66, w: 22, z: 3 },
      bag: { id: id('a1'), x: 4, y: 40, w: 32, z: 4 },
    },
  },
  play: async ({ canvas }) => {
    // An arranged outfit offers to go back to true sizes. The button fades in on hover or keyboard focus.
    await userEvent.tab();
    await expect(canvas.getByLabelText(/Outfit canvas/)).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Tidy up' })).toBeVisible());
  },
};

/** Selecting a piece shows its corner handles and tools: bring forward, send backward, true size, remove. */
export const Selected: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Classic Oxford Shirt' }));
    await settled();
    await expect(canvas.getByRole('button', { name: 'Classic Oxford Shirt' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Bring forward' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove from outfit' })).toBeVisible();
  },
};

/** Bringing a piece forward records the new stacking order. */
export const BringForward: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Classic Trench Coat' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Bring forward' }));
    await expect(args.onLayout).toHaveBeenCalledWith(expect.objectContaining({ outer: expect.objectContaining({ z: 1 }), top: expect.objectContaining({ z: 0 }) }));
  },
};

/** The keyboard works too: select a piece, then Delete removes it. */
export const DeleteWithKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Canvas Tote' }));
    await userEvent.keyboard('{Delete}');
    await expect(args.onRemove).toHaveBeenCalledWith('bag');
    await expect(canvas.queryByRole('button', { name: 'Canvas Tote' })).toBeNull();
  },
};

/** A suggested piece, outlined in gap blue with its price and a link to compare stores. */
export const WithSuggestedPiece: Story = {
  args: { slots: { outer: id('o1'), top: id('t3'), bottom: 'p-chino-khaki', shoes: id('s3') } },
};

/** Nothing on it yet. */
export const Empty: Story = {
  args: { slots: {} },
};
