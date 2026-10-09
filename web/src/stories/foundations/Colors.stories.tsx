import type { Meta, StoryObj } from '@storybook/nextjs-vite';

/* Colors are CSS custom properties on :root in src/app/globals.css. These stories read the live values, so they
   always match the app; change a token there and the swatches, hex codes and contrast checks here follow. */

type Token = { name: string; use: string };
const GROUPS: { title: string; note: string; tokens: Token[] }[] = [
  {
    title: 'Surfaces',
    note: 'Warm off-whites. Garments sit on --tile so photos and illustrations read like a flat lay.',
    tokens: [
      { name: '--bg', use: 'Page canvas behind everything' },
      { name: '--panel', use: 'Cards, drawers, dialogs, inputs' },
      { name: '--panel-2', use: 'Sidebar, quiet insets, hovered rows' },
      { name: '--tile', use: 'Behind every garment; chips; segmented controls' },
      { name: '--tile-2', use: 'Pressed tile' },
    ],
  },
  {
    title: 'Ink and lines',
    note: 'Three steps of text. --ink-3 passes AA on the canvas and panels but not on --tile; text on tiles uses --ink-2.',
    tokens: [
      { name: '--ink', use: 'Headings, body text, primary buttons, active nav' },
      { name: '--ink-2', use: 'Secondary text, descriptions' },
      { name: '--ink-3', use: 'Meta lines, captions, eyebrows, counts' },
      { name: '--line', use: 'Dividers, card edges' },
      { name: '--line-2', use: 'Control borders, empty slots (dashed)' },
    ],
  },
  {
    title: 'Fill the gap',
    note: 'The one accent. Blue means "something to shop or try": unlock counts, suggested pieces, the shopping list. Also the focus ring.',
    tokens: [
      { name: '--gap', use: 'Gap buttons, unlock card, suggested-piece outlines, focus ring' },
      { name: '--gap-ink', use: 'Text on gap tint; unlock lines' },
      { name: '--gap-tint', use: 'Suggestion rows, banners, sync status' },
      { name: '--gap-line', use: 'Borders on gap tint' },
      { name: '--chart-gap', use: 'Highlighted bars in charts' },
    ],
  },
  {
    title: 'Meaning',
    note: 'Status colors, each with a tint for backgrounds.',
    tokens: [
      { name: '--good', use: '"These work together", worn, switches on' },
      { name: '--good-tint', use: 'Background for good chips and verdicts' },
      { name: '--warn', use: 'Clashes, "You own this", destructive confirmation' },
      { name: '--warn-tint', use: 'Background for warnings' },
      { name: '--clay', use: 'The logo dot and favorite-store star' },
      { name: '--note', use: 'Demo closet and Claude-suggested tags' },
      { name: '--note-tint', use: 'Demo banner, "Suggested from the photo" chip' },
    ],
  },
];

const value = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
/** WCAG 2 contrast ratio; `alpha` blends the text color over the background first. */
function contrast(fg: string, bg: string, alpha = 1) {
  const b = hexToRgb(bg);
  const f = hexToRgb(fg).map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha))) as [number, number, number];
  const [hi, lo] = [luminance(f), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const resolve = (c: string) => (c.startsWith('--') ? value(c) : c);

function Swatch({ name, use }: Token) {
  const hex = value(name);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: `var(${name})`, boxShadow: 'inset 0 0 0 1px rgba(28,27,25,.08)' }} />
      <div>
        <code style={{ fontWeight: 600, fontSize: 13 }}>{name}</code> <span style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{hex}</span>
        <div style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{use}</div>
      </div>
    </div>
  );
}

