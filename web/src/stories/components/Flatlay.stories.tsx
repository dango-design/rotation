import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Flatlay } from '@/components/ui';
import { demoCloset, demoId as id } from '../fixtures';

/* An outfit as a flat lay: the read-only picture of the outfit canvas, used on the week strip, saved outfits and the
   Today card. Pieces are true-to-life sizes in their usual spots, or wherever they were arranged by hand. Without a
   layer they spread out; a dress sits in the middle; a suggested piece is outlined in gap blue. */

const meta = {
  title: 'Components/Flatlay',
  component: Flatlay,
  tags: ['autodocs'],
  parameters: { layout: 'padded', store: demoCloset },
  // One outfit at the width of a saved-outfit card; the Sizes story shows others.
  render: (args) => (
    <div style={{ width: 320 }}>
      <Flatlay {...args} />
    </div>
  ),
  argTypes: { slots: { control: 'object' }, layout: { control: 'object' } },
} satisfies Meta<typeof Flatlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A layer, top, bottom, shoes and a bag. */
export const FullOutfit: Story = {
  args: { slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') } },
};

/** No layer, so the pieces use the bare layout. */
export const WithoutLayer: Story = {
  args: { slots: { top: id('t1'), bottom: id('b2'), shoes: id('s1'), acc: id('a3') } },
};

/** A dress takes the middle; there is no bottom. */
export const Dress: Story = {
  args: { slots: { outer: id('o1'), top: id('d1'), shoes: id('s4'), bag: id('a1') } },
};

/** A suggested piece (light straight chinos) styled with what you own. */
export const WithSuggestedPiece: Story = {
  args: { slots: { outer: id('o1'), top: id('t3'), bottom: 'p-chino-khaki', shoes: id('s3') } },
};

/** Arranged by hand on the canvas, and saved that way. */
export const HandArranged: Story = {
  args: {
    slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), bag: id('a1') },
    layout: {
      outer: { id: id('o2'), x: 2, y: 2, w: 52, z: 0 },
      top: { id: id('t3'), x: 34, y: 4, w: 48, z: 1 },
      bottom: { id: id('b1'), x: 40, y: 36, w: 58, z: 2 },
      shoes: { id: id('s2'), x: 6, y: 66, w: 22, z: 3 },
      bag: { id: id('a1'), x: 4, y: 40, w: 32, z: 4 },
    },
  },
};

/** The same outfit at the sizes it appears: week strip, saved outfit, Today card. */
export const Sizes: Story = {
  args: { slots: { outer: id('o4'), top: id('d3'), shoes: id('s3') } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
      {[110, 190, 420].map((w) => (
        <div key={w} style={{ width: w }}>
          <Flatlay {...args} />
        </div>
      ))}
    </div>
  ),
};
