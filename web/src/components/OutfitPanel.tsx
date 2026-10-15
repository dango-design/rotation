'use client';

/* The outfit board, shown beside your pieces. The pieces are the tray: clicking or dragging one
   puts it on the board, so this panel only holds the board, its actions, and pieces to shop.
   Beside the closet it builds any outfit; on Today, beside the same pieces, it plans a day (or logs one, for a past day). */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { addDays, fmt, shortDate } from '@/lib/dates';
import { useDays } from '@/lib/days';
import { forSlot, SLOTS } from '@/lib/engine';
import { useStore } from '@/lib/store';
import type { Piece, Slot } from '@/lib/types';
import { ExportOutfit, OutfitBoard, SLOT_LABEL } from './OutfitBoard';
import { useUI } from './Shell';
import { Icon, money, ShopSwitch, Tile } from './ui';

export function OutfitPanel({ onPut, onFocus }: { onPut: (id: string, at?: { x: number; y: number }) => void; onFocus: (slot: Slot) => void }) {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const pathname = usePathname();
  const { today, wxFor, suggestFor } = useDays();
  const { draft, setDraft } = st;
  const day = draft.date;
  // A past day, or a day already worn, is logged; today and later are planned.
  const logging = !!day && (day < today || !!draft.log);
  const dayLabel = day === today ? 'today' : day ? fmt(day, { weekday: 'long' }) : '';
  // Planning today or later shows the day's forecast and Surprise me, or says what each still needs.
  const ahead = !!day && day >= today && !logging;
  const wx = ahead ? wxFor(day) : undefined;
  const idea = ahead ? suggestFor(day, draft.shuffle ?? 0) : null;
  const [planDate, setPlanDate] = useState(addDays(today, 1));
  const slots = draft.slots;
  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
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
  const surpriseMe = () => {
    if (!idea) return st.toast('Surprise me needs a top, bottom and shoes that go together, or a dress and shoes.');
    setDraft({ ...draft, slots: idea.slots, layout: undefined, focus: 'top', shuffle: (draft.shuffle ?? 0) + 1 });
  };
  /** Leaves the day: closes the board, showing that day on Today. */
  const backToDay = () => {
    setDraft({ ...draft, date: undefined, shuffle: undefined, log: undefined });
    st.setBuilding(false);
    if (pathname !== '/') router.push(st.href(`/?day=${day}`));
  };
  const finishDay = () => {
    if (!day) return;
    if (logging) {
      st.requireAccount('log what you wore', () => {
        st.logDay(day, { name: draft.name.trim() || 'What I wore', slots, ...(draft.layout ? { layout: draft.layout } : {}), ...(draft.bg ? { bg: draft.bg } : {}) });
        st.toast(day === today ? 'Logged as worn today' : 'Logged as worn');
        backToDay();
      });
    } else {
      st.requireAccount('plan this outfit', () => {
        st.setPlan(day, { name: draft.name.trim() || 'Planned outfit', slots, ...(draft.layout ? { layout: draft.layout } : {}), ...(draft.bg ? { bg: draft.bg } : {}) });
        st.toast(day === today ? 'Planned for today' : `Planned for ${fmt(day, { weekday: 'long' })}`);
        backToDay();
      });
    }
  };

  return (
    <aside className="card outfit-panel" aria-label="Outfit board">
      <div className="panel-head">
        <div className={`eyebrow ${day ? 'for-day' : ''}`}>{!day ? 'Building an outfit' : logging ? `Logging ${dayLabel}` : `Planning ${dayLabel}`}</div>
        <button className="icon-btn" onClick={() => (day ? backToDay() : st.setBuilding(false))} aria-label={day ? `Stop ${logging ? 'logging' : 'planning'} ${dayLabel}` : 'Close outfit board'}>
          <Icon name="x" />
        </button>
      </div>
      <input className="outfit-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Outfit name" />
      <p className="panel-hint">Click or drag your pieces onto the board, and click one again to take it off.</p>
      {ahead && (
        <div className="panel-day">
          {wx ? (
            <span className="callout-wx">
              <Icon name={wx.sky} />
              {wx.temp}° and {wx.word}: {wx.temp >= 66 ? 'warm enough to skip a layer.' : 'a layer will help.'}
            </span>
          ) : !st.settings.city ? (
            <span className="callout-wx">
              <Icon name="cloud" />
              <Link href={st.href('/settings')} className="link">
                Add your city
              </Link>
              for the forecast
            </span>
          ) : (
            <span className="callout-wx">
              <Icon name="cloud" />
              No forecast this far ahead yet.
            </span>
          )}
          <button className="btn sm ghost" onClick={surpriseMe}>
            <Icon name="shuffle" />
            Surprise me
          </button>
        </div>
      )}

      <div className="board-wrap">
        <OutfitBoard slots={slots} layout={draft.layout} bg={draft.bg} onLayout={(layout) => setDraft({ ...draft, layout })} onBg={(bg) => setDraft({ ...draft, bg })} onRemove={remove} onSelect={focus} onDrop={onPut} />
        <div className="board-tools">
          <button className="btn sm ghost" disabled={!pieces.length} onClick={() => setDraft(day ? { ...draft, slots: {}, layout: undefined, focus: 'top' } : { name: 'New outfit', slots: {}, focus: 'top' })}>
            Clear
          </button>
          <ExportOutfit slots={slots} layout={draft.layout} bg={draft.bg} name={draft.name} className="icon-btn sm" />
        </div>
      </div>

      {trial.length > 0 && (
        <div className="board-status">
          <span className="share-line">
            <Icon name="unlock" />
            <span>
              <b>{trial.length}</b> to shop
            </span>
          </span>
        </div>
      )}

      <div className="panel-actions">
        {day && (
          <button className="btn primary" disabled={!ready} onClick={finishDay}>
            <Icon name={logging ? 'check' : 'planner'} />
            {logging ? 'Log as worn' : `Plan for ${dayLabel}`}
          </button>
        )}
        {/* Started from a day on Today, the board plans (or logs) that day; from the closet, it makes an outfit to save. */}
        {!day && (
          <button
            className="btn primary"
            disabled={!ready}
            onClick={() => st.requireAccount('save this outfit', () => (st.saveOutfit(draft.name || 'Untitled outfit', slots, draft.layout, draft.bg), st.toast('Saved to your outfits')))}
          >
            Save outfit
          </button>
        )}
      </div>
      {!day && (
        <div className="panel-plan">
          <span>Or plan it for</span>
          <input type="date" className="select" value={planDate} min={today} onChange={(e) => setPlanDate(e.target.value)} aria-label="Plan date" />
          <button
            className="btn"
            disabled={!ready}
            onClick={() =>
              st.requireAccount('plan this outfit', () => (st.setPlan(planDate, { name: draft.name || 'Planned outfit', slots, layout: draft.layout, bg: draft.bg }), st.toast(`Planned for ${shortDate(planDate)}`)))
            }
          >
            <Icon name="planner" />
            Plan
          </button>
        </div>
      )}

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
