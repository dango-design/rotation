'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OutfitPanel } from '@/components/OutfitPanel';
import { SLOT_CAT, TrayCard, useBoardActions } from '@/components/PieceTray';
import { useUI } from '@/components/Shell';
import { useStopDay } from '@/components/StopDay';
import { DemoLink, Flatlay, Icon, money } from '@/components/ui';
import { CATS } from '@/lib/catalog-meta';
import { cpw } from '@/lib/engine';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cat, Item } from '@/lib/types';

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

export default function Closet() {
  const st = useStore();
  const ui = useUI();
  const [view, setView] = useState<'pieces' | 'outfits'>('pieces');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const router = useRouter();
  const { put, toggle } = useBoardActions();
  // Planning a day happens on Today, so a day on the board leaves the closet as it is and points back there.
  const dayOnBoard = st.building ? st.draft.date : undefined;
  const board = st.building && !dayOnBoard;
  const stopDay = useStopDay();

  const items = st.items
    .filter((i) => cat === 'all' || i.cat === cat)
    .sort(SORTS[sort][1]);
  const stores = new Set(st.items.map((i) => i.store ?? i.brand).filter(Boolean));
  /** Adding pieces builds a closet, so signed out it asks to sign in first. */
  const addPieces = () => st.requireAccount('start your closet', () => ui.open({ type: 'add' }));
  const startOutfit = () => {
    if (!st.building) st.setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
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
              : board
                ? 'Click a piece to put it on the board, or its pencil to edit it.'
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
        <>
          {dayOnBoard && (
            <div className="card resume-bar" role="region" aria-label="Day in progress">
              {Object.keys(st.draft.slots).length > 0 && <Flatlay slots={st.draft.slots} layout={st.draft.layout} bg={st.draft.bg} />}
              <div className="resume-text">
                <b>{stopDay.logging ? `Logging ${stopDay.dayName}` : `Planning ${stopDay.dayName}`}</b>
                The outfit is on Today. Open a piece here to see or edit it{view === 'outfits' ? ', or pick a saved outfit to use' : ''}.
              </div>
              <div className="resume-actions">
                <Link className="btn sm primary" href={st.href(`/?day=${dayOnBoard}`)}>
                  Back to Today
                  <Icon name="arrow" />
                </Link>
                <button className="btn sm ghost" onClick={stopDay.stop} aria-label={stopDay.label}>
                  Stop {stopDay.verb}
                </button>
              </div>
            </div>
          )}
          <div className={`closet-layout ${board ? 'building' : ''}`}>
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
                    return (
                      <TrayCard
                        key={it.id}
                        id={it.id}
                        board={board}
                        toggle={toggle}
                        meta={metric(it)}
                        extra={
                          <span className="src">
                            <Icon name={ic} />
                            {it.source === 'email' || it.source === 'link' ? (it.store ?? it.brand) : label}
                          </span>
                        }
                      />
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
                      onClick={() =>
                        dayOnBoard
                          ? (st.build({ ...st.draft, name: o.name, slots: o.slots, layout: o.layout, bg: o.bg, focus: 'top' }), router.push(st.href(`/?day=${dayOnBoard}`)))
                          : (st.build({ name: o.name, slots: o.slots, layout: o.layout, bg: o.bg, focus: 'top' }), setView('pieces'))
                      }
                      aria-label={dayOnBoard ? `Use ${o.name} for ${stopDay.dayName}` : `Open ${o.name} on the board`}
                    >
                      <Flatlay slots={o.slots} layout={o.layout} bg={o.bg} />
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
            {board && <OutfitPanel onPut={put} onFocus={(s) => (setView('pieces'), setCat(SLOT_CAT[s]))} />}
          </div>
        </>
      )}

      {stopDay.ask}
    </>
  );
}
