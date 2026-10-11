'use client';

import { useState } from 'react';
import { OutfitPanel } from '@/components/OutfitPanel';
import { useUI } from '@/components/Shell';
import { DemoLink, Flatlay, Icon, money, Tile } from '@/components/ui';
import { CATS } from '@/lib/catalog-meta';
import { cpw, slotOf } from '@/lib/engine';
import { heightOf, resolveLayout, trueWidth } from '@/lib/layout';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cat, Item, Slot } from '@/lib/types';

type SortKey = 'recent' | 'worn' | 'least' | 'cpw';

const SORTS: Record<SortKey, [string, (a: Item, b: Item) => number]> = {
  recent: ['Recently added', (a, b) => b.createdAt.localeCompare(a.createdAt)],
  worn: ['Most worn', (a, b) => b.wears - a.wears],
  least: ['Least worn', (a, b) => a.wears - b.wears],
  cpw: ['Lowest cost per wear', (a, b) => (cpw(a) ?? Infinity) - (cpw(b) ?? Infinity)],
};

const BADGE: Record<string, [string, string]> = {
  photo: ['camera', 'Photo'],
  link: ['link', 'Link'],
  manual: ['pencil', 'Described'],
  email: ['mail', 'Email'],
  demo: ['info', 'Demo'],
};

/** The closet grid filter that matches a board slot. */
const SLOT_CAT: Record<Slot, Cat> = { outer: 'outer', top: 'top', bottom: 'bottom', shoes: 'shoes', bag: 'bag', jewelry: 'jewelry', acc: 'acc' };

