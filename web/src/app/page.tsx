'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useUI } from '@/components/Shell';
import { Flatlay, Icon, money, Tile } from '@/components/ui';
import { onePhrase, TYPES } from '@/lib/catalog-meta';
import { addDays, ago, daysBetween, fmt, longDay, todayISO, weekStart } from '@/lib/dates';
import { rankPieces, slotOf, SLOTS, whyLine } from '@/lib/engine';
import { plural } from '@/lib/format';
import { useStore } from '@/lib/store';
import { bestOutfitWith } from '@/lib/styling';
import { suggest } from '@/lib/today';
import type { OutfitSlots, Settings } from '@/lib/types';
import { skyWord } from '@/lib/weather';

const OCCASIONS: [Settings['occasion'], string][] = [
  ['casual', 'Casual'],
  ['work', 'Work'],
  ['dressy', 'Dressy'],
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* Today is the day view and the week planner in one: the strip picks a day, and the outfit card shows
   what was worn, what is planned, or a suggestion for it. */
export default function Today() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const today = todayISO();
  const [day, setDay] = useState(today);
  const [shuf, setShuf] = useState({ day: today, n: 0 });
  const [picking, setPicking] = useState(false);
  const shuffle = shuf.day === day ? shuf.n : 0;
  const isToday = day === today;
  const past = day < today;
  const start = weekStart(day);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const suggestFor = (date: string, n: number) => {
    if (date === today)
      return suggest(st.items, { occasion: st.settings.occasion, today: date, shuffle: n, temp: st.weather?.now, sky: st.weather?.sky, skyWord: st.skyWord });
    const wx = st.weather?.days.find((d) => d.date === date);
    return suggest(st.items, { occasion: st.settings.occasion, today: date, shuffle: n, temp: wx?.high, sky: wx?.sky, skyWord: wx ? skyWord(wx.sky) : undefined });
  };

  const plan = st.plans.find((p) => p.date === day);
  const worn = st.wears.filter((w) => w.date === day).at(-1);
  const suggestion = past ? null : suggestFor(day, shuffle);
  const showPlan = plan && shuffle === 0;
  const slots = worn?.slots ?? (showPlan ? plan.slots : suggestion?.slots);
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

  const dayName = isToday ? 'today' : fmt(day, { weekday: 'long', month: 'short', day: 'numeric' });
  const pieces = slots ? SLOTS.filter((s) => slots[s]).map((s) => st.itemById(slots[s])).filter(Boolean) : [];
  const lead = st.settings.showShop ? picks[0] : undefined;
  const redis = st.items
    .filter((i) => i.cat !== 'acc' && (!i.lastWorn || daysBetween(i.lastWorn, today) > 30))
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))
    .slice(0, 3);
  const thisWeek = weekStart(today);
  const weekLabel =
    start === thisWeek ? 'This week' : start === addDays(thisWeek, 7) ? 'Next week' : start === addDays(thisWeek, -7) ? 'Last week' : `Week of ${fmt(start, { month: 'short', day: 'numeric' })}`;
  const title = worn ? (plan?.name ?? 'Nice choice') : showPlan ? plan.name : suggestion?.title;

  const pickDay = (d: string) => (setDay(d), setPicking(false));
  const reshuffle = () => setShuf({ day, n: shuffle + 1 });
  const choose = (name: string, s: OutfitSlots) => {
    setPicking(false);
    setShuf({ day, n: 0 });
    if (past) {
      st.wear(s, day);
      st.toast('Logged as worn');
    } else {
      st.setPlan(day, { name, slots: s });
      st.toast(isToday ? 'Planned for today' : `Planned for ${fmt(day, { weekday: 'long' })}`);
    }
  };
  const edit = () => {
    if (!slots) return;
    st.build({ name: title ?? 'Today', slots, focus: 'top', date: day });
    router.push(st.href('/closet'));
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
              <button key={v} className={st.settings.occasion === v ? 'active' : ''} onClick={() => (st.updateSettings({ occasion: v }), setShuf({ day, n: 0 }))}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="week-strip" aria-label="Week">
        <div className="strip-bar">
          <div>
            <span className="strip-title">{weekLabel}</span>
            <span className="meta-line">
              {fmt(start, { month: 'short', day: 'numeric' })} to {fmt(addDays(start, 6), { month: 'short', day: 'numeric' })}
              {st.weather ? ` · Forecast for ${st.settings.city}` : ''}
            </span>
          </div>
          <div className="strip-nav">
            {!isToday && (
              <button className="btn sm" onClick={() => pickDay(today)}>
                Back to today
              </button>
            )}
            <button className="icon-btn" aria-label="Previous week" onClick={() => pickDay(addDays(day, -7))}>
              <Icon name="left" />
            </button>
            <button className="icon-btn" aria-label="Next week" onClick={() => pickDay(addDays(day, 7))}>
              <Icon name="right" />
            </button>
          </div>
        </div>
        <div className="strip-days">
          {days.map((d) => {
            const p = st.plans.find((x) => x.date === d);
            const w = st.wears.filter((x) => x.date === d).at(-1);
            const wx = st.weather?.days.find((x) => x.date === d);
            const s = w?.slots ?? p?.slots;
            return (
              <button
                key={d}
                className={`strip-day ${d === day ? 'selected' : ''} ${d === today ? 'is-today' : ''}`}
                onClick={() => pickDay(d)}
                aria-pressed={d === day}
                aria-label={`${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}${w ? ', worn' : p ? `, ${p.name}` : ''}`}
              >
                <span className="strip-head">
                  <span>
                    <span className="d">{d === today ? 'Today' : fmt(d, { weekday: 'short' })}</span>
                    <span className="n">{fmt(d, { day: 'numeric' })}</span>
                  </span>
                  {wx && (
                    <span className="wx">
                      <Icon name={wx.sky} />
                      {wx.high}°
                    </span>
                  )}
                </span>
                {s ? <Flatlay slots={s} /> : <span className="strip-empty">{d < today ? '–' : <Icon name="plus" />}</span>}
                <span className="strip-label">{w ? <span className="worn-dot">Worn</span> : (p?.name ?? '')}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`today-grid ${lead ? '' : 'solo'}`}>
        {slots ? (
          <article className="card hero">
            <div className="hero-visual">
              <Flatlay slots={slots} />
            </div>
            <div className="hero-body">
              <div>
                <div className="eyebrow">
                  {worn ? `Worn ${isToday ? 'today' : `on ${dayName}`}` : showPlan ? `Planned for ${dayName}` : isToday ? "Today's outfit" : `An idea for ${dayName}`}
                </div>
                <h2>{title}</h2>
              </div>
              {!worn && !showPlan && suggestion && (
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
                {worn ? (
                  <span className="chip good">
                    <Icon name="check" />
                    Logged
                  </span>
                ) : (
                  <>
                    {!past || plan ? (
                      day <= today ? (
                        <button className="btn primary" onClick={() => (st.wear(slots, day), st.toast(isToday ? 'Logged as worn today' : 'Logged as worn'))}>
                          <Icon name="check" />
                          {isToday ? 'Wear this' : 'Wore it'}
                        </button>
                      ) : showPlan ? null : (
                        <button className="btn primary" onClick={() => choose(suggestion!.title, slots)}>
                          <Icon name="planner" />
                          Plan this
                        </button>
                      )
                    ) : null}
                    {!past && (
                      <button className="btn" onClick={reshuffle}>
                        <Icon name="shuffle" />
                        {showPlan ? 'Suggest instead' : 'Shuffle'}
                      </button>
                    )}
                    {st.outfits.length > 0 && (
                      <button className="btn ghost" onClick={() => setPicking(true)}>
                        Saved outfits
                      </button>
                    )}
                    {showPlan && (
                      <button className="btn ghost" onClick={() => (st.setPlan(day, null), st.toast('Plan cleared'))}>
                        Clear plan
                      </button>
                    )}
                  </>
                )}
                <button className="btn ghost" onClick={edit} aria-label="Change it on the outfit board">
                  <Icon name="builder" />
                </button>
              </div>
            </div>
          </article>
        ) : past ? (
          <article className="card empty">
            <h2>Nothing logged</h2>
            <p>Nothing was logged for {dayName}.{st.outfits.length ? ' If you wore one of your saved outfits, log it here.' : ''}</p>
            {st.outfits.length > 0 && (
              <button className="btn primary" onClick={() => setPicking(true)}>
                Log a saved outfit
              </button>
            )}
          </article>
        ) : (
          <article className="card empty">
            <h2>Almost there</h2>
            <p>
              An outfit needs a top, a bottom and shoes (or a dress and shoes) that work together. You have{' '}
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

        {lead && (
          <aside className="today-side">
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
          </aside>
        )}
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
                    <p>{it.lastWorn ? `Last worn ${ago(it.lastWorn, today)}` : 'Not worn yet'}</p>
                  </div>
                  <button
                    className="btn sm"
                    onClick={() => {
                      st.build({ name: `Styling the ${it.name}`, slots: bestOutfitWith(it, st.items), focus: slotOf(it) });
                      router.push(st.href('/closet'));
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

      {picking && (
        <>
          <div className="backdrop" onClick={() => setPicking(false)} />
          <div className="modal-wrap">
            <div className="modal" role="dialog" aria-label={past ? 'Log an outfit' : 'Plan an outfit'}>
              <button className="icon-btn close" onClick={() => setPicking(false)} aria-label="Close">
                <Icon name="x" />
              </button>
              <h2>
                {past ? 'Log' : 'Plan'} {fmt(day, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <p className="lede">{past ? 'Which of your saved outfits did you wear?' : 'Pick a suggestion or one of your saved outfits.'}</p>
              <div className="picker">
                {!past &&
                  [0, 1, 2].map((n) => {
                    const s = suggestFor(day, n);
                    return s ? (
                      <button key={`s${n}`} onClick={() => choose(s.title, s.slots)}>
                        <Flatlay slots={s.slots} />
                        Suggestion {n + 1}
                      </button>
                    ) : null;
                  })}
                {st.outfits.map((o) => (
                  <button key={o.id} onClick={() => choose(o.name, o.slots)}>
                    <Flatlay slots={o.slots} />
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
