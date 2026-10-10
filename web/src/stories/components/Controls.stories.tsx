import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';
import { Icon, ShopSwitch } from '@/components/ui';

/* Chips label things; the other controls here change what is shown. All are pills. */

const row = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as const;

const meta = {
  title: 'Components/Chips and controls',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read-only labels. The color says what kind of fact it is. */
export const Chips: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        ['', 'J.Crew', 'Brand, type, plain facts'],
        ['gap', 'Unlocks 26 outfits', 'Shopping'],
        ['new', 'New', 'Something just added'],
        ['good', 'Logged', 'Done, on your list'],
        ['warn', 'You own this', 'Why something was left out'],
        ['ai-chip', 'Suggested from the photo; check it', 'Filled in by Claude; needs a look'],
      ].map(([cls, text, use]) => (
        <div key={cls} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'center' }}>
          <span>
            <span className={`chip ${cls}`}>
              {cls === 'good' && <Icon name="check" />}
              {cls === 'warn' && <Icon name="alert" />}
              {cls === 'ai-chip' && <Icon name="builder" />}
              {text}
            </span>
          </span>
          <span className="meta-line">{use}</span>
        </div>
      ))}
    </div>
  ),
};

/** Category filters on the closet: count in the label, one active. */
export const FilterChips: Story = {
  render: function Render() {
    const [active, setActive] = useState('All');
    return (
      <div className="toolbar" role="group" aria-label="Category">
        {[
          ['All', 24],
          ['Tops', 9],
          ['Bottoms', 5],
          ['Outerwear', 4],
          ['Shoes', 3],
          ['Accessories', 3],
        ].map(([l, n]) => (
          <button key={l} className={`filter-chip ${active === l ? 'active' : ''}`} aria-pressed={active === l} onClick={() => setActive(String(l))}>
            {l}
            <b>{n}</b>
          </button>
        ))}
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Shoes/ }));
    await expect(canvas.getByRole('button', { name: /Shoes/ })).toHaveClass('active');
    await expect(canvas.getByRole('button', { name: /All/ })).not.toHaveClass('active');
  },
};

/** Segmented control: the occasion on Today, Pieces and Outfits on the closet. */
export const Segmented: Story = {
  render: function Render() {
    const [v, setV] = useState('work');
    return (
      <div className="seg" role="group" aria-label="Occasion">
        {['casual', 'work', 'dressy'].map((o) => (
          <button key={o} className={v === o ? 'active' : ''} aria-pressed={v === o} onClick={() => setV(o)}>
            {o[0].toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
    );
  },
};

/** Favorite stores in Settings: a set of toggles. */
export const ToggleChips: Story = {
  render: function Render() {
    const [on, setOn] = useState(['Gap', "Levi's", 'Uniqlo']);
    return (
      <div className="store-chips">
        {['Everlane', 'Gap', 'J.Crew', "Levi's", 'Madewell', 'Uniqlo', 'Zara'].map((s) => (
          <button key={s} className={`chip-toggle ${on.includes(s) ? 'on' : ''}`} aria-pressed={on.includes(s)} onClick={() => setOn(on.includes(s) ? on.filter((x) => x !== s) : [...on, s])}>
            {s}
          </button>
        ))}
      </div>
    );
  },
};

/** The shopping switch. It reads and writes the real setting, so it hides suggestions anywhere it appears. */
export const ShoppingSwitch: Story = {
  render: () => (
    <div style={row}>
      <ShopSwitch />
    </div>
  ),
  play: async ({ canvas }) => {
    const sw = canvas.getByRole('button', { name: 'Show shopping suggestions' });
    await expect(sw).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(sw);
    await expect(sw).toHaveAttribute('aria-pressed', 'false');
  },
};

/** Sort menu and other selects. */
export const Select: Story = {
  render: () => (
    <select className="select" aria-label="Sort" defaultValue="worn">
      <option value="recent">Recently added</option>
      <option value="worn">Most worn</option>
      <option value="least">Least worn</option>
      <option value="cpw">Lowest cost per wear</option>
    </select>
  ),
};
