import type { Meta, StoryObj } from '@storybook/nextjs-vite';

/* Shape and depth. Two radii (--radius 16px for cards, --radius-sm 10px for tiles and rows), pill-shaped controls,
   and two shadows: a soft one for cards on the canvas and a deep one for anything floating above the page. */

const label = { fontSize: 12.5, color: 'var(--ink-2)', marginTop: 10 } as const;

const meta = {
  title: 'Foundations/Surfaces',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The containers everything sits in, from the canvas up. */
export const Containers: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22, maxWidth: 1100 }}>
      <figure style={{ margin: 0 }}>
        <div className="card card-pad" style={{ height: 130 }}>
          <h3 className="small">Card</h3>
          <p className="meta-line">.card · --panel, --radius, --shadow</p>
        </div>
        <figcaption style={label}>Groups one thing: an outfit, a pick, a settings section.</figcaption>
      </figure>
      <figure style={{ margin: 0 }}>
        <div className="tile" style={{ height: 130, aspectRatio: 'auto' }}>
          {/* --ink-3 is 4.4:1 on --tile, just under AA, so text on tiles uses --ink-2. */}
          <span className="meta-line" style={{ color: 'var(--ink-2)' }}>
            .tile · --tile, --radius-sm
          </span>
        </div>
        <figcaption style={label}>Behind every garment, photo or illustration.</figcaption>
      </figure>
      <figure style={{ margin: 0 }}>
        <div className="tile ghost" style={{ height: 130, aspectRatio: 'auto' }}>
          <span className="meta-line" style={{ color: 'var(--gap-ink)' }}>
            .tile.ghost
          </span>
        </div>
        <figcaption style={label}>A suggested piece you don&apos;t own yet: hatched, with a dashed gap-blue outline.</figcaption>
      </figure>
      <figure style={{ margin: 0 }}>
        <div className="card unlock-card" style={{ height: 130 }}>
          <div className="eyebrow">Fill the gap</div>
          <p>.unlock-card · --gap</p>
        </div>
        <figcaption style={label}>The one filled-blue surface per page: the strongest shopping prompt.</figcaption>
      </figure>
      <figure style={{ margin: 0 }}>
        <div className="sugg shop" style={{ height: 130, margin: 0, display: 'grid', placeItems: 'center' }}>
          <span className="unlock-line">.sugg.shop · --gap-tint</span>
        </div>
        <figcaption style={label}>A row suggesting something to buy.</figcaption>
      </figure>
      <figure style={{ margin: 0 }}>
        <div className="empty-note" style={{ height: 130, display: 'grid', placeItems: 'center' }}>
          .empty-note · dashed --line-2
        </div>
        <figcaption style={label}>Nothing here yet, inside a card or drawer.</figcaption>
      </figure>
    </div>
  ),
};

/** Radii and shadows. Controls are pills (99px); cards and dialogs round more as they get bigger. */
export const RadiusAndElevation: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-end' }}>
      {[
        ['8px', 'Small thumbnails (piece rows)'],
        ['var(--radius-sm)', '--radius-sm 10px · tiles, rows'],
        ['14px', 'Banners, callouts'],
        ['var(--radius)', '--radius 16px · cards'],
        ['22px', 'Dialogs'],
        ['99px', 'Buttons, chips, inputs'],
      ].map(([r, l]) => (
        <figure key={r} style={{ margin: 0, width: 130 }}>
          <div style={{ height: 88, borderRadius: r, background: 'var(--panel)', boxShadow: 'var(--shadow)' }} />
          <figcaption style={label}>{l}</figcaption>
        </figure>
      ))}
      <figure style={{ margin: 0, width: 220 }}>
        <div style={{ height: 88, borderRadius: 16, background: 'var(--panel)', boxShadow: 'var(--shadow-lg)' }} />
        <figcaption style={label}>--shadow-lg · drawers, dialogs, toasts, the board as a bottom sheet</figcaption>
      </figure>
    </div>
  ),
};