export default function Closet() {
  const st = useStore();
  const ui = useUI();
  const [view, setView] = useState<'pieces' | 'outfits'>('pieces');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const { draft, setDraft } = st;
  const onBoard = new Set(Object.values(draft.slots));

  const items = st.items
    .filter((i) => cat === 'all' || i.cat === cat)
    .sort(SORTS[sort][1]);
  const stores = new Set(st.items.map((i) => i.store ?? i.brand).filter(Boolean));

  const put = (id: string, at?: { x: number; y: number }) => {
    const it = st.itemById(id);
    if (!it) return;
    const slot = slotOf(it);
    const next = { ...draft.slots, [slot]: id };
    if (it.cat === 'dress') delete next.bottom;
    let layout = draft.layout;
    if (at) {
      // Dropped onto the canvas: centre it where it landed, at true size, on top of everything.
      const w = trueWidth(it.type);
      const z = Math.max(-1, ...Object.values(resolveLayout(draft.slots, layout, st.wearableById)).map((p) => p!.z)) + 1;
      layout = { ...resolveLayout(draft.slots, layout, st.wearableById), [slot]: { id, w, z, x: at.x - w / 2, y: at.y - heightOf(w) / 2 } };
    }
    setDraft({ ...draft, slots: next, layout, focus: slot });
  };
  /** Adding pieces builds a closet, so signed out it asks to sign in first. */
  const addPieces = () => st.requireAccount('start your closet', () => ui.open({ type: 'add' }));
  const startOutfit = () => {
    if (!st.building) setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
    st.setBuilding(true);
    setView('pieces');
  };

  /** The one number a card shows: whatever the closet is sorted by. */
  const metric = (it: Item) => {
    if (sort === 'worn' || sort === 'least') return `${plural(it.wears, 'wear')}`;
    if (sort === 'cpw') {
      const c = cpw(it);
      return c ? `${money(c)}/wear` : 'No price';
    }
    return null;
  };

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Closet</div>
          <h1>{view === 'pieces' ? plural(st.items.length, 'piece') : plural(st.outfits.length, 'saved outfit')}</h1>
          <p className="sub">
            {view === 'outfits'
              ? 'Outfits you built and saved. Open one to change it or plan it for a day.'
              : st.building
                ? 'Click a piece to put it on the board.'
                : `${stores.size ? `From ${plural(stores.size, 'brand and store', 'brands and stores')}. ` : ''}Tap any piece to see what it pairs with.`}
          </p>
        </div>
        <div className="head-actions">
          <div className="seg" role="group" aria-label="Closet view">
            <button className={view === 'pieces' ? 'active' : ''} onClick={() => setView('pieces')}>
              Pieces
            </button>
            <button className={view === 'outfits' ? 'active' : ''} onClick={() => setView('outfits')}>
              Outfits{st.outfits.length ? ` ${st.outfits.length}` : ''}
            </button>
          </div>
          {st.items.length > 0 && !st.building && (
            <button className="btn" onClick={startOutfit}>
              <Icon name="builder" />
              New outfit
            </button>
          )}
          <button className="btn primary" onClick={addPieces}>
            <Icon name="plus" />
            Add pieces
          </button>
        </div>
      </header>

      {st.items.length === 0 ? (
        <div className="card empty">
          <h2>Your closet is empty</h2>
          <p>
            Start with what you wear most. A photo on a plain surface works best; the background is removed on your device.
            {st.needsAccount && " You'll sign in with your email first, so your closet is saved to your account."}
          </p>
          <div className="row">
            <button className="btn primary" onClick={addPieces}>
              <Icon name="camera" />
              Add your first piece
            </button>
            {st.needsAccount && <DemoLink />}
          </div>
        </div>
      ) : (
        <div className={`closet-layout ${st.building ? 'building' : ''}`}>
          {view === 'pieces' ? (
            <div>
              <div className="toolbar">
                <button className={`filter-chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
                  All<b>{st.items.length}</b>
                </button>
                {CATS.map((c) => {
                  const n = st.items.filter((i) => i.cat === c.id).length;
                  return n ? (
                    <button key={c.id} className={`filter-chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
                      {c.label}
                      <b>{n}</b>
                    </button>
                  ) : null;
                })}
                <span className="spacer" />
                <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
                  {Object.entries(SORTS).map(([k, [label]]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="closet-grid">
                {items.map((it) => {
                  const [ic, label] = BADGE[it.source] ?? BADGE.manual;
                  const m = metric(it);
                  const state = st.building && onBoard.has(it.id) ? 'on-board' : '';
                  return (
                    <button
                      key={it.id}
                      className={`item-card ${state}`}
                      draggable={st.building}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                      onClick={() => (st.building ? put(it.id) : ui.open({ type: 'item', id: it.id }))}
                      aria-label={st.building ? `Put ${it.name} on the board` : undefined}
                    >
                      {st.building ? (
                        onBoard.has(it.id) && (
                          <span className="src good">
                            <Icon name="check" />
                            On board
                          </span>
                        )
                      ) : (
                        <span className="src">
                          <Icon name={ic} />
                          {it.source === 'email' ? (it.store ?? it.brand) : label}
                        </span>
                      )}
                      <Tile w={it} />
                      <div>
                        <div className="item-name">{it.name}</div>
                        <div className="item-sub">
                          <span>{it.brand}</span>
                          {m ? <span className="cpw">{m}</span> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : st.outfits.length ? (
            <div className="outfit-grid">
              {st.outfits.map((o) => (
                <article key={o.id} className="card saved-card">
                  <button
                    className="saved-open"
                    onClick={() => (st.build({ name: o.name, slots: o.slots, layout: o.layout, focus: 'top' }), setView('pieces'))}
                    aria-label={`Open ${o.name} on the board`}
                  >
                    <Flatlay slots={o.slots} layout={o.layout} />
                  </button>
                  <div className="saved-meta">
                    <b>{o.name}</b>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label={`Delete ${o.name}`} onClick={() => st.requireAccount('change your outfits', () => (st.removeOutfit(o.id), st.toast('Outfit deleted')))}>
                      <Icon name="trash" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card empty">
              <h2>No saved outfits yet</h2>
              <p>Put a few pieces on the board and save the ones you like. Saved outfits can be planned for any day on Today.</p>
              {!st.building && (
                <button className="btn primary" onClick={startOutfit}>
                  <Icon name="builder" />
                  Build an outfit
                </button>
              )}
            </div>
          )}
          {st.building && <OutfitPanel onPut={put} onFocus={(s) => (setView('pieces'), setCat(SLOT_CAT[s]))} />}
        </div>
      )}
    </>
  );
}
