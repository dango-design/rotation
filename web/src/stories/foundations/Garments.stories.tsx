import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CATS, SWATCHES, TYPES } from '@/lib/catalog-meta';
import { garmentSvg } from '@/lib/garments';
import type { GarmentType } from '@/lib/types';

/* Every piece without a photo is drawn from its type and one base color (lib/garments.ts). The palette works out
   edges, folds and highlights from that color, darkening light colors and lightening dark ones. */

const TYPE_IDS = Object.keys(TYPES) as GarmentType[];

function Garment({ type, color, pattern }: { type: GarmentType; color: string; pattern?: string }) {
  return (
    <div className="tile" style={{ width: 132 }}>
      <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: garmentSvg(type, color, pattern) }} />
    </div>
  );
}

const label = { fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.3 } as const;
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 16 } as const;

const meta = {
  title: 'Foundations/Garment illustrations',
  component: Garment,
  parameters: { layout: 'padded' },
  argTypes: {
    type: { control: 'select', options: TYPE_IDS },
    color: { control: 'color' },
    pattern: { control: 'inline-radio', options: [undefined, 'stripe'] },
  },
} satisfies Meta<typeof Garment>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try any type in any color. */
export const Playground: Story = {
  args: { type: 'chorejacket', color: '#5E6243' },
};

/** All 28 types, by category, in a color typical for each. */
export const AllTypes: Story = {
  args: { type: 'tee', color: '#F4F2EC' },
  render: () => {
    const typical: Partial<Record<GarmentType, string>> = { jeans: '#46658C', loosejeans: '#9DB6CF', denimjacket: '#5B7BA3', chinos: '#C4AE84', trench: '#C7B693', coat: '#B48A5A', boots: '#5E3F2C', loafers: '#4A2E22', puffer: '#1E1E1E', blazer: '#26324A', chorejacket: '#5E6243', beanie: '#A3532F', cap: '#2A3654', sweater: '#B48A5A', hoodie: '#A9A8A4', joggers: '#1F1F21', trousers: '#3E3E41', widetrousers: '#D7CBB3', dress: '#232323', skirt: '#6B2633', cardigan: '#D7CBB3', shirt: '#B7CBE2', linenshirt: '#E9E1CF', pockettee: '#232323', longsleeve: '#2F4A3A', tote: '#E8E0CC' };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {CATS.map((c) => (
          <section key={c.id}>
            <div className="eyebrow">{c.label}</div>
            <div style={grid}>
              {TYPE_IDS.filter((t) => TYPES[t].cat === c.id).map((t) => (
                <figure key={t} style={{ margin: 0 }}>
                  <Garment type={t} color={typical[t] ?? '#F4F2EC'} />
                  <figcaption style={label}>
                    <b>{TYPES[t].label}</b>
                    <br />
                    {t}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
};

/** One shape in every swatch people can pick. Checks the palette on very light (White, Ecru) and very dark (Black, Navy) colors, the stripe pattern and the denim washes. */
export const Colorways: Story = {
  args: { type: 'sweater', color: '#F4F2EC' },
  argTypes: { color: { table: { disable: true } }, pattern: { table: { disable: true } } },
  render: ({ type }) => (
    <div style={grid}>
      {SWATCHES.map((s) => (
        <figure key={s.name} style={{ margin: 0 }}>
          <Garment type={type} color={s.hex} pattern={s.pattern} />
          <figcaption style={label}>
            <b>{s.name}</b>
            <br />
            {s.hex} · {s.denim ? `${s.denim} denim` : s.tone}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};
