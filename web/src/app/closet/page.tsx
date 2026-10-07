'use client';

import { useState } from 'react';
import { useUI } from '@/components/Shell';
import { Icon, money, Tile } from '@/components/ui';
import { CATS } from '@/lib/catalog-meta';
import { cpw, totalOutfits } from '@/lib/engine';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cat, Item } from '@/lib/types';

const SORTS: Record<string, [string, (a: Item, b: Item) => number]> = {
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
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [sort, setSort] = useState(st.demo ? 'worn' : 'recent');
  const items = st.items.filter((i) => cat === 'all' || i.cat === cat).sort(SORTS[sort][1]);
  const stores = new Set(st.items.map((i) => i.store ?? i.brand).filter(Boolean));

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Closet</div>
          <h1>
            {plural(st.items.length, 'piece')}, {plural(totalOutfits(st.items), 'outfit')}
          </h1>
          <p className="sub">
            {stores.size ? `From ${stores.size} brands and stores. ` : ''}Tap any piece to see what it pairs with.
          </p>
        </div>
        <div className="head-actions">
          <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
            <Icon name="plus" />
            Add pieces
          </button>
        </div>
      </header>

      {st.items.length === 0 ? (
        <div className="card empty">
          <h2>Your closet is empty</h2>
          <p>Start with what you wear most. A photo on a plain surface works best; the background is removed on your device.</p>
          <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
            <Icon name="camera" />
            Add your first piece
          </button>
        </div>
      ) : (
        <>
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
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
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
              const c = cpw(it);
              return (
                <button key={it.id} className="item-card" onClick={() => ui.open({ type: 'item', id: it.id })}>
                  <span className="src">
                    <Icon name={ic} />
                    {it.source === 'email' ? (it.store ?? it.brand) : label}
                  </span>
                  <Tile w={it} />
                  <div>
                    <div className="item-name">{it.name}</div>
                    <div className="item-sub">
                      <span>
                        {it.brand ? `${it.brand} · ` : ''}
                        {it.wears} wears
                      </span>
                      {c ? <span className="cpw">{money(c)}/wear</span> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
