'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useUI } from '@/components/Shell';
import { Flatlay, Icon, money, Tile } from '@/components/ui';
import { onePhrase, TYPES } from '@/lib/catalog-meta';
import { ago, daysBetween, longDay, todayISO } from '@/lib/dates';
import { rankPieces, slotOf, SLOTS, totalOutfits, whyLine } from '@/lib/engine';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';
import { bestOutfitWith } from '@/lib/styling';
import { suggest } from '@/lib/today';
import type { Settings } from '@/lib/types';

const OCCASIONS: [Settings['occasion'], string][] = [
  ['casual', 'Casual'],
  ['work', 'Work'],
  ['dressy', 'Dressy'],
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Today() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const [shuffle, setShuffle] = useState(0);
  const today = todayISO();

  const plan = st.plans.find((p) => p.date === today);
  const wornToday = st.wears.find((w) => w.date === today);
  const suggestion = useMemo(
    () =>
      suggest(st.items, {
        occasion: st.settings.occasion,
        today,
        shuffle,
        temp: st.weather?.now,
        sky: st.weather?.sky,
        skyWord: st.skyWord,
      }),
    [st.items, st.settings.occasion, today, shuffle, st.weather, st.skyWord],
  );
  const showPlan = plan && shuffle === 0;
  const slots = wornToday?.slots ?? (showPlan ? plan.slots : suggestion?.slots);
  const picks = useMemo(() => rankPieces(st.catalog, st.items).filter((p) => p.unlock > 0 && p.dup.level < 1), [st.catalog, st.items]);

  if (!st.items.length) {
    return (
      <div className="card empty" style={{ marginTop: 40 }}>
        <div className="eyebrow">Welcome to Rotation</div>
        <h2>Style what you own. Shop what&apos;s missing.</h2>
        <p>Add a few pieces you wear often (a top, a bottom and some shoes is enough to start) and Rotation will build outfits from them every day.</p>
        <div className="row">
          <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
            <Icon name="plus" />
            Add your first piece
          </button>
          {/* A full page load: demo mode is chosen once, when the app starts. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="btn" href="/?demo">
            Explore a demo closet
          </a>
        </div>
      </div>
    );
  }

  const pieces = slots ? SLOTS.filter((s) => slots[s]).map((s) => st.itemById(slots[s])).filter(Boolean) : [];
  const worn90 = st.items.filter((i) => i.lastWorn && daysBetween(i.lastWorn, today) <= 90).length;
  const priced = st.items.filter((i) => i.price && i.wears);
  const avgCpw = priced.length ? priced.reduce((a, i) => a + i.price!, 0) / priced.reduce((a, i) => a + i.wears, 0) : null;
  const lead = picks[0];
  const redis = st.items
    .filter((i) => i.cat !== 'acc' && (!i.lastWorn || daysBetween(i.lastWorn, today) > 30))
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))
    .slice(0, 3);

  const edit = () => {
    if (!slots) return;
    st.setDraft({ name: showPlan ? plan.name : (suggestion?.title ?? 'Today'), slots, focus: 'top' });
    router.push(st.href('/builder'));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">{longDay(today)}</div>
          <h1>{greeting()}</h1>
          <div className="weather-line">
            {st.weather ? (
              <>
                <Icon name={st.weather.sky} />
                {st.settings.city} · {st.weather.summary}
              </>
            ) : (
              <>
                <Icon name="cloud" />
                <Link href={st.href('/settings')} className="link">
                  Add your city
                </Link>
                &nbsp;for weather-aware outfits
              </>
            )}
          </div>
          <div className="seg occasion-seg" role="group" aria-label="Occasion">
            {OCCASIONS.map(([v, l]) => (
              <button key={v} className={st.settings.occasion === v ? 'active' : ''} onClick={() => (st.updateSettings({ occasion: v }), setShuffle(0))}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="today-grid">
        {slots ? (
          <article className="card hero">
            <div className="hero-visual">
              <Flatlay slots={slots} />
            </div>
            <div className="hero-body">
              <div>
                <div className="eyebrow">{wornToday ? 'Worn today' : showPlan ? 'Planned for today' : "Today's outfit"}</div>
                <h2>{wornToday ? 'Nice choice' : showPlan ? plan.name : suggestion?.title}</h2>
              </div>
              {!wornToday && !showPlan && suggestion && (
                <ul className="reasons">
                  {suggestion.reasons.map((r) => (
                    <li key={r.strong}>
                      <Icon name={r.icon} />
                      <span>
                        <b>{r.strong}</b> {r.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="piece-list">
                {pieces.map((it) => (
                  <button key={it!.id} className="piece-row" style={{ border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', width: '100%' }} onClick={() => ui.open({ type: 'item', id: it!.id })}>
                    <Tile w={it} />
                    <span className="name">{it!.name}</span>
                    <span className="chip">{it!.brand || TYPES[it!.type].label}</span>
                  </button>
                ))}
              </div>
              <div className="hero-actions">
                {wornToday ? (
                  <span className="chip good">
                    <Icon name="check" />
                    Logged for today
                  </span>
                ) : (
                  <>
                    <button
                      className="btn primary"
                      onClick={() => {
                        st.wear(slots);
                        st.toast('Logged as worn today');
                      }}
                    >
                      <Icon name="check" />
                      Wear this
                    </button>
                    <button className="btn" onClick={() => setShuffle((n) => n + 1)}>
                      <Icon name="shuffle" />
                      {showPlan ? 'Suggest instead' : 'Shuffle'}
                    </button>
                  </>
                )}
                <button className="btn ghost" onClick={edit} aria-label="Edit in builder">
                  <Icon name="builder" />
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className="card empty">
            <h2>Almost there</h2>
            <p>
              Today&apos;s outfit needs a top, a bottom and shoes (or a dress and shoes) that work together. You have{' '}
              {[
                plural(st.items.filter((i) => slotOf(i) === 'top').length, 'top'),
                plural(st.items.filter((i) => slotOf(i) === 'bottom').length, 'bottom'),
                plural(st.items.filter((i) => slotOf(i) === 'shoes').length, 'pair of shoes', 'pairs of shoes'),
              ].join(', ')}.
            </p>
            <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
              <Icon name="plus" />
              Add a piece
            </button>
          </article>
        )}

        <aside className="today-side">
          {st.settings.showShop && lead ? (
            <article className="card unlock-card">
              <div className="eyebrow">Fill the gap</div>
              <div className="row">
                <Tile w={lead.piece} />
                <div>
                  <div className="big-num">{lead.unlock}</div>
                  <div>new outfits from {onePhrase(lead.piece.type)}</div>
                </div>
              </div>
              <p>
                {whyLine(lead.piece, st.items)} From {money(Math.min(...lead.piece.options.map((o) => o.price)))} at {lead.piece.options.length} stores.
              </p>
              <Link className="btn" href={st.href('/fill')}>
                See the outfits <Icon name="arrow" />
              </Link>
            </article>
          ) : null}
          <article className="card stats">
            <div className="eyebrow">Your closet</div>
            <div className="stat-row">
              <div className="stat">
                <div className="v">{totalOutfits(st.items)}</div>
                <div className="l">outfits you can make</div>
              </div>
              <div className="stat">
                <div className="v">{st.items.length ? Math.round((worn90 / st.items.length) * 100) : 0}%</div>
                <div className="l">worn in the last 90 days</div>
              </div>
              <div className="stat">
                <div className="v">{avgCpw ? money(avgCpw) : '—'}</div>
                <div className="l">average cost per wear</div>
              </div>
            </div>
          </article>
        </aside>
      </section>

      {redis.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h3>Rediscover what you own</h3>
              <p>Pieces you haven&apos;t reached for lately, styled with things you wear all the time.</p>
            </div>
          </div>
          <div className="rediscover">
            {redis.map((it) => (
              <article className="card redis-card" key={it.id}>
                <Flatlay slots={bestOutfitWith(it, st.items)} />
                <div className="redis-meta">
                  <div>
                    <h4>{it.name}</h4>
                    <p>
                      {it.wears ? `Worn ${it.wears} times · last ${ago(it.lastWorn, today)}` : 'Not worn yet'}
                    </p>
                  </div>
                  <button
                    className="btn sm"
                    onClick={() => {
                      st.setDraft({ name: `Styling the ${it.name}`, slots: bestOutfitWith(it, st.items), focus: slotOf(it) });
                      router.push(st.href('/builder'));
                    }}
                  >
                    Style it
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
