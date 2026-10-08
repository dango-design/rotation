'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DayPlanner } from '@/components/DayPlanner';
import { useUI } from '@/components/Shell';
import { Flatlay, Icon, money, Tile } from '@/components/ui';
import { onePhrase, TYPES } from '@/lib/catalog-meta';
import { addDays, ago, daysBetween, fmt, longDay, todayISO, weekStart } from '@/lib/dates';
import { rankPieces, slotOf, SLOTS, whyLine } from '@/lib/engine';
import { garmentSvg } from '@/lib/garments';
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

/** The outline of an outfit waiting to happen, for the empty-day callout. */
const GHOSTS: { type: string; cls: string }[] = [
  { type: 'shirt', cls: 'g-top' },
  { type: 'jeans', cls: 'g-bottom' },
  { type: 'sneakers', cls: 'g-shoes' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

type Planning = { day: string; mode: 'plan' | 'log'; slots?: OutfitSlots; name: string; offset: number };

/* Today is the day view and the week planner in one. The strip picks a day; a day with nothing planned
   asks for an outfit, which is built piece by piece with suggestions along the way. */
export default function Today() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const today = todayISO();
  const [day, setDay] = useState(today);
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [picking, setPicking] = useState(false);
  const isToday = day === today;
  const past = day < today;
  const start = weekStart(day);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const picks = useMemo(() => rankPieces(st.catalog, st.items).filter((p) => p.unlock > 0 && p.dup.level < 1), [st.catalog, st.items]);

  const wxFor = (date: string) => {
    if (date === today && st.weather) return { temp: st.weather.now, sky: st.weather.sky, word: st.skyWord ?? '' };
    const d = st.weather?.days.find((x) => x.date === date);
    return d ? { temp: d.high, sky: d.sky, word: skyWord(d.sky) } : undefined;
  };
  const suggestFor = (date: string, n: number) => {
    const wx = wxFor(date);
    return suggest(st.items, { occasion: st.settings.occasion, today: date, shuffle: n, temp: wx?.temp, sky: wx?.sky, skyWord: wx?.word });
  };

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

  const plan = st.plans.find((p) => p.date === day);
  const worn = st.wears.filter((w) => w.date === day).at(-1);
  const slots = worn?.slots ?? plan?.slots;
  const weekday = isToday ? 'today' : fmt(day, { weekday: 'long' });
  const dayName = isToday ? 'today' : fmt(day, { weekday: 'long', month: 'short', day: 'numeric' });
  const pieces = slots ? SLOTS.filter((s) => slots[s]).map((s) => st.itemById(slots[s])).filter(Boolean) : [];
  const lead = st.settings.showShop ? picks[0] : undefined;
  const wx = wxFor(day);
  const redis = st.items
    .filter((i) => i.cat !== 'acc' && (!i.lastWorn || daysBetween(i.lastWorn, today) > 30))
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))
    .slice(0, 3);
  const thisWeek = weekStart(today);
  const weekLabel =
    start === thisWeek ? 'This week' : start === addDays(thisWeek, 7) ? 'Next week' : start === addDays(thisWeek, -7) ? 'Last week' : `Week of ${fmt(start, { month: 'short', day: 'numeric' })}`;
  const isPlanning = planning?.day === day;
  // A complete outfit is possible at all (there is something to suggest).
  const idea = suggestFor(day, 0);
  const canBuild = !!idea;

  const startPlanning = (d: string, opts: { slots?: OutfitSlots; offset?: number; name?: string } = {}) => {
    setDay(d);
    setPicking(false);
    const label = d === today ? "Today's outfit" : `${fmt(d, { weekday: 'long' })}'s outfit`;
    setPlanning({ day: d, mode: d < today ? 'log' : 'plan', slots: opts.slots, offset: opts.offset ?? 0, name: opts.name ?? label });
  };
  const surpriseMe = () => {
    if (idea) startPlanning(day, { slots: idea.slots, offset: 1 });
  };
  const pickDay = (d: string) => {
    setDay(d);
    setPicking(false);
    if (planning && planning.day !== d) setPlanning(null);
  };
  const finish = (name: string, s: OutfitSlots, logDay = day) => {
    setPlanning(null);
    setPicking(false);
    if (logDay < today) {
      st.wear(s, logDay);
      st.toast('Logged as worn');
    } else {
      st.setPlan(logDay, { name, slots: s });
      st.toast(logDay === today ? 'Planned for today' : `Planned for ${fmt(logDay, { weekday: 'long' })}`);
    }
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
              <button key={v} className={st.settings.occasion === v ? 'active' : ''} onClick={() => st.updateSettings({ occasion: v })}>
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
            const dwx = st.weather?.days.find((x) => x.date === d);
            const s = w?.slots ?? p?.slots;
            const open = !s && d >= today;
            return (
              <button
                key={d}
                className={`strip-day ${d === day ? 'selected' : ''} ${d === today ? 'is-today' : ''} ${open ? 'open' : ''}`}
                // An open day goes straight to planning; any other day is shown below.
                onClick={() => (open && canBuild ? startPlanning(d) : pickDay(d))}
                aria-pressed={d === day}
                aria-label={`${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}${w ? ', worn' : p ? `, ${p.name}` : open ? ', plan an outfit' : ''}`}
              >
                <span className="strip-head">
                  <span>
                    <span className="d">{d === today ? 'Today' : fmt(d, { weekday: 'short' })}</span>
                    <span className="n">{fmt(d, { day: 'numeric' })}</span>
                  </span>
                  {dwx && (
                    <span className="wx">
                      <Icon name={dwx.sky} />
                      {dwx.high}°
                    </span>
                  )}
                </span>
                {s ? (
                  <Flatlay slots={s} />
                ) : (
                  <span className="strip-empty">
                    {open ? <Icon name="plus" /> : '–'}
                  </span>
                )}
                <span className="strip-label">{w ? <span className="worn-dot">Worn</span> : (p?.name ?? (open ? 'Plan it' : ''))}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`today-grid ${lead && !isPlanning ? '' : 'solo'}`}>
        {isPlanning ? (
          <DayPlanner
            key={`${planning.day}-${planning.offset}-${planning.slots ? 'seeded' : 'blank'}`}
            date={day}
            dayLabel={weekday}
            mode={planning.mode}
            initial={planning.slots}
            initialName={planning.name}
            weather={wx ? { temp: wx.temp, word: wx.word } : undefined}
            surprise={(n) => suggestFor(day, n + planning.offset)?.slots ?? null}
            onDone={(name, s) => finish(name, s)}
            onCancel={() => setPlanning(null)}
          />
        ) : slots ? (
          <article className="card hero">
            <div className="hero-visual">
              <Flatlay slots={slots} />
            </div>
            <div className="hero-body">
              <div>
                <div className="eyebrow">{worn ? `Worn ${isToday ? 'today' : `on ${dayName}`}` : `Planned for ${dayName}`}</div>
                <h2>{worn ? (plan?.name ?? 'Nice choice') : plan!.name}</h2>
              </div>
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
                    {day <= today && (
                      <button className="btn primary" onClick={() => (st.wear(slots, day), st.toast(isToday ? 'Logged as worn today' : 'Logged as worn'))}>
                        <Icon name="check" />
                        {isToday ? 'Wear this' : 'Wore it'}
                      </button>
                    )}
                    {!past && (
                      <button className="btn" onClick={() => startPlanning(day, { slots: plan!.slots, name: plan!.name })}>
                        <Icon name="pencil" />
                        Change
                      </button>
                    )}
                    <button className="btn ghost" onClick={() => (st.setPlan(day, null), st.toast('Plan cleared'))}>
                      Clear plan
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ) : canBuild ? (
          <article className={`card plan-callout ${past ? 'is-past' : ''}`}>
            <button className="callout-art" onClick={() => startPlanning(day)} aria-label={past ? `Log ${dayName}` : `Plan ${dayName}`}>
              {GHOSTS.map((g) => (
                <span key={g.cls} className={`ghost-piece ${g.cls}`} dangerouslySetInnerHTML={{ __html: garmentSvg(g.type, '#E7D6C6') }} />
              ))}
              <span className="callout-plus">
                <Icon name="plus" />
              </span>
            </button>
            <div className="callout-body">
              <div className="eyebrow">{past ? `Nothing logged · ${dayName}` : `Nothing planned · ${dayName}`}</div>
              <h2>{past ? `What did you wear on ${weekday}?` : isToday ? "Today's a blank canvas." : `${weekday}'s a blank canvas.`}</h2>
              <p>
                {past
                  ? 'Log it piece by piece so Rotation knows what you reach for.'
                  : 'Start with a piece you feel like wearing. Rotation suggests what goes with it as you build.'}
              </p>
              {!past && wx && (
                <p className="callout-wx">
                  <Icon name={wx.sky} />
                  {wx.temp}° and {wx.word}
                  {wx.temp < 66 ? ', so bring a layer' : ''}
                </p>
              )}
              <div className="callout-actions">
                <button className="btn primary" onClick={() => startPlanning(day)}>
                  <Icon name="plus" />
                  {past ? 'Log an outfit' : `Plan ${isToday ? "today's" : `${weekday}'s`} outfit`}
                </button>
                {st.outfits.length > 0 && (
                  <button className="btn" onClick={() => setPicking(true)}>
                    Use a saved outfit
                  </button>
                )}
                {!past && (
                  <button className="btn ghost" onClick={surpriseMe}>
                    <Icon name="shuffle" />
                    Surprise me
                  </button>
                )}
              </div>
            </div>
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

        {lead && !isPlanning && (
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
            <div className="modal" role="dialog" aria-label={past ? 'Log a saved outfit' : 'Plan a saved outfit'}>
              <button className="icon-btn close" onClick={() => setPicking(false)} aria-label="Close">
                <Icon name="x" />
              </button>
              <h2>
                {past ? 'Log' : 'Plan'} {fmt(day, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <p className="lede">{past ? 'Which of your saved outfits did you wear?' : 'Pick one of your saved outfits.'}</p>
              <div className="picker">
                {st.outfits.map((o) => (
                  <button key={o.id} onClick={() => finish(o.name, o.slots)}>
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
