import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Flatlay } from '@/components/ui';
import { blackDress, demoCloset, demoId as id } from '../fixtures';

/* An outfit as a flat lay: each piece has a fixed place on the board. Without a layer the pieces spread out to fill
   the space; a dress takes the top's place and needs no bottom; a suggested piece is outlined in gap blue. */

const meta = {
  title: 'Components/Flatlay',
  component: Flatlay,
  tags: ['autodocs'],
  parameters: { layout: 'padded', store: () => demoCloset({ items: [...demoCloset().items!, blackDress()] }) },
  // One outfit at the width of a saved-outfit card; the Sizes story shows others.
  render: (args) => (
    <div style={{ width: 320 }}>
      <Flatlay {...args} />
    </div>
  ),
  argTypes: { slots: { control: 'object' } },
} satisfies Meta<typeof Flatlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All five places filled: layer, top, bottom, shoes and an extra. */
export const FullOutfit: Story = {
  args: { slots: { outer: id('o2'), top: id('t3'), bottom: id('b1'), shoes: id('s2'), acc: id('a1') } },
};

/** No layer, so the top, bottom and shoes use the bare layout. */
export const WithoutLayer: Story = {
  args: { slots: { top: id('t1'), bottom: id('b2'), shoes: id('s1') } },
};

/** A dress takes the top place; there is no bottom. */
export const Dress: Story = {
  args: { slots: { outer: id('o1'), top: 'dress', shoes: id('s1') } },
};

/** A suggested piece (light straight chinos) styled with what you own. */
export const WithSuggestedPiece: Story = {
  args: { slots: { outer: id('o1'), top: id('t3'), bottom: 'p-chino-khaki', shoes: id('s3') } },
};

/** The same outfit at the sizes it appears: week strip, saved outfit, Today hero. */
export const Sizes: Story = {
  args: { slots: { outer: id('o4'), top: id('t9'), bottom: id('b5'), shoes: id('s3') } },
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
