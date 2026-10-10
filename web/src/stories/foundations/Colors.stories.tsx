import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { themeModes } from '../../../.storybook/modes';

/* Colors are CSS custom properties in src/app/globals.css, each a light-dark() pair. These stories read the live
   values, so they always match the app: the swatches and contrast checks follow the theme in the toolbar, and the
   hex codes show both halves of the pair. */

type Token = { name: string; use: string };
const GROUPS: { title: string; note: string; tokens: Token[] }[] = [
  {
    title: 'Surfaces',
    note: 'Warm off-whites, and warm near-blacks in the dark. Garments sit on --tile, which stays light in both themes so photos and illustrations read like a flat lay.',
    tokens: [
      { name: '--bg', use: 'Page canvas behind everything' },
      { name: '--panel', use: 'Cards, drawers, dialogs, inputs' },
      { name: '--panel-2', use: 'Sidebar, quiet insets, hovered rows' },
      { name: '--tile', use: 'Behind every garment' },
      { name: '--tile-2', use: 'Pressed tile' },
      { name: '--fill', use: 'Chips, segmented controls' },
      { name: '--fill-active', use: 'The selected segment' },
    ],
  },
  {
    title: 'Ink and lines',
    note: 'Three steps of text. --ink-3 passes AA on the canvas and panels but not on --tile (4.35:1), so text on tiles should use --ink-2.',
    tokens: [
      { name: '--ink', use: 'Headings, body text, primary buttons, active nav' },
      { name: '--ink-2', use: 'Secondary text, descriptions' },
      { name: '--ink-3', use: 'Meta lines, captions, eyebrows, counts' },
      { name: '--on-ink', use: 'Text and icons on an --ink fill' },
      { name: '--line', use: 'Dividers, card edges' },
      { name: '--line-2', use: 'Control borders, empty slots (dashed)' },
    ],
  },
  {
    title: 'Fill the gap',
    note: 'The one accent. Blue means "something to shop or try": unlock counts, suggested pieces, the shopping list. Also the focus ring. Solid blue surfaces use --gap-solid, which stays dark enough for white text in both themes.',
    tokens: [
      { name: '--gap', use: 'Links, suggested-piece outlines, focus ring' },
      { name: '--gap-solid', use: 'Gap buttons, the unlock card, the summary bar' },
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
      { name: '--clay', use: 'The logo dot, favorite-store star, the plan button on an open day' },
      { name: '--clay-ink', use: 'Text on clay tint' },
      { name: '--clay-tint', use: 'Background for clay accents' },
      { name: '--note', use: 'Demo closet and Claude-suggested tags' },
      { name: '--note-ink', use: 'Text on note tint' },
      { name: '--note-tint', use: 'Demo banner, "Suggested from the photo" chip' },
    ],
  },
];

/** A token's light and dark values, as written in globals.css. */
function pair(name: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = raw.match(/^light-dark\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/);
  return m ? { light: m[1], dark: m[2] } : { light: raw, dark: raw };
}

/** A color as the browser resolves it right now (current theme), as [r, g, b, alpha]. */
function resolve(css: string): [number, number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const [r, g, b, a = 1] = (c.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b, a];
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
/** WCAG 2 contrast ratio of a text color over a background; text with alpha is blended onto it first. */
function contrast(fg: string, bg: string) {
  const b = resolve(bg);
  const f = resolve(fg);
  const blended = f.slice(0, 3).map((c, i) => c * f[3] + b[i] * (1 - f[3]));
  const [hi, lo] = [luminance(blended), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const css = (c: string) => (c.startsWith('--') ? `var(${c})` : c);

function Swatch({ name, use }: Token) {
  const { light, dark } = pair(name);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: `var(${name})`, boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ink) 10%, transparent)' }} />
      <div>
        <code style={{ fontWeight: 600, fontSize: 13 }}>{name}</code>
        <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>
          {light === dark ? light : `${light} · dark ${dark}`}
        </div>
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

/** Text and background pairs the app uses, and where. */
const PAIRS: { fg: string; bg: string; where: string }[] = [
  { fg: '--ink', bg: '--bg', where: 'Page titles and body text' },
  { fg: '--ink-2', bg: '--panel', where: 'Card descriptions, nav items' },
  { fg: '--ink-2', bg: '--fill', where: 'Chips, segmented control labels' },
  { fg: '--ink-3', bg: '--panel', where: 'Meta lines and captions on cards' },
  { fg: '--ink-3', bg: '--bg', where: 'Eyebrows on the page' },
  { fg: '--ink-3', bg: '--panel-2', where: 'Sidebar tagline and section labels' },
  { fg: '--ink-3', bg: '--tile', where: 'The empty-canvas hint; should be --ink-2' },
  { fg: '--on-ink', bg: '--ink', where: 'Primary buttons, active nav, filter chips, toasts' },
  { fg: '#ffffff', bg: '--gap-solid', where: 'Gap buttons, unlock card, summary bar' },
  { fg: 'rgba(255, 255, 255, 0.7)', bg: '--gap-solid', where: 'Unlock card eyebrow (white at 70%)' },
  { fg: 'rgba(255, 255, 255, 0.78)', bg: '--gap-solid', where: 'Summary bar caption (white at 78%)' },
  { fg: '#ffffff', bg: '--clay', where: 'Plan button on an open day' },
  { fg: '--gap-ink', bg: '--gap-tint', where: 'Gap chips, banners, sync status' },
  { fg: '--gap', bg: '--panel', where: 'Text links' },
  { fg: '--good', bg: '--good-tint', where: 'Good chips, "These work together"' },
  { fg: '--warn', bg: '--warn-tint', where: 'Clash verdicts, "You own this"' },
  { fg: '--warn', bg: '--panel', where: 'Error notes, "Remove permanently"' },
  { fg: '--note-ink', bg: '--note-tint', where: 'Demo banner, Claude-suggested chip' },
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
          const ratio = contrast(css(p.fg), css(p.bg));
          const pass = ratio >= 4.5;
          return (
            <tr key={`${p.fg}${p.bg}`} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '8px 10px' }}>
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: 8, background: css(p.bg), color: css(p.fg), fontWeight: 500 }}>Aa Rotation</span>
              </td>
              <td style={{ padding: '8px 10px' }}>
                <code>{p.fg}</code> on <code>{p.bg}</code>
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
  parameters: { layout: 'padded', chromatic: { modes: themeModes } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every color token, its light and dark values, and what it is for. Swatches follow the theme in the toolbar. */
export const Tokens: Story = { render: () => <Palette /> };

/** Text and background pairs from the app, checked against WCAG AA (4.5:1 for body text) in the current theme. Switch the toolbar to dark to check the dark palette. A failing row is either a pair to avoid (and marked so) or a real issue to fix in globals.css. */
export const ContrastPairs: Story = {
  render: () => <ContrastTable />,
  // The table shows failing pairs on purpose, so its samples aren't held to the contrast check.
  parameters: { a11y: { test: 'todo' } },
};
