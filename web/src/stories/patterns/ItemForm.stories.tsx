import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { ItemForm } from '@/components/ItemForm';
import { photo } from '../fixtures';

/* The details of a piece: used when adding one (by photo, link or description) and when editing. Type and color
   decide what it pairs with; price makes cost per wear work. The preview redraws as the type and color change. */

const meta = {
  title: 'Patterns/Piece form',
  component: ItemForm,
  tags: ['autodocs'],
  args: { initial: { source: 'manual' }, submitLabel: 'Add to closet', onSubmit: fn(), onCancel: fn() },
  decorators: [(Story) => <div style={{ maxWidth: 560 }}>{Story()}</div>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Describing a piece from scratch: the illustration stands in for a photo. */
export const Describe: Story = {};

/** After reading a product link: name, brand, price and the store's photo are filled in. */
export const FromALink: Story = {
  args: {
    initial: { source: 'link', name: 'Linen Shirt', brand: 'Everlane', price: 68, type: 'linenshirt', cat: 'top', colorName: 'Ecru', link: 'https://example.com/linen-shirt' },
    previewUrl: photo('linenshirt', '#E9E1CF', '#ffffff'),
  },
};

/** After a photo: Claude suggested the type, color and name, and says so. */
export const SuggestedFromAPhoto: Story = {
  args: {
    initial: { source: 'photo', name: 'Sage cardigan', type: 'cardigan', cat: 'top', colorName: 'Sage' },
    previewUrl: photo('cardigan', '#9AAB8E'),
    aiTagged: true,
  },
};

/** Filling in a pair of jeans: picking a category narrows the types, and an empty name is written from color and type. */
export const FillingItIn: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bottoms' }));
    await expect(canvas.getByLabelText('Type')).toHaveValue('jeans');
    await userEvent.click(canvas.getByRole('button', { name: 'Mid Wash' }));
    await userEvent.type(canvas.getByLabelText('Brand'), "Levi's");
    await userEvent.type(canvas.getByLabelText('Price paid ($)'), '69.50');
    await userEvent.click(canvas.getByRole('button', { name: 'Add to closet' }));
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mid Wash straight or slim jeans', cat: 'bottom', type: 'jeans', colorName: 'Mid Wash', denim: 'mid', brand: "Levi's", price: 69.5, source: 'manual' }),
    );
  },
};
