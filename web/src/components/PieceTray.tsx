'use client';

/* Your pieces as the tray beside the outfit board: click or drag one onto the board, click it again to take it off,
   or use its pencil to edit it. The closet shows it with the board when you build an outfit; Today shows it when you plan a day. */

import { CATS } from '@/lib/catalog-meta';
import { slotOf } from '@/lib/engine';
import { dropAt, resolveLayout } from '@/lib/layout';
import { useStore } from '@/lib/store';
import type { Cat, Slot } from '@/lib/types';
import { useUI } from './Shell';
import { Icon, Tile } from './ui';

/** The closet filter that matches a board slot. */
export const SLOT_CAT: Record<Slot, Cat> = { outer: 'outer', top: 'top', bottom: 'bottom', shoes: 'shoes', bag: 'bag', jewelry: 'jewelry', acc: 'acc' };

/** Putting pieces on the outfit board and taking them off. */
export function useBoardActions() {
  const st = useStore();
  const { draft, setDraft } = st;

  const put = (id: string, at?: { x: number; y: number }) => {
    const it = st.itemById(id);
    if (!it) return;
    const slot = slotOf(it);
    const next = { ...draft.slots, [slot]: id };
    if (it.cat === 'dress') delete next.bottom;
    let layout = draft.layout;
    if (at) {
      // Dropped onto the canvas: centre it where it landed, at true size, on top of everything.
      const current = resolveLayout(draft.slots, layout, st.wearableById);
      const z = Math.max(-1, ...Object.values(current).map((p) => p!.z)) + 1;
      layout = { ...current, [slot]: dropAt(id, it.type, z, at) };
    }
    setDraft({ ...draft, slots: next, layout, focus: slot });
  };
  /** A click takes a piece that's already on the board back off, and puts any other piece on. */
  const toggle = (id: string) => {
    const it = st.itemById(id);
    if (!it || draft.slots[slotOf(it)] !== id) return put(id);
    const slot = slotOf(it);
    const slots = { ...draft.slots };
    delete slots[slot];
    const layout = draft.layout ? { ...draft.layout } : undefined;
    if (layout) delete layout[slot];
    setDraft({ ...draft, slots, layout, focus: slot });
  };
  return { put, toggle };
}

/** One piece in the tray. `extra` fills the corner badge when the board isn't open (the closet's source badge). */
export function TrayCard({ id, board, toggle, extra, meta }: { id: string; board: boolean; toggle: (id: string) => void; extra?: React.ReactNode; meta?: string | null }) {
  const st = useStore();
  const ui = useUI();
  const it = st.itemById(id);
  if (!it) return null;
  const on = board && Object.values(st.draft.slots).includes(it.id);
  return (
    <div className="item-cell">
      <button
        className={`item-card ${on ? 'on-board' : ''}`}
        draggable={board}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
        onClick={() => (board ? toggle(it.id) : ui.open({ type: 'item', id: it.id }))}
        aria-label={board ? (on ? `Take ${it.name} off the board` : `Put ${it.name} on the board`) : undefined}
      >
        {board
          ? on && (
              <span className="src good">
                <Icon name="check" />
                On board
              </span>
            )
          : extra}
        <Tile w={it} />
        <div>
          <div className="item-name">{it.name}</div>
          <div className="item-sub">
            <span>{it.brand}</span>
            {meta ? <span className="cpw">{meta}</span> : null}
          </div>
        </div>
      </button>
      {/* With the board open a click puts a piece on it, so editing a piece gets its own button. */}
      {board && (
        <button className="icon-btn card-edit" onClick={() => ui.open({ type: 'item', id: it.id })} aria-label={`Edit ${it.name}`} title="Edit piece">
          <Icon name="pencil" />
        </button>
      )}
    </div>
  );
}

/** The tray on its own, with category filters: what Today shows beside the board while planning a day. */
export function PieceTray({ cat, onCat }: { cat: Cat | 'all'; onCat: (c: Cat | 'all') => void }) {
  const st = useStore();
  const { toggle } = useBoardActions();
  const items = st.items.filter((i) => cat === 'all' || i.cat === cat);
  return (
    <div className="piece-tray">
      <div className="toolbar">
        <button className={`filter-chip ${cat === 'all' ? 'active' : ''}`} onClick={() => onCat('all')}>
          All<b>{st.items.length}</b>
        </button>
        {CATS.map((c) => {
          const n = st.items.filter((i) => i.cat === c.id).length;
          return n ? (
            <button key={c.id} className={`filter-chip ${cat === c.id ? 'active' : ''}`} onClick={() => onCat(c.id)}>
              {c.label}
              <b>{n}</b>
            </button>
          ) : null;
        })}
      </div>
      <div className="closet-grid">
        {items.map((it) => (
          <TrayCard key={it.id} id={it.id} board toggle={toggle} />
        ))}
      </div>
    </div>
  );
}
