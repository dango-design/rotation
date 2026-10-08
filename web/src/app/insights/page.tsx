'use client';

import { useUI } from '@/components/Shell';
import { money, Tile } from '@/components/ui';
import { daysBetween, todayISO } from '@/lib/dates';
import { cpw, totalOutfits } from '@/lib/engine';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';

export default function Insights() {
  const st = useStore();
  const ui = useUI();
  const today = todayISO();
  if (!st.items.length)
    return (
      <div className="card empty" style={{ marginTop: 40 }}>
        <h2>The closet report needs a closet</h2>
        <p>Once you add pieces and log a few outfits, this page shows what you wear most, where your clothes come from, and what each piece costs per wear.</p>
      </div>
    );

  const worn90 = st.items.filter((i) => i.lastWorn && daysBetween(i.lastWorn, today) <= 90).length;
  const priced = st.items.filter((i) => i.price && i.wears);
  const avg = priced.length ? priced.reduce((a, i) => a + i.price!, 0) / priced.reduce((a, i) => a + i.wears, 0) : null;
  const weekWears = st.wears.filter((w) => daysBetween(w.date, today) < 7).length;
  const most = [...st.items].sort((a, b) => b.wears - a.wears).slice(0, 8);
  const max = Math.max(1, most[0]?.wears ?? 1);
  const counts = new Map<string, number>();
  st.items.forEach((i) => {
    const k = i.store ?? i.brand ?? 'Unknown';
    counts.set(k || 'Unknown', (counts.get(k || 'Unknown') ?? 0) + 1);
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const shown = rows.slice(0, 7);
  if (rows.length > 7) shown.push([`${rows.length - 7} more`, rows.slice(7).reduce((a, r) => a + r[1], 0)]);
  const smax = Math.max(...shown.map((r) => r[1]));

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Closet report</div>
          <h1>{worn90 / st.items.length >= 0.6 ? 'Your closet is working' : 'Room to rotate'}</h1>
          <p className="sub">
            {worn90} of your {plural(st.items.length, 'piece')} {worn90 === 1 ? 'was' : 'were'} worn in the last 90 days.
          </p>
        </div>
      </header>
      <div className="kpis">
        <div className="card kpi">
          <div className="v">{totalOutfits(st.items)}</div>
          <div className="l">Outfits you can make</div>
          <div className="s">From {st.items.length} pieces</div>
        </div>
        <div className="card kpi">
          <div className="v">
            {Math.round((worn90 / st.items.length) * 100)}
            <small>%</small>
          </div>
          <div className="l">Worn in 90 days</div>
          <div className="s">
            {worn90} of {st.items.length} pieces
          </div>
        </div>
        <div className="card kpi">
          <div className="v">{avg ? money(avg) : '—'}</div>
          <div className="l">Average cost per wear</div>
          <div className="s">{priced.length ? `Across ${priced.length} priced pieces` : 'Add prices to see this'}</div>
        </div>
        <div className="card kpi">
          <div className="v">{weekWears}</div>
          <div className="l">Outfits logged this week</div>
          <div className="s">Tap Wear this on Today to log one</div>
        </div>
      </div>
      <div className="ins-grid">
        <article className="card card-pad">
          <h3 className="small">Most worn</h3>
          <div className="bars">
            {most.map((it) => {
              const c = cpw(it);
              return (
                <button key={it.id} className="bar-row" style={{ border: 0, background: 'none', textAlign: 'left', width: '100%' }} title={`${it.name}: ${it.wears} wears`} onClick={() => ui.open({ type: 'item', id: it.id })}>
                  <Tile w={it} />
                  <span className="nm">{it.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(it.wears / max) * 100}%` }} />
                  </div>
                  <span className="val">
                    {it.wears}
                    {c ? ` · ${money(c)}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="meta-line" style={{ marginTop: 10 }}>
            Wears · cost per wear
          </p>
        </article>
        <article className="card card-pad">
          <h3 className="small">Pieces by brand or store</h3>
          <div className="bars">
            {shown.map(([k, n]) => (
              <div key={k} className="bar-row" style={{ gridTemplateColumns: 'minmax(0,150px) 1fr 40px' }} title={`${k}: ${n} pieces`}>
                <span className="nm">{k}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(n / smax) * 100}%` }} />
                </div>
                <span className="val">{n}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
