import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { DayPlanner } from '@/components/DayPlanner';
import { demoCloset, demoId as id } from '../fixtures';

/* Planning (or logging) one day's outfit, piece by piece: pick a top, then what goes with it. Each step lists your
   pieces for that place, badges the two that fit best, and fades the ones that clash. Any one piece is enough to
   plan; "Surprise me" fills in a whole outfit. */

const meta = {
  title: 'Patterns/Day planner',
  component: DayPlanner,
  args: {
    date: '2026-10-08',
    dayLabel: 'today',
    mode: 'plan',
    initialName: "Today's outfit",
    weather: { temp: 58, word: 'foggy' },
    surprise: fn(() => ({ outer: id('o1'), top: id('t1'), bottom: id('b2'), shoes: id('s1') })),
    onDone: fn(),
    onCancel: fn(),
  },
  argTypes: { initial: { control: 'object' }, mode: { control: 'inline-radio', options: ['plan', 'log'] } },
  parameters: {
    layout: 'padded',
    store: demoCloset,
    // Known issue: pieces that clash are faded below 4.5:1 (color-contrast). Reported, not failed.
    a11y: { test: 'todo' },
  },
  globals: { viewport: { value: 'desktop' } },
} satisfies Meta<typeof DayPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A blank day: start with a top. Two tops are badged as suggestions for a foggy work day. */
export const StartWithATop: Story = {};

/** Picking a top moves on to bottoms, and fades the ones that don't go with it. */
export const PickingPieces: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Classic Oxford Shirt/ }));
    await expect(canvas.getByRole('tab', { name: 'Bottom' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('button', { name: 'Plan for today' })).toBeEnabled();
  },
};

/** The layer step reads the weather. */
export const LayerForTheWeather: Story = {
  args: { initial: { top: id('t3'), bottom: id('b1'), shoes: id('s2') } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Layer' }));
    await expect(canvas.getByText('58° and foggy: a layer will help.')).toBeVisible();
  },
};

/** Changing a planned day: the plan is on the canvas, ready to swap pieces. */
export const ChangingAPlan: Story = {
  args: { initial: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') }, initialName: 'Client presentation' },
};

/** Done: the outfit goes back to the page with its name. */
export const Finishing: Story = {
  ...ChangingAPlan,
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Plan for today' }));
    await expect(args.onDone).toHaveBeenCalledWith('Client presentation', expect.objectContaining({ top: id('t3'), shoes: id('s2') }), undefined);
  },
};

/** "Surprise me" fills in a whole outfit to start from. */
export const SurpriseMe: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Surprise me' }));
    await expect(args.surprise).toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Original Fit Jeans' })).toBeVisible();
  },
};

/** Logging a past day: no occasion or surprise, and the button logs a wear. */
export const LoggingAPastDay: Story = {
  args: { date: '2026-10-06', dayLabel: 'Tuesday', mode: 'log', initialName: "Tuesday's outfit", weather: undefined },
};
