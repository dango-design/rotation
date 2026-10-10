'use client';

/* The outfit board, shown beside the closet grid. The grid is the tray: clicking or dragging a piece
   puts it on the board, so this panel only holds the board, its actions, and pieces to shop. */

import { useState } from 'react';
import { addDays, shortDate, todayISO } from '@/lib/dates';
import { check, forSlot, isComplete, SLOTS } from '@/lib/engine';
import { useStore } from '@/lib/store';
import type { Piece, Slot } from '@/lib/types';
import { ExportOutfit, OutfitBoard, SLOT_LABEL } from './OutfitBoard';
import { useUI } from './Shell';
import { Icon, money, ShopSwitch, Tile } from './ui';

export function OutfitPanel({ onPut, onFocus }: { onPut: (id: string, at?: { x: number; y: number }) => void; onFocus: (slot: Slot) => void }) {
  const st = useStore();
  const ui = useUI();
  const { draft, setDraft } = st;
  const today = todayISO();
  const [planDate, setPlanDate] = useState(draft.date && draft.date >= today ? draft.date : addDays(today, 1));
  const slots = draft.slots;
  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  const complete = isComplete(slots, st.wearableById);
  const verdict = check(pieces);
  const trial = pieces.filter((p) => !('wears' in p)) as Piece[];
  const dressOn = st.wearableById(slots.top)?.cat === 'dress';
  // Any owned piece can be saved, worn or planned; a piece you'd still have to buy can't.
  const ready = pieces.length > 0 && trial.length === 0;
  const shop = st.settings.showShop ? forSlot(draft.focus, slots, st.items, st.catalog).shop : [];

  const remove = (slot: Slot) => {
    const next = { ...slots };
    delete next[slot];
    const layout = draft.layout ? { ...draft.layout } : undefined;
    if (layout) delete layout[slot];
    setDraft({ ...draft, slots: next, layout, focus: slot });
  };
  const focus = (slot: Slot) => {
    setDraft({ ...draft, focus: slot });
    onFocus(slot);
  };
  const put = (slot: Slot, id: string) => {
    const next = { ...slots, [slot]: id };
    if (st.wearableById(id)?.cat === 'dress') delete next.bottom;
    setDraft({ ...draft, slots: next, focus: slot });
  };

  return (
    <aside className="card outfit-panel" aria-label="Outfit board">
      <div className="panel-head">
        <div className="eyebrow">Building an outfit</div>
        <button className="icon-btn" onClick={() => st.setBuilding(false)} aria-label="Close outfit board">
          <Icon name="x" />
        </button>
      </div>
      <input className="outfit-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Outfit name" />
      <p className="panel-hint">Click or drag pieces from your closet onto the board. Faded pieces don&apos;t go with this outfit.</p>

      <OutfitBoard slots={slots} layout={draft.layout} onLayout={(layout) => setDraft({ ...draft, layout })} onRemove={remove} onSelect={focus} onDrop={onPut} />

      <div className="board-status">
        {!verdict.ok ? (
          <span className="verdict bad">
            <Icon name="alert" />
            {verdict.reason}
          </span>
        ) : complete ? (
          <span className="verdict ok">
            <Icon name="check" />
            These work together
          </span>
        ) : null}
        {trial.length > 0 && (
          <span className="share-line">
            <Icon name="unlock" />
            <span>
              <b>{trial.length}</b> to shop
            </span>
          </span>
        )}
      </div>

      <div className="panel-actions">
        <button
          className="btn primary"
          disabled={!ready}
          onClick={() => st.requireAccount('save this outfit', () => (st.saveOutfit(draft.name || 'Untitled outfit', slots, draft.layout), st.toast('Saved to your outfits')))}
        >
          Save outfit
        </button>
        <button className="btn" disabled={!ready} onClick={() => st.requireAccount('log what you wore', () => (st.wear(slots, undefined, draft.layout), st.toast('Logged as worn today')))}>
          <Icon name="check" />
          Wear today
        </button>
        <ExportOutfit slots={slots} layout={draft.layout} name={draft.name} />
        <button className="btn ghost" onClick={() => setDraft({ name: 'New outfit', slots: {}, focus: 'top' })}>
          Clear
        </button>
      </div>
      <div className="panel-plan">
        <span>Plan it for</span>
        <input type="date" className="select" value={planDate} min={today} onChange={(e) => setPlanDate(e.target.value)} aria-label="Plan date" />
        <button
          className="btn sm"
          disabled={!ready}
          onClick={() =>
            st.requireAccount('plan this outfit', () => (st.setPlan(planDate, { name: draft.name || 'Planned outfit', slots, layout: draft.layout }), st.toast(`Planned for ${shortDate(planDate)}`)))
          }
        >
          <Icon name="planner" />
          Plan
        </button>
      </div>

      <div className="panel-shop">
        <div className="group-label">Shop the gap</div>
        {st.settings.showShop ? (
          <>
            <div className="slot-tabs">
              {SLOTS.map((s) => (
                <button key={s} className={draft.focus === s ? 'active' : ''} onClick={() => focus(s)}>
                  {SLOT_LABEL[s]}
                </button>
              ))}
            </div>
            {draft.focus === 'bottom' && dressOn ? (
              <div className="empty-note">A dress is on the board, so no bottom is needed.</div>
            ) : shop.length ? (
              shop.map(({ piece, unlock }) => (
                <div key={piece.id} className="sugg shop">
                  <Tile w={piece} />
                  <div>
                    <div className="sugg-name">{piece.name}</div>
                    <div className="unlock-line">
                      <Icon name="unlock" />
                      Unlocks {unlock} outfits
                    </div>
                    <div className="sugg-sub">
                      From {money(Math.min(...piece.options.map((o) => o.price)))} at {piece.options.length} stores
                    </div>
                  </div>
                  {slots[draft.focus] === piece.id ? (
                    <button className="btn xs" onClick={() => ui.open({ type: 'compare', id: piece.id })}>
                      Compare
                    </button>
                  ) : (
                    <button className="btn xs" onClick={() => put(draft.focus, piece.id)}>
                      Try it
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-note">Nothing new needed here. Your closet already covers this slot.</div>
            )}
          </>
        ) : (
          <div className="shop-off">
            <Icon name="info" />
            <span>Shopping suggestions are hidden. Only pieces you own are shown.</span>
          </div>
        )}
        <div className="complete-foot">
          <ShopSwitch />
        </div>
      </div>
    </aside>
  );
}
