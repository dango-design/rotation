import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Icon, ICONS } from '@/components/ui';

/* Buttons are CSS classes (.btn plus a variant and a size) on a plain <button>. This wrapper only exists so the
   options show up as controls; in the app, write the classes directly. */

type Variant = 'default' | 'primary' | 'gap' | 'ghost';
type Size = 'md' | 'sm' | 'xs';

function Button({ label, variant = 'default', size = 'md', icon, disabled, onClick }: { label: string; variant?: Variant; size?: Size; icon?: string; disabled?: boolean; onClick?: () => void }) {
  const cls = ['btn', variant !== 'default' && variant, size !== 'md' && size].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled} onClick={onClick}>
      {icon && <Icon name={icon} />}
      {label}
    </button>
  );
}

const VARIANTS: Variant[] = ['primary', 'default', 'gap', 'ghost'];
const SIZES: Size[] = ['md', 'sm', 'xs'];
const USE: Record<Variant, string> = {
  primary: 'The main action: Wear this, Add pieces, Save outfit. One per area.',
  default: 'Everything else: Shuffle, Style it, Compare.',
  gap: 'Shopping actions on light surfaces.',
  ghost: 'Low-stakes or reversible: Clear, Saved outfits, Remove (first step).',
};
const row = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } as const;

const meta = {
  title: 'Components/Buttons',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Wear this', variant: 'primary', size: 'md', icon: 'check', disabled: false, onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: SIZES },
    icon: { control: 'select', options: [undefined, ...Object.keys(ICONS)] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Wear this' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Every variant at every size: md (40px) for page actions, sm (32px) inside cards, xs (28px) inside rows. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {VARIANTS.map((v) => (
        <div key={v}>
          <div className="eyebrow">{v}</div>
          <p className="meta-line" style={{ margin: '-4px 0 10px' }}>
            {USE[v]}
          </p>
          <div style={row}>
            {SIZES.map((s) => (
              <Button key={s} label={s === 'md' ? 'Medium' : s === 'sm' ? 'Small' : 'Extra small'} variant={v} size={s} icon={s === 'xs' ? undefined : 'shuffle'} />
            ))}
            <Button label="Disabled" variant={v} disabled />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Hover, keyboard focus and pressed, forced on so they can be reviewed and snapshotted. */
export const States: Story = {
  parameters: { pseudo: { hover: ['.is-hover'], focusVisible: ['.is-focus'], active: ['.is-active'] } },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(4, max-content)', gap: '14px 18px', alignItems: 'center' }}>
      <span />
      {['Rest', 'Hover', 'Focus', 'Pressed'].map((h) => (
        <span key={h} className="eyebrow" style={{ margin: 0 }}>
          {h}
        </span>
      ))}
      {VARIANTS.map((v) => (
        <div key={v} style={{ display: 'contents' }}>
          <span className="meta-line">{v}</span>
          {['', 'is-hover', 'is-focus', 'is-active'].map((state) => (
            <span key={state}>
              <button className={`btn ${v === 'default' ? '' : v} ${state}`}>Style it</button>
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Round icon buttons: the shopping bag (with its count), close, and week navigation. Each has an aria-label. */
export const IconButtons: Story = {
  render: () => (
    <div style={row}>
      <button className="icon-btn" aria-label="Shopping list, 3 items">
        <Icon name="bag" />
        <span className="bag-count">3</span>
      </button>
      <button className="icon-btn" aria-label="Shopping list, 0 items">
        <Icon name="bag" />
      </button>
      <button className="icon-btn" aria-label="Close">
        <Icon name="x" />
      </button>
      <button className="icon-btn" aria-label="Previous week">
        <Icon name="left" />
      </button>
      <button className="icon-btn" aria-label="Next week">
        <Icon name="right" />
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Icon-only buttons must still have a name for screen readers.
    for (const b of within(canvasElement).getAllByRole('button')) await expect(b).toHaveAccessibleName();
  },
};

/** On the gap-blue surfaces, buttons turn white. */
export const OnGapBlue: Story = {
  render: () => (
    <div className="card unlock-card" style={{ maxWidth: 360 }}>
      <div className="eyebrow">Fill the gap</div>
      <p>Light straight chinos would add 26 outfits.</p>
      <button className="btn">
        See the outfits <Icon name="arrow" />
      </button>
    </div>
  ),
};

/** Inline text link, for actions inside a sentence. */
export const TextLink: Story = {
  render: () => (
    <p>
      <button className="link">Add your city</button> for weather-aware outfits.
    </p>
  ),
};
