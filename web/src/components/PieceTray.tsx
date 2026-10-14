'use client';

/* Your pieces as the tray beside the outfit board: click or drag one onto the board, click it again to take it off,
   or use its pencil to edit it. The closet shows it with the board when you build an outfit; Today shows it when you plan
   a day, along with outfits worn before and saved ones, to wear again. */

import { CATS } from '@/lib/catalog-meta';
import { ago, todayISO } from '@/lib/dates';
import { slotOf } from '@/lib/engine';
import { plural } from '@/lib/format';
import { dropAt, resolveLayout } from '@/lib/layout';
import { useStore } from '@/lib/store';
import type { Background, Cat, Layout, OutfitSlots, Slot } from '@/lib/types';
import { wornOutfits } from '@/lib/wear';
import { useUI } from './Shell';
import { Flatlay, Icon, Tile } from './ui';

export type TrayTab = 'pieces' | 'worn' | 'saved';

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

const sameOutfit = (a: OutfitSlots, b: OutfitSlots) => {
  const ids = (x: OutfitSlots) => (Object.values(x).filter(Boolean) as string[]).sort().join('|');
  return ids(a) === ids(b);
};

/** The tray on its own, as Today shows it beside the board while planning a day: your pieces with category filters,
    and, when there are any, outfits worn before and saved ones. Picking an outfit puts it on the board to adjust. */
export function PieceTray({ tab, onTab, cat, onCat }: { tab: TrayTab; onTab: (t: TrayTab) => void; cat: Cat | 'all'; onCat: (c: Cat | 'all') => void }) {
  const st = useStore();
  const { toggle } = useBoardActions();
  const items = st.items.filter((i) => cat === 'all' || i.cat === cat);
  // Only outfits whose pieces are all still in the closet.
  const owned = (slots: OutfitSlots) => Object.values(slots).every((id) => !id || st.itemById(id));
  const worn = wornOutfits(st.wears, st.plans).filter((o) => owned(o.slots));
  const saved = st.outfits.filter((o) => owned(o.slots));
  const use = (o: { slots: OutfitSlots; layout?: Layout; bg?: Background; name?: string }) =>
    st.setDraft({ ...st.draft, slots: o.slots, layout: o.layout, bg: o.bg, name: o.name ?? st.draft.name, focus: 'top' });

  const outfitCard = (key: string, o: { slots: OutfitSlots; layout?: Layout; bg?: Background; name?: string }, title: string, sub?: string) => {
    const on = sameOutfit(o.slots, st.draft.slots);
    return (
      <button key={key} className={`card saved-card ${on ? 'on-board' : ''}`} onClick={() => use(o)} aria-label={on ? `${title}, on the board` : `Put ${title} on the board`}>
        {on && (
          <span className="src good">
            <Icon name="check" />
            On board
          </span>
        )}
        <Flatlay slots={o.slots} layout={o.layout} bg={o.bg} />
        <b>{title}</b>
        {sub && <span className="saved-sub">{sub}</span>}
      </button>
    );
  };

  return (
    <div className="piece-tray">
      {(worn.length > 0 || saved.length > 0) && (
        <div className="seg tray-tabs" role="group" aria-label="Choose from">
          <button className={tab === 'pieces' ? 'active' : ''} onClick={() => onTab('pieces')}>
            Pieces
          </button>
          {worn.length > 0 && (
            <button className={tab === 'worn' ? 'active' : ''} onClick={() => onTab('worn')}>
              Worn before
            </button>
          )}
          {saved.length > 0 && (
            <button className={tab === 'saved' ? 'active' : ''} onClick={() => onTab('saved')}>
              Saved
            </button>
          )}
        </div>
      )}
      {tab === 'worn' && worn.length > 0 ? (
        <div className="outfit-grid">
          {worn.map((o, i) => {
            const when = `Worn ${ago(o.last, todayISO())}`;
            const sub = [o.name && when, o.times > 1 && `${plural(o.times, 'time')} in all`].filter(Boolean).join(' · ');
            return outfitCard(`${o.last}-${i}`, o, o.name ?? when, sub || undefined);
          })}
        </div>
      ) : tab === 'saved' && saved.length > 0 ? (
        <div className="outfit-grid">{saved.map((o) => outfitCard(o.id, o, o.name))}</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
