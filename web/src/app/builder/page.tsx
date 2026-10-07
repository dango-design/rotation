'use client';

import { useState } from 'react';
import { useUI } from '@/components/Shell';
import { Art, Flatlay, Icon, LAYOUT, money, ShopSwitch, Tile } from '@/components/ui';
import { addDays, shortDate, todayISO } from '@/lib/dates';
import { check, forSlot, isComplete, slotOf, SLOTS } from '@/lib/engine';
import { useStore } from '@/lib/store';
import type { Item, Piece, Slot } from '@/lib/types';

const LABEL: Record<Slot, string> = { outer: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', acc: 'Extra' };
const TRAY: { id: Slot; label: string; cats: Item['cat'][] }[] = [
  { id: 'top', label: 'Tops', cats: ['top', 'dress'] },
  { id: 'bottom', label: 'Bottoms', cats: ['bottom'] },
  { id: 'outer', label: 'Outerwear', cats: ['outer'] },
  { id: 'shoes', label: 'Shoes', cats: ['shoes'] },
  { id: 'acc', label: 'Extras', cats: ['acc'] },
];

export default function Builder() {
  const st = useStore();
  const ui = useUI();
  const { draft, setDraft } = st;
  const [tray, setTray] = useState<Slot>(draft.focus);
  const [dragOver, setDragOver] = useState(false);
  const [planDate, setPlanDate] = useState(addDays(todayISO(), 1));
  const slots = draft.slots;
  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  const complete = isComplete(slots, st.wearableById);
  const verdict = check(pieces);
  const trial = pieces.filter((p) => !('wears' in p)) as Piece[];
  const dressOn = st.wearableById(slots.top)?.cat === 'dress';
  const sugg = forSlot(draft.focus, slots, st.items, st.catalog);

  const put = (slot: Slot, id: string) => {
    const w = st.wearableById(id);
    const next = { ...slots, [slot]: id };
    if (w?.cat === 'dress') delete next.bottom;
    setDraft({ ...draft, slots: next, focus: slot });
  };
  const remove = (slot: Slot) => {
    const next = { ...slots };
    delete next[slot];
    setDraft({ ...draft, slots: next, focus: slot });
  };
  const focus = (slot: Slot) => {
    setDraft({ ...draft, focus: slot });
    setTray(slot);
  };

  const slotEl = (s: Slot) => {
    const [l, t, w] = LAYOUT[s];
    const it = slots[s] ? st.wearableById(slots[s]) : undefined;
    const focused = draft.focus === s ? 'focused' : '';
    if (s === 'bottom' && dressOn)
      return (
        <div key={s} className="slot empty" style={{ left: `${l + w * 0.18}%`, top: `${t + w * 0.18}%`, width: `${w * 0.64}%`, aspectRatio: '1', opacity: 0.6 }}>
          Dress covers this
        </div>
      );
    if (!it)
      return (
        <div key={s} className={`slot empty ${focused}`} role="button" tabIndex={0} onClick={() => focus(s)} onKeyDown={(e) => e.key === 'Enter' && focus(s)} style={{ left: `${l + w * 0.18}%`, top: `${t + w * 0.18}%`, width: `${w * 0.64}%`, aspectRatio: '1' }}>
          + {LABEL[s]}
        </div>
      );
    const isTrial = !('wears' in it);
    const pos = it.cat === 'dress' ? [46, 4, 52] : [l, t, w];
    return (
      <div key={s} className={`slot ${focused} ${isTrial ? 'trial' : ''}`} role="button" tabIndex={0} aria-label={it.name} onClick={() => focus(s)} onKeyDown={(e) => e.key === 'Enter' && focus(s)} style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, width: `${pos[2]}%`, aspectRatio: '1' }}>
        <Art w={it} />
        <button className="slot-x" onClick={(e) => (e.stopPropagation(), remove(s))} aria-label={`Remove ${it.name}`}>
          <Icon name="x" />
        </button>
        {isTrial && (
          <div className="trial-tag">
            Not in your closet · from {money(Math.min(...(it as Piece).options.map((o) => o.price)))}
            <button className="btn" onClick={(e) => (e.stopPropagation(), ui.open({ type: 'compare', id: it.id }))}>
              Compare stores
            </button>
          </div>
        )}
      </div>
    );
  };

  const trayItems = st.items.filter((i) => TRAY.find((t) => t.id === tray)!.cats.includes(i.cat));

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Outfit builder</div>
          <input
            className="outfit-name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            aria-label="Outfit name"
            style={{ border: 0, background: 'transparent', padding: 0, width: '100%', color: 'inherit' }}
          />
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={() => setDraft({ name: 'New outfit', slots: {}, focus: 'top' })}>
            Clear
          </button>
          <button
            className="btn"
            disabled={!complete || !verdict.ok || trial.length > 0}
            style={!complete || !verdict.ok || trial.length > 0 ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            onClick={() => (st.wear(slots), st.toast('Logged as worn today'))}
          >
            <Icon name="check" />
            Wear today
          </button>
          <button
            className="btn primary"
            disabled={!complete || !verdict.ok || trial.length > 0}
            style={!complete || !verdict.ok || trial.length > 0 ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            onClick={() => (st.saveOutfit(draft.name || 'Untitled outfit', slots), st.toast('Saved to your outfits'))}
          >
            Save outfit
          </button>
        </div>
      </header>

      {st.items.length === 0 ? (
        <div className="card empty">
          <h2>Nothing to build with yet</h2>
          <p>Add a few pieces first, and they will appear here ready to mix.</p>
          <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
            <Icon name="plus" />
            Add pieces
          </button>
        </div>
      ) : (
        <div className="builder">
          <section className="card tray" aria-label="Your closet">
            <div className="tray-tabs">
              {TRAY.map((t) => (
                <button key={t.id} className={tray === t.id ? 'active' : ''} onClick={() => setTray(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="tray-grid">
              {trayItems.map((it) => (
                <button
                  key={it.id}
                  className={`tray-item ${slots[slotOf(it)] === it.id ? 'on' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                  onClick={() => put(slotOf(it), it.id)}
                  title={`${it.name}${it.brand ? ' · ' + it.brand : ''}`}
                >
                  <Tile w={it} />
                </button>
              ))}
              {!trayItems.length && <p className="empty-note" style={{ gridColumn: '1 / -1' }}>None yet.</p>}
            </div>
            <div className="tray-hint">Click or drag onto the board</div>
          </section>

          <section className="board-wrap">
            <div
              className={`board ${dragOver ? 'drag-over' : ''}`}
              aria-label="Outfit board"
              onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const id = e.dataTransfer.getData('text/plain');
                const it = st.itemById(id);
                if (it) put(slotOf(it), id);
              }}
            >
              {SLOTS.map(slotEl)}
            </div>
            <div className="board-status">
              {!complete ? (
                <span className="verdict empty">
                  <Icon name="info" />
                  Add a top, bottom and shoes (or a dress and shoes)
                </span>
              ) : verdict.ok ? (
                <span className="verdict ok">
                  <Icon name="check" />
                  These work together
                </span>
              ) : (
                <span className="verdict bad">
                  <Icon name="alert" />
                  {verdict.reason}
                </span>
              )}
              <span className="share-line">
                <Icon name="closet" />
                <span>
                  <b>
                    {pieces.length - trial.length} of {pieces.length}
                  </b>{' '}
                  from your closet{trial.length ? ` · ${trial.length} to shop` : ''}
                </span>
              </span>
            </div>
            <div className="card card-pad" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="meta-line" style={{ margin: 0 }}>Plan it for</span>
              <input type="date" className="select" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
              <button
                className="btn sm"
                disabled={!complete || !verdict.ok || trial.length > 0}
                onClick={() => (st.setPlan(planDate, { name: draft.name || 'Planned outfit', slots }), st.toast(`Planned for ${shortDate(planDate)}`))}
              >
                <Icon name="planner" />
                Plan
              </button>
            </div>
          </section>

          <section className="card complete" aria-label="Complete the look">
            <h3>Complete the look</h3>
            <p className="help">Pieces that work with everything else on the board.</p>
            <div className="slot-tabs">
              {SLOTS.map((s) => (
                <button key={s} className={draft.focus === s ? 'active' : ''} onClick={() => focus(s)}>
                  {LABEL[s]}
                </button>
              ))}
            </div>
            <div className="group">
              <div className="group-label">
                From your closet <span className="chip">Least-worn first</span>
              </div>
              {draft.focus === 'bottom' && dressOn ? (
                <div className="empty-note">A dress is on the board, so no bottom is needed.</div>
              ) : sugg.mine.length ? (
                sugg.mine.map((it) => {
                  const on = slots[draft.focus] === it.id;
                  return (
                    <div key={it.id} className={`sugg ${on ? 'current' : ''}`}>
                      <Tile w={it} />
                      <div>
                        <div className="sugg-name">{it.name}</div>
                        <div className="sugg-sub">
                          {it.brand ? <span className="chip">{it.brand}</span> : null}
                          <span>{it.wears} wears</span>
                        </div>
                      </div>
                      {on ? (
                        <span className="chip good">On board</span>
                      ) : (
                        <button className="btn xs" onClick={() => put(draft.focus, it.id)}>
                          Use
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-note">Nothing you own fits with the rest of this outfit. Try changing another piece.</div>
              )}
            </div>
            <div className="group">
              <div className="group-label">Shop the gap {st.settings.showShop ? <span className="chip">Ranked by outfits unlocked</span> : null}</div>
              {st.settings.showShop ? (
                sugg.shop.length ? (
                  sugg.shop.map(({ piece, unlock }) => {
                    const on = slots[draft.focus] === piece.id;
                    return (
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
                        {on ? (
                          <button className="btn xs" onClick={() => ui.open({ type: 'compare', id: piece.id })}>
                            Compare
                          </button>
                        ) : (
                          <button className="btn xs" onClick={() => put(draft.focus, piece.id)}>
                            Try it
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-note">Nothing new needed here. Your closet already covers this slot.</div>
                )
              ) : (
                <div className="shop-off">
                  <Icon name="info" />
                  <span>Shopping suggestions are hidden. Only pieces you own are shown.</span>
                </div>
              )}
            </div>
            <div className="complete-foot">
              <ShopSwitch />
            </div>
          </section>
        </div>
      )}

      {st.outfits.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h3>Saved outfits</h3>
              <p>Open one to edit it, or plan it from the Planner.</p>
            </div>
          </div>
          <div className="saved-strip">
            {st.outfits.map((o) => (
              <div key={o.id} className="card saved-card">
                <button style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => setDraft({ name: o.name, slots: o.slots, focus: 'top' })}>
                  <Flatlay slots={o.slots} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <b>{o.name}</b>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label={`Delete ${o.name}`} onClick={() => (st.removeOutfit(o.id), st.toast('Outfit deleted'))}>
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