function Palette() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30, maxWidth: 1100 }}>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="small">{g.title}</h3>
          <p className="meta-line" style={{ margin: '2px 0 14px' }}>
            {g.note}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {g.tokens.map((t) => (
              <Swatch key={t.name} {...t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Text and background pairs the app actually uses, with where. */
const PAIRS: { fg: string; bg: string; alpha?: number; where: string; large?: boolean }[] = [
  { fg: '--ink', bg: '--bg', where: 'Page titles and body text' },
  { fg: '--ink-2', bg: '--panel', where: 'Card descriptions, nav items' },
  { fg: '--ink-2', bg: '--tile', where: 'Chips, segmented control labels' },
  { fg: '--ink-3', bg: '--panel', where: 'Meta lines and captions on cards' },
  { fg: '--ink-3', bg: '--bg', where: 'Eyebrows on the page' },
  { fg: '--ink-3', bg: '--panel-2', where: 'Sidebar tagline and section labels' },
  { fg: '--ink-3', bg: '--tile', where: 'Not used: text on tiles is --ink-2' },
  { fg: '#ffffff', bg: '--ink', where: 'Primary buttons, active nav, filter chips' },
  { fg: '#ffffff', bg: '--gap', where: 'Gap buttons, unlock card, summary bar' },
  { fg: '#ffffff', bg: '--gap', alpha: 0.7, where: 'Unlock card eyebrow (white at 70%)' },
  { fg: '#ffffff', bg: '--gap', alpha: 0.78, where: 'Summary bar caption (white at 78%)' },
  { fg: '--gap-ink', bg: '--gap-tint', where: 'Gap chips, banners, sync status' },
  { fg: '--gap', bg: '--panel', where: 'Text links' },
  { fg: '--good', bg: '--good-tint', where: 'Good chips, "These work together"' },
  { fg: '--warn', bg: '--warn-tint', where: 'Clash verdicts, "You own this"' },
  { fg: '--warn', bg: '--panel', where: 'Error notes, "Remove permanently"' },
  { fg: '#3d33a8', bg: '--note-tint', where: 'Demo banner, Claude-suggested chip' },
];

function ContrastTable() {
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 13, maxWidth: 980, width: '100%' }}>
      <thead>
        <tr style={{ textAlign: 'left', color: 'var(--ink-3)' }}>
          {['Sample', 'Text on background', 'Used for', 'Ratio', 'AA'].map((h) => (
            <th key={h} style={{ padding: '8px 10px', fontWeight: 600, borderBottom: '1px solid var(--line-2)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PAIRS.map((p) => {
          const ratio = contrast(resolve(p.fg), resolve(p.bg), p.alpha);
          const pass = ratio >= (p.large ? 3 : 4.5);
          const fgCss = p.fg.startsWith('--') ? `var(${p.fg})` : p.fg;
          return (
            <tr key={`${p.fg}${p.bg}${p.alpha ?? ''}`} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '8px 10px' }}>
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 8, background: `var(${p.bg})`, color: fgCss, opacity: 1, fontWeight: 500 }}>
                  <span style={{ opacity: p.alpha ?? 1 }}>Aa Rotation</span>
                </span>
              </td>
              <td style={{ padding: '8px 10px' }}>
                <code>{p.fg}</code>
                {p.alpha ? ` at ${Math.round(p.alpha * 100)}%` : ''} on <code>{p.bg}</code>
              </td>
              <td style={{ padding: '8px 10px', color: 'var(--ink-2)' }}>{p.where}</td>
              <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{ratio.toFixed(2)}:1</td>
              <td style={{ padding: '8px 10px' }}>
                <span className={`chip ${pass ? 'good' : 'warn'}`}>{pass ? 'Pass' : 'Fail'}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every color token, its current value, and what it is for. */
export const Tokens: Story = { render: () => <Palette /> };

/** Text and background pairs from the app, checked against WCAG AA (4.5:1 for body text). A failing row is either a pair to avoid (and marked so) or a real issue to fix in globals.css. */
export const ContrastPairs: Story = {
  render: () => <ContrastTable />,
  // The table shows failing pairs on purpose, so its samples aren't held to the contrast check.
  parameters: { a11y: { test: 'todo' } },
};
