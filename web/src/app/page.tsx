'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { OutfitPanel } from '@/components/OutfitPanel';
import { PieceTray, SLOT_CAT, type TrayTab, useBoardActions } from '@/components/PieceTray';
import { useUI } from '@/components/Shell';
import { useStopDay } from '@/components/StopDay';
import { boardProps, Confirm, DemoLink, Flatlay, Icon, money, Tile } from '@/components/ui';
import { backgroundOf } from '@/lib/backgrounds';
import { isAccessory, onePhrase, TYPES } from '@/lib/catalog-meta';
import { addDays, ago, daysBetween, fmt, longDay, weekStart } from '@/lib/dates';
import { useDays } from '@/lib/days';
import { plural } from '@/lib/format';
import { rankPieces, slotOf, SLOTS, whyLine } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { bestOutfitWith } from '@/lib/styling';
import { dayWear, wornOutfits } from '@/lib/wear';
import type { Cat } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* Today is the day view and the week planner in one. The strip picks a day; a day with nothing planned
   asks for an outfit, which is built right here, on the outfit board beside your pieces, the same way as in the closet. */
export default function Today() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const { today, wxFor, suggestFor, startPlanning } = useDays();
  const [day, setDay] = useState(today);
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [tray, setTray] = useState<TrayTab>('pieces');
  /** Asking before the day's plan is cleared. */
  const [clearing, setClearing] = useState(false);
  const { put } = useBoardActions();
  // Stopping the day on the board asks first if that would lose pieces the day doesn't have yet.
  const stopDay = useStopDay();
  // Coming back from planning a day on the board shows that day. Deferred so the first render matches the server.
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get('day');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) queueMicrotask(() => setDay(d));
  }, []);
  const isToday = day === today;
  const past = day < today;
  const start = weekStart(day);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const picks = useMemo(() => rankPieces(st.catalog, st.items).filter((p) => p.unlock > 0 && p.dup.level < 1), [st.catalog, st.items]);

  if (!st.items.length) {
    return (
      <div className="card empty" style={{ marginTop: 40 }}>
        <div className="eyebrow">Welcome to Rotation</div>
        <h2>Style what you own. Shop what&apos;s missing.</h2>
        <p>
          Add a few pieces you wear often (a top, a bottom and some shoes is enough to start) and Rotation will build outfits from them every day.
          {st.needsAccount && " You'll sign in with your email first, so your closet is saved to your account."}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => st.requireAccount('start your closet', () => ui.open({ type: 'add' }))}>
            <Icon name="plus" />
            Add your first piece
          </button>
          <DemoLink />
        </div>
      </div>
    );
  }

  const plan = st.plans.find((p) => p.date === day);
  const worn = dayWear(st.wears, day);
  const heroBg = backgroundOf(worn ? worn.bg : plan?.bg, st.settings.board);
  const slots = worn?.slots ?? plan?.slots;
  const weekday = isToday ? 'today' : fmt(day, { weekday: 'long' });
  const dayName = isToday ? 'today' : fmt(day, { weekday: 'long', month: 'short', day: 'numeric' });
  const pieces = slots ? SLOTS.filter((s) => slots[s]).map((s) => st.itemById(slots[s])).filter(Boolean) : [];
  const lead = st.settings.showShop ? picks[0] : undefined;
  const wx = wxFor(day);
  const redis = st.items
    .filter((i) => !isAccessory(i.cat) && (!i.lastWorn || daysBetween(i.lastWorn, today) > 30))
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))
    .slice(0, 3);
  const thisWeek = weekStart(today);
  const weekLabel =
    start === thisWeek ? 'This week' : start === addDays(thisWeek, 7) ? 'Next week' : start === addDays(thisWeek, -7) ? 'Last week' : `Week of ${fmt(start, { month: 'short', day: 'numeric' })}`;
  // A full outfit Rotation could suggest, for "Surprise me". Planning itself only needs one piece.
  const idea = suggestFor(day, 0);

  // The day on the outfit board. Showing it plans it here; looking at another day keeps it waiting, with a way back.
  const onBoard = st.building ? st.draft.date : undefined;
  const planningHere = !!onBoard && onBoard === day;
  const boardCount = SLOTS.filter((s) => st.draft.slots[s]).length;
  const planDay = (d: string, opts?: Parameters<typeof startPlanning>[1], from: TrayTab = 'pieces') => {
    setDay(d);
    setCat('all');
    setTray(from);
    startPlanning(d, opts);
  };
  // Outfits to wear again: ones worn before, then saved ones.
  const repeatFrom: TrayTab | undefined = wornOutfits(st.wears, st.plans).length ? 'worn' : st.outfits.length ? 'saved' : undefined;

  const surpriseMe = () => {
    if (idea) planDay(day, { slots: idea.slots, shuffle: 1 });
  };
  const pickDay = (d: string) => setDay(d);

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
        </div>
      </header>

      {onBoard && !planningHere && (
        <div className="card resume-bar" role="region" aria-label="Day in progress">
          {boardCount > 0 && <Flatlay slots={st.draft.slots} layout={st.draft.layout} bg={st.draft.bg} />}
          <div className="resume-text">
            <b>{stopDay.logging ? `Logging ${stopDay.dayName}` : `Planning ${stopDay.dayName}`}</b>
            {boardCount ? `${plural(boardCount, 'piece')} on the outfit board, not ${stopDay.logging ? 'logged' : 'planned'} yet.` : 'The outfit board is still open.'}
          </div>
          <div className="resume-actions">
            <button className="btn sm primary" onClick={() => setDay(onBoard)}>
              Back to the board
              <Icon name="arrow" />
            </button>
            <button className="btn sm ghost" onClick={stopDay.stop} aria-label={stopDay.label}>
              Stop {stopDay.verb}
            </button>
          </div>
        </div>
      )}

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
            const w = dayWear(st.wears, d);
            const dwx = st.weather?.days.find((x) => x.date === d);
            const s = w?.slots ?? p?.slots;
            const sl = w ? w.layout : p?.layout;
            const sbg = w ? w.bg : p?.bg;
            const open = !s && d >= today;
            return (
              <button
                key={d}
                className={`strip-day ${d === day ? 'selected' : ''} ${d === today ? 'is-today' : ''} ${open ? 'open' : ''}`}
                // An open day goes straight to planning; any other day is shown below.
                onClick={() => (open ? planDay(d) : pickDay(d))}
                aria-pressed={d === day}
                aria-label={`${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}${w ? ', worn' : p ? `, ${p.name}` : open ? (onBoard === d ? ', on the outfit board' : ', plan an outfit') : ''}`}
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
                  <Flatlay slots={s} layout={sl} bg={sbg} />
                ) : (
                  <span className="strip-empty">
                    {open ? <Icon name="plus" /> : '–'}
                  </span>
                )}
                <span className="strip-label">{w ? <span className="worn-dot">Worn</span> : (p?.name ?? (open ? (onBoard === d ? (d < today ? 'Logging' : 'Planning') : 'Plan it') : ''))}</span>
              </button>
            );
          })}
        </div>
      </section>

      {planningHere ? (
        <section className="closet-layout building day-planner" aria-label={`${past ? 'Log' : 'Plan'} ${dayName}`}>
          <PieceTray tab={tray} onTab={setTray} cat={cat} onCat={setCat} />
          <OutfitPanel onPut={put} onFocus={(s) => (setTray('pieces'), setCat(SLOT_CAT[s]))} />
        </section>
      ) : (
        <section className={`today-grid ${lead ? '' : 'solo'}`}>
          {slots ? (
            <article className="card hero">
              <div className="hero-visual" {...boardProps(heroBg)}>
                <Flatlay slots={slots} layout={worn ? worn.layout : plan?.layout} bg={heroBg} />
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
                {!worn && !past && <p className="meta-line">Counts as worn once {isToday ? 'the day is over' : `${fmt(day, { weekday: 'long' })} has passed`}. You can change it after.</p>}
                <div className="hero-actions">
                  {worn ? (
                    <>
                      <span className="chip good">
                        <Icon name="check" />
                        Worn
                      </span>
                      <button className="btn" onClick={() => planDay(day, { slots: worn.slots, layout: worn.layout, bg: worn.bg, name: plan?.name, log: true })}>
                        <Icon name="pencil" />
                        Change
                      </button>
                      <button className="btn ghost" onClick={() => st.requireAccount('change what you wore', () => (st.unlogDay(day), st.toast(isToday ? 'Taken off today' : `Taken off ${fmt(day, { weekday: 'long' })}`)))}>
                        Didn&apos;t wear it
                      </button>
                    </>
                  ) : (
                    <>
                      {!past && (
                        <button className="btn" onClick={() => planDay(day, { slots: plan!.slots, layout: plan!.layout, bg: plan!.bg, name: plan!.name })}>
                          <Icon name="pencil" />
                          Change
                        </button>
                      )}
                      <button className="btn ghost" onClick={() => setClearing(true)}>
                        Clear plan
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <article className={`card plan-callout ${past ? 'is-past' : ''}`}>
              <div className="callout-body">
                <div className="eyebrow">{past ? `Nothing logged · ${dayName}` : `Nothing planned · ${dayName}`}</div>
                <h2>{past ? `What did you wear on ${weekday}?` : isToday ? "Today's a blank canvas." : `${weekday}'s a blank canvas.`}</h2>
                <p>
                  {past
                    ? 'Put what you wore on the board so Rotation knows what you reach for.'
                    : 'Start with any piece you feel like wearing and build around it.'}
                </p>
                {!past && wx && (
                  <p className="callout-wx">
                    <Icon name={wx.sky} />
                    {wx.temp}° and {wx.word}
                    {wx.temp < 66 ? ', so bring a layer' : ''}
                  </p>
                )}
                <div className="callout-actions">
                  <button className="btn primary" onClick={() => planDay(day)}>
                    <Icon name="plus" />
                    {past ? 'Log an outfit' : `Plan ${isToday ? "today's" : `${weekday}'s`} outfit`}
                  </button>
                  {repeatFrom && (
                    <button className="btn" onClick={() => planDay(day, undefined, repeatFrom)}>
                      {past ? 'Pick a past outfit' : 'Repeat an outfit'}
                    </button>
                  )}
                  {!past && idea && (
                    <button className="btn ghost" onClick={surpriseMe}>
                      <Icon name="shuffle" />
                      Surprise me
                    </button>
                  )}
                </div>
              </div>
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
      )}

      {!planningHere && redis.length > 0 && (
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

      {clearing && plan && (
        <Confirm
          title="Clear this plan?"
          confirm="Clear plan"
          cancel="Keep it"
          onCancel={() => setClearing(false)}
          onConfirm={() => {
            setClearing(false);
            st.requireAccount('change your plans', () => (st.setPlan(day, null), st.toast('Plan cleared')));
          }}
        >
          {plan.name} comes off {dayName}. The pieces stay in your closet.
        </Confirm>
      )}
      {stopDay.ask}
    </>
  );
}
