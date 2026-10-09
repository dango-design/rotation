'use client';

import { garmentSvg } from '@/lib/garments';
import { useStore } from '@/lib/store';
import { resolveLayout, stackOrder } from '@/lib/layout';
import type { BoardBg, Layout, OutfitSlots, Wearable } from '@/lib/types';

export const ICONS: Record<string, string> = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5 5l1.4 1.4M17.6 17.6 19 19M2.5 12h2M19.5 12h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  closet: '<path d="M12 7.5a2 2 0 1 1 2-2c0 1-.8 1.5-1.5 1.9-.4.2-.5.5-.5.9V9"/><path d="M12 9 3.5 15.2c-.9.7-.4 1.8.6 1.8h15.8c1 0 1.5-1.1.6-1.8Z"/>',
  builder: '<path d="M11 3.5 12.6 8 17 9.5l-4.4 1.6L11 15.5l-1.6-4.4L5 9.5 9.4 8Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
  planner: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.7"/><path d="M12 14.5v2"/>',
  insights: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3" height="6.5" rx="1"/><rect x="10.5" y="6" width="3" height="11.5" rx="1"/><rect x="16" y="13" width="3" height="4.5" rx="1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  bag: '<path d="M5 8h14l-1 12.5H6Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  out: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6c1.1 1.7 2.3 2.7 4.3 2.7H21"/><path d="M3 17h3.5c1.3 0 2.2-.4 3-1.1M14.2 8.1c.8-.7 1.7-1.1 3-1.1H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  forward: '<rect x="9" y="3.5" width="11" height="11" rx="2"/><path d="M15 17.5v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1"/>',
  backward: '<rect x="4" y="9.5" width="11" height="11" rx="2"/><path d="M9 6.5v-1a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1" stroke-dasharray="2.2 2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5 5l1.4 1.4M17.6 17.6 19 19M2.5 12h2M19.5 12h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  fog: '<path d="M5 10a5 5 0 0 1 9.6-1.9A3.8 3.8 0 0 1 19.5 11.5"/><path d="M3 14.5h18M5 18h14M8 21.5h8"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5Z"/>',
  rain: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="m8 17-1 3M12 17l-1 3M16 17l-1 3"/>',
  snow: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="M8 18h.01M12 20h.01M16 18h.01"/>',
  storm: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="m12 15-2 4h4l-2 4"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6Z"/><path d="m9 12 2 2 4-4"/>',
  ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21Z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.3v.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }} />
  );
}

export const money = (n: number) => '$' + n.toFixed(2);

/** A garment as a background-removed photo, a product photo, or the illustration fallback. */
export function Art({ w }: { w?: Wearable & { imageId?: string; source?: string; cutout?: boolean } }) {
  const { imageFor } = useStore();
  if (!w) return null;
  const url = imageFor(w);
  if (url) return <img className={`photo ${w.source === 'link' && !w.cutout ? 'on-white' : ''}`} src={url} alt="" />;
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: garmentSvg(w.type, w.color, w.pattern) }} />;
}

export function Tile({ w, className = '' }: { w?: Wearable & { imageId?: string; source?: string; cutout?: boolean }; className?: string }) {
  return (
    <div className={`tile ${className}`}>
      <Art w={w} />
    </div>
  );
}

/** An outfit drawn as a flat lay, arranged as saved or at true-to-life sizes. */
export function Flatlay({ slots, layout, className = '' }: { slots: OutfitSlots; layout?: Layout; className?: string }) {
  const { wearableById } = useStore();
  const placed = resolveLayout(slots, layout, wearableById);
  return (
    <div className={`flatlay ${className}`}>
      {stackOrder(placed).map((s) => {
        const w = wearableById(slots[s])!;
        const p = placed[s]!;
        const ghost = !('wears' in w);
        return (
          <div key={s} className={`piece ${ghost ? 'ghost' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z, aspectRatio: '1' }}>
            <Art w={w} />
          </div>
        );
      })}
    </div>
  );
}

export function Disclosure() {
  return (
    <div className="disclosure">
      <Icon name="shield" />
      <span>
        <b>How we rank, and how we make money.</b> Pieces are ranked by the new outfits they create with your closet, your style, your size being in stock, and
        whether you already own something similar. Stores are listed by your favorites, then price. Products and prices shown are examples for now; when real
        store links arrive, any commission will be disclosed and will never change the ranking.
      </span>
    </div>
  );
}

const BOARD_BGS: [BoardBg, string][] = [
  ['white', 'White'],
  ['linen', 'Linen'],
  ['mist', 'Mist'],
  ['stone', 'Stone'],
];

/** Picks the background for every board and flat lay. The colors live in globals.css as --board-*. */
export function BoardSwatches({ labels = false, className = '' }: { labels?: boolean; className?: string }) {
  const { settings, updateSettings } = useStore();
  const current = settings.board ?? 'linen';
  return (
    // Inside the canvas, keep clicks and keys from reaching it, so a swatch doesn't deselect or move a piece.
    <div className={`swatches ${labels ? 'labeled' : ''} ${className}`} role="group" aria-label="Board background" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {BOARD_BGS.map(([k, label]) => (
        <button key={k} aria-pressed={current === k} aria-label={labels ? undefined : `${label} background`} title={labels ? undefined : label} onClick={() => updateSettings({ board: k })}>
          <i style={{ background: `var(--board-${k})` }} />
          {labels && label}
        </button>
      ))}
    </div>
  );
}

export function ShopSwitch({ label = 'Show shopping suggestions' }: { label?: string }) {
  const { settings, updateSettings, toast } = useStore();
  return (
    <button
      className="switch-row"
      aria-pressed={settings.showShop}
      onClick={() => {
        updateSettings({ showShop: !settings.showShop });
        toast(settings.showShop ? 'Shopping suggestions hidden. Your closet still works the same.' : 'Shopping suggestions are on');
      }}
    >
      <span className={`switch ${settings.showShop ? 'on' : ''}`}>
        <span />
      </span>
      {label}
    </button>
  );
}
