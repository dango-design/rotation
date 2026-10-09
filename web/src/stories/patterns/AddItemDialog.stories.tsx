import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, mocked, userEvent } from 'storybook/test';
import { AddItemDialog } from '@/components/AddItemDialog';
import type { GarmentType } from '@/lib/types';
import { findInPhoto, findInProduct, photoUrl, type Piece } from '@/lib/vision/find';
import { overlay, settled } from '../decorators';
import { demoCloset, photo, photoFile } from '../fixtures';

/* Adding a piece: by photo, by product link, or by description. Rotation finds each piece in a photo (or the product
   among a page's photos) and removes the background on the device; when it can't tell, it shows what it found and
   asks. Order-email import is shown as coming soon. In Storybook the on-device models and the server routes are
   stand-ins (see .storybook/preview.tsx and .storybook/api.ts), and each story says what was "found". */

/** A piece as the finder returns it: a cutout drawn as an image, or the whole photo. */
const found = (id: string, label: string, type: GarmentType, color: string, extra: Partial<Piece> = {}): Piece => ({
  id,
  label,
  blob: photoFile(type, color),
  rgb: [154, 171, 142],
  cutout: true,
  ...extra,
});
const asIs = (type: GarmentType, color: string, background: string): Piece => ({ id: 'whole', label: 'Photo as it is', blob: photoFile(type, color, background), rgb: [185, 168, 140], cutout: false });

const product = (images: string[]) => ({ title: 'Linen Shirt', brand: 'Everlane', store: 'Everlane', price: 68, category: 'Shirts', images });

/** Opens "Product link", pastes a link and reads the page. */
async function readLink(canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'], url: string) {
  await settled();
  await userEvent.click(canvas.getByRole('button', { name: /Product link/ }));
  await userEvent.type(canvas.getByLabelText('Product link'), url);
  await userEvent.click(canvas.getByRole('button', { name: 'Read the page' }));
}

/** Picks a photo, as if from the camera roll. */
async function upload(canvasElement: HTMLElement) {
  await settled();
  await userEvent.upload(canvasElement.querySelector<HTMLInputElement>('input[type=file]')!, photoFile('cardigan', '#9AAB8E', '#B9A88C'));
}

const meta = {
  title: 'Patterns/Add pieces',
  component: AddItemDialog,
  args: { onClose: fn() },
  decorators: [overlay],
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    // Known issue: the faded "Order emails" option is below 4.5:1 (color-contrast). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta<typeof AddItemDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first step: how to add it. Photo is recommended. */
export const Choose: Story = {};

/** A photo with one clear piece goes straight to its details, with the cutout. */
export const PhotoOnePiece: Story = {
  beforeEach: () => {
    mocked(findInPhoto).mockResolvedValue({ sure: true, guess: 'cardigan', pieces: [found('cardigan', 'Top', 'cardigan', '#9AAB8E', { part: 'top' }), asIs('cardigan', '#9AAB8E', '#B9A88C')] });
  },
  play: async ({ canvas, canvasElement }) => {
    await upload(canvasElement);
    await expect(await canvas.findByRole('heading', { name: 'Check the details' })).toBeVisible();
    await expect(canvas.getByLabelText('Type')).toHaveValue('tee');
  },
};

/** A photo of a whole outfit: every piece found, to add several at once. */
export const PhotoSeveralPieces: Story = {
  beforeEach: () => {
    mocked(findInPhoto).mockResolvedValue({
      sure: false,
      pieces: [
        found('top', 'Top', 'cardigan', '#9AAB8E', { part: 'top' }),
        found('bottom', 'Bottoms', 'loosejeans', '#9DB6CF', { part: 'bottom' }),
        found('shoes', 'Shoes', 'sneakers', '#F5F4F0', { part: 'shoes', clipped: true }),
        asIs('cardigan', '#9AAB8E', '#B9A88C'),
      ],
    });
  },
  play: async ({ canvas, canvasElement }) => {
    await upload(canvasElement);
    await expect(await canvas.findByRole('heading', { name: 'Which pieces?' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Top/ }));
    await userEvent.click(canvas.getByRole('button', { name: /^Bottoms/ }));
    await expect(canvas.getByRole('button', { name: 'Add 2 pieces' })).toBeEnabled();
  },
};

/** When finding fails (say the models couldn't download), the photo is used as it is. */
export const PhotoAsItIs: Story = {
  beforeEach: () => {
    mocked(findInPhoto).mockRejectedValue(new Error('The models could not be loaded'));
  },
  play: async ({ canvas, canvasElement }) => {
    await upload(canvasElement);
    await expect(await canvas.findByText(/the original photo will be used/)).toBeVisible();
  },
};

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
    await readLink(canvas, 'https://example.com/not-a-product');
    await expect(await canvas.findByText(/You can still add it by photo or description/)).toBeVisible();
  },
};

/** A clean product shot: the product is cut out and the page's name, brand and price fill in. */
export const LinkRead: Story = {
  parameters: { api: { 'POST /api/link': { body: product([photo('linenshirt', '#E9E1CF', '#ffffff')]) } } },
  beforeEach: () => {
    mocked(findInProduct).mockResolvedValue({ sure: true, guess: 'shirt', pieces: [found('shirt', 'Top', 'linenshirt', '#E9E1CF', { part: 'top', photo: 0 })] });
  },
  play: async ({ canvas }) => {
    await readLink(canvas, 'https://www.everlane.com/products/linen-shirt');
    await expect(await canvas.findByRole('heading', { name: 'Check the details' })).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveValue('Linen Shirt');
    await expect(canvas.getByLabelText('Price paid ($)')).toHaveValue(68);
  },
};

/** The page's photos show a model in a full outfit, so Rotation asks which piece is the product, with every photo on the page to choose from. */
export const LinkWhichOne: Story = {
  parameters: {
    api: { 'POST /api/link': { body: product([photo('linenshirt', '#E9E1CF', '#D8D2C8'), photo('linenshirt', '#E9E1CF', '#ffffff'), photo('chinos', '#C4AE84', '#ffffff')]) } },
  },
  beforeEach: () => {
    // Page photos are data URLs here, so they're shown directly instead of through the app's image route.
    mocked(photoUrl).mockImplementation((u) => u);
    mocked(findInProduct).mockResolvedValue({
      sure: false,
      pieces: [found('shirt', 'Top', 'linenshirt', '#E9E1CF', { part: 'top', photo: 0 }), found('chinos', 'Bottoms', 'chinos', '#C4AE84', { part: 'bottom', photo: 0 }), asIs('linenshirt', '#E9E1CF', '#D8D2C8')],
    });
  },
  play: async ({ canvas }) => {
    await readLink(canvas, 'https://www.everlane.com/products/linen-shirt');
    await expect(await canvas.findByRole('heading', { name: 'Which one is it?' })).toBeVisible();
    await expect(canvas.getByRole('group', { name: 'Photos on the product page' })).toBeVisible();
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
