import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon, ICONS } from '@/components/ui';

/* One set of line icons on a 24px grid, 1.7px stroke, round caps, drawn in currentColor. They're sized by the
   component they sit in (17px in buttons, 19px in nav, 13px in chips). The weather icons double as sky states. */

const meta = {
  title: 'Foundations/Icons',
  component: Icon,
  parameters: { layout: 'padded' },
  args: { name: 'unlock' },
  argTypes: { name: { control: 'select', options: Object.keys(ICONS) } },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pick any icon. It fills its container, here 48px. */
export const Playground: Story = {
  decorators: [(Story) => <div style={{ width: 48, height: 48 }}>{Story()}</div>],
};

/** Every icon, by the name passed to `<Icon name="…" />`. */
export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10, maxWidth: 1000 }}>
      {Object.keys(ICONS).map((name) => (
        <figure key={name} className="card" style={{ margin: 0, padding: '16px 8px 10px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', width: 26, height: 26 }}>
            <Icon name={name} />
          </span>
          <figcaption style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>{name}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
