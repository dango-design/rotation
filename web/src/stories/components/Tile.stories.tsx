import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tile } from '@/components/ui';
import { pieceById } from '@/lib/catalog';
import { demoData } from '@/lib/demo';
import { photoCloset } from '../fixtures';

/* A garment on its tile. Pieces show their photo when there is one (a background-removed cutout, or a product photo
   on white that blends into the tile) and the illustration otherwise. Suggested pieces get the ghost treatment. */

const items = demoData().items;
const byId = (id: string) => items.find((i) => i.id === id)!;
const caption = { fontSize: 12.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.35 } as const;

const oneTile = (Story: () => React.ReactNode) => <div style={{ width: 200 }}>{Story()}</div>;

const meta = {
  title: 'Components/Tile',
  component: Tile,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { w: byId('demo-t4') },
  argTypes: { w: { control: false } },
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A piece you own, drawn from its type and color. */
export const Illustration: Story = { decorators: [oneTile] };

/** A piece suggested from the catalog, which you don't own yet. */
export const Suggested: Story = {
  args: { w: pieceById('p-chino-khaki')!, className: 'ghost' },
  decorators: [oneTile],
};

/** The three ways a piece can look, side by side. Photos are stand-ins drawn as images. */
export const Sources: Story = {
  parameters: { store: photoCloset },
  render: () => {
    const [cut, , link] = photoCloset().items!;
    const cells = [
      { w: byId('demo-t8'), cls: '', text: 'Illustration: added by description or from an order email' },
      { w: cut, cls: '', text: 'Photo, background removed on the device' },
      { w: link, cls: '', text: 'Product photo from a link; the white background blends into the tile' },
      { w: pieceById('p-cardigan-oat')!, cls: 'ghost', text: 'Suggested piece, not owned' },
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 180px)', gap: 18 }}>
        {cells.map(({ w, cls, text }) => (
          <figure key={w.id} style={{ margin: 0 }}>
            <Tile w={w} className={cls} />
            <figcaption style={caption}>{text}</figcaption>
          </figure>
        ))}
      </div>
    );
  },
};

/** Tiles appear from 34px (report bars) to full drawer width; the garment keeps its padding at every size. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
      {[34, 38, 54, 72, 112, 176, 260].map((px) => (
        <figure key={px} style={{ margin: 0, width: px }}>
          <Tile w={byId('demo-o2')} />
          <figcaption style={caption}>{px}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
