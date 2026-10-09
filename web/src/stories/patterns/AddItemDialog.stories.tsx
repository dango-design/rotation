import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, mocked, userEvent } from 'storybook/test';
import { AddItemDialog } from '@/components/AddItemDialog';
import { averageColor, removeBackground } from '@/lib/bgremove';
import { overlay, settled } from '../decorators';
import { demoCloset, photo, photoFile } from '../fixtures';

/* Adding a piece: by photo (background removed on the device), by product link, or by description. Order-email
   import is shown as coming soon. In Storybook the background remover and the server routes are stand-ins
   (see .storybook/preview.tsx and .storybook/api.ts), so every step can be reached without a model or network. */

const meta = {
  title: 'Patterns/Add pieces',
  component: AddItemDialog,
  args: { onClose: fn() },
  decorators: [overlay],
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    // Known issues: the faded "Order emails" option is below 4.5:1 (color-contrast), and photo alt text repeats the
    // button label (image-redundant-alt). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof AddItemDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first step: how to add it. Photo is recommended. */
export const Choose: Story = {};

/** Pasting a product link. */
export const ProductLink: Story = {
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: /Product link/ }));
    await expect(canvas.getByRole('heading', { name: 'Add from a product link' })).toBeVisible();
  },
};

/** A page that can't be read gives a reason and the other ways to add it. */
export const LinkCouldNotBeRead: Story = {
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: /Product link/ }));
    await userEvent.type(canvas.getByLabelText('Product link'), 'https://example.com/not-a-product');
    await userEvent.click(canvas.getByRole('button', { name: 'Read the page' }));
    await expect(await canvas.findByText(/You can still add it by photo or description/)).toBeVisible();
  },
};

/** A readable product page fills in the details for checking. */
export const LinkRead: Story = {
  parameters: {
    api: { 'POST /api/link': { body: { title: 'Linen Shirt', brand: 'Everlane', store: 'Everlane', price: 68, image: photo('linenshirt', '#E9E1CF', '#ffffff') } } },
  },
  beforeEach: () => {
    mocked(averageColor).mockResolvedValue([233, 225, 207]);
  },
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: /Product link/ }));
    await userEvent.type(canvas.getByLabelText('Product link'), 'https://www.everlane.com/products/linen-shirt');
    await userEvent.click(canvas.getByRole('button', { name: 'Read the page' }));
    await expect(await canvas.findByRole('heading', { name: 'Check the details' })).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveValue('Linen Shirt');
    await expect(canvas.getByLabelText('Price paid ($)')).toHaveValue(68);
  },
};

/** After a photo, the cutout and the original side by side, to keep whichever looks right. */
export const PhotoBackgroundRemoved: Story = {
  beforeEach: () => {
    mocked(removeBackground).mockResolvedValue({ blob: photoFile('cardigan', '#9AAB8E'), rgb: [154, 171, 142] });
  },
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const input = canvasElement.querySelector<HTMLInputElement>('input[type=file]')!;
    await userEvent.upload(input, photoFile('cardigan', '#9AAB8E', '#B9A88C'));
    await expect(await canvas.findByRole('heading', { name: 'Which looks right?' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Background removed' })).toBeVisible();
  },
};

/** Describing a piece skips straight to the form. */
export const Describe: Story = {
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('button', { name: /Describe it/ }));
    await expect(canvas.getByRole('heading', { name: 'Check the details' })).toBeVisible();
  },
};
