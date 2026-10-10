import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useLayoutEffect, useRef, useState } from 'react';

/* Two typefaces: Instrument Serif for display (titles, big numbers) and DM Sans for everything else. Each specimen
   below uses the app's own classes in their real context, and the spec beside it is measured from the browser,
   so this page shows the type as built. */

function Spec({ children, role, note }: { children: React.ReactNode; role: string; note: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [spec, setSpec] = useState('');
  useLayoutEffect(() => {
    const el = ref.current?.querySelector('[data-spec]') ?? ref.current?.firstElementChild;
    if (!el) return;
    const cs = getComputedStyle(el);
    const family = cs.fontFamily.includes('Instrument') ? 'Instrument Serif' : 'DM Sans';
    const tracking = cs.letterSpacing === 'normal' ? '' : ` · tracking ${cs.letterSpacing}`;
    setSpec(`${family} · ${cs.fontSize} / ${cs.lineHeight} · ${cs.fontWeight}${tracking}${cs.textTransform === 'uppercase' ? ' · uppercase' : ''}`);
  }, []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 24, padding: '18px 0', borderBottom: '1px solid var(--line)', alignItems: 'baseline' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{role}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{note}</div>
        <code style={{ fontSize: 11.5, color: 'var(--ink-2)', display: 'block', marginTop: 6 }}>{spec}</code>
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}

function Scale() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <Spec role="Page title" note="h1 · one per page; drops to 36px on phones">
        <h1>Good morning</h1>
      </Spec>
      <Spec role="Page title, emphasis" note="h1 em · the number that matters, in gap blue">
        <h1>
          Three pieces, <em data-spec>90 new outfits</em>
        </h1>
      </Spec>
      <Spec role="Card title" note=".hero-body h2 · the outfit on Today">
        <div className="hero-body" style={{ padding: 0 }}>
          <h2>Ready for the day</h2>
        </div>
      </Spec>
      <Spec role="Drawer title" note=".drawer h2 · piece details, compare stores">
        <div className="drawer" style={{ position: 'static', width: 'auto', padding: 0, boxShadow: 'none', animation: 'none', overflow: 'visible' }}>
          <h2>Classic Oxford Shirt</h2>
        </div>
      </Spec>
      <Spec role="Section title" note=".section-head h3">
        <div className="section-head" style={{ margin: 0 }}>
          <div>
            <h3>Rediscover what you own</h3>
          </div>
        </div>
      </Spec>
      <Spec role="Big number" note=".big-num · outfits unlocked">
        <div className="big-num">26</div>
      </Spec>
      <Spec role="Stat" note=".kpi .v · Closet report">
        <div className="kpi" style={{ padding: 0 }}>
          <div className="v">100</div>
        </div>
      </Spec>
      <Spec role="Eyebrow" note=".eyebrow · labels above titles">
        <div className="eyebrow" style={{ margin: 0 }}>
          Thursday, October 8
        </div>
      </Spec>
      <Spec role="Lede" note=".sub · the line under a page title">
        <p className="sub" style={{ margin: 0 }}>
          We compared 30 common pieces from 16 stores with your 24. These create the most new outfits with what you already own.
        </p>
      </Spec>
      <Spec role="Body" note="body · default text">
        <p>An outfit is a top, a bottom and shoes, or a dress and shoes, with an optional layer and accessory.</p>
      </Spec>
      <Spec role="Small title" note="h3.small · titles inside cards and drawers">
        <h3 className="small">Pairs with 14 pieces you own</h3>
      </Spec>
      <Spec role="Item name" note=".item-name · closet cards">
        <div className="item-name">Merino Crew Sweater</div>
      </Spec>
      <Spec role="Meta" note=".meta-line · secondary facts">
        <div className="meta-line" style={{ margin: 0 }}>
          Light Blue · Button-down shirt · Size M · Bought Feb 8
        </div>
      </Spec>
      <Spec role="Chip" note=".chip · brand, status">
        <span className="chip">J.Crew</span>
      </Spec>
    </div>
  );
}

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The type scale in use, largest first. */
export const TypeScale: Story = { render: () => <Scale /> };

/** Both families, with the italic used for emphasis in titles. */
export const Typefaces: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, maxWidth: 1000 }}>
      <div className="card card-pad">
        <div className="eyebrow">Display · Instrument Serif 400</div>
        <div style={{ font: '64px/1 var(--serif)' }}>Aa Bb 26</div>
        <div style={{ font: 'italic 40px/1.1 var(--serif)', color: 'var(--gap)', marginTop: 8 }}>new outfits</div>
        <p className="meta-line" style={{ marginTop: 12 }}>
          Titles, big numbers, the logo. Never below 17px.
        </p>
      </div>
      <div className="card card-pad">
        <div className="eyebrow">Text · DM Sans 400 / 500 / 600 / 700</div>
        <div style={{ fontSize: 28, lineHeight: 1.2 }}>
          <span style={{ fontWeight: 400 }}>Aa</span> <span style={{ fontWeight: 500 }}>Aa</span> <span style={{ fontWeight: 600 }}>Aa</span>{' '}
          <span style={{ fontWeight: 700 }}>Aa</span>
        </div>
        <p style={{ marginTop: 10 }}>Body at 14px, labels and buttons at 600. Numbers in tables use tabular figures: 1,234.50</p>
        <p className="meta-line" style={{ marginTop: 12 }}>
          Everything that isn&apos;t a title.
        </p>
      </div>
    </div>
  ),
};
