'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Flatlay, Icon } from '@/components/ui';
import { addDays, fmt, shortDate, todayISO, weekStart } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { suggest } from '@/lib/today';
import { skyWord } from '@/lib/weather';

export default function Planner() {
  const st = useStore();
  const today = todayISO();
  const [offset, setOffset] = useState(0);
  const [picking, setPicking] = useState<string | null>(null);
  const start = addDays(weekStart(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const suggestFor = (date: string, n: number) => {
    const wx = st.weather?.days.find((d) => d.date === date);
    return suggest(st.items, { occasion: st.settings.occasion, today: date, shuffle: n, temp: wx?.high, sky: wx?.sky, skyWord: wx ? skyWord(wx.sky) : undefined });
  };

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Planner</div>
          <h1>{offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : `Week of ${shortDate(start)}`}</h1>
          <p className="sub">
            {fmt(start, { month: 'long', day: 'numeric' })} to {fmt(addDays(start, 6), { month: 'long', day: 'numeric' })}
            {st.weather ? ` · Forecast for ${st.settings.city}` : ''}
          </p>
        </div>
        <div className="head-actions">
          <button className="icon-btn" aria-label="Previous week" onClick={() => setOffset((o) => o - 1)}>
            <Icon name="left" />
          </button>
          <button className="btn" onClick={() => setOffset(0)}>
            Today
          </button>
          <button className="icon-btn" aria-label="Next week" onClick={() => setOffset((o) => o + 1)}>
            <Icon name="right" />
          </button>
        </div>
      </header>

      <div className="week week7">
        {days.map((date) => {
          const plan = st.plans.find((p) => p.date === date);
          const worn = st.wears.filter((w) => w.date === date).at(-1);
          const wx = st.weather?.days.find((d) => d.date === date);
          const past = date < today;
          const slots = worn?.slots ?? plan?.slots;
          return (
            <article key={date} className={`card day ${date === today ? 'today' : ''}`}>
              <div className="day-head">
                <div>
                  <div className="d">{fmt(date, { weekday: 'short' })}</div>
                  <div className="n">{fmt(date, { day: 'numeric' })}</div>
                </div>
                {wx && (
                  <div className="wx">
                    <Icon name={wx.sky} />
                    {wx.high}°
                  </div>
                )}
              </div>
              {plan && <div className="event">{plan.name}</div>}
              {slots ? (
                <Flatlay slots={slots} />
              ) : past ? (
                <div className="empty-day meta-line">Nothing logged</div>
              ) : (
                <button className="empty-day btn ghost" style={{ height: 'auto' }} onClick={() => setPicking(date)}>
                  <Icon name="plus" />
                  Plan
                </button>
              )}
              <div className="day-foot">
                {worn ? (
                  <span className="chip good">
                    <Icon name="check" />
                    Worn
                  </span>
                ) : plan ? (
                  <>
                    {date <= today ? (
                      <button className="btn xs" onClick={() => (st.wear(plan.slots, date), st.toast('Logged as worn'))}>
                        Wore it
                      </button>
                    ) : (
                      <button className="btn xs ghost" onClick={() => setPicking(date)}>
                        Change
                      </button>
                    )}
                    <button className="btn xs ghost" onClick={() => (st.setPlan(date, null), st.toast('Plan cleared'))}>
                      Clear
                    </button>
                  </>
                ) : (
                  <span>{date === today ? 'Today' : ''}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {picking && (
        <>
          <div className="backdrop" onClick={() => setPicking(null)} />
          <div className="modal-wrap">
            <div className="modal" role="dialog" aria-label="Plan an outfit">
              <button className="icon-btn close" onClick={() => setPicking(null)} aria-label="Close">
                <Icon name="x" />
              </button>
              <h2>Plan {fmt(picking, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
              <p className="lede">Pick a suggestion or one of your saved outfits.</p>
              <div className="picker">
                {[0, 1, 2].map((n) => {
                  const s = suggestFor(picking, n);
                  return s ? (
                    <button key={`s${n}`} onClick={() => (st.setPlan(picking, { name: s.title, slots: s.slots }), setPicking(null), st.toast('Planned'))}>
                      <Flatlay slots={s.slots} />
                      Suggestion {n + 1}
                    </button>
                  ) : null;
                })}
                {st.outfits.map((o) => (
                  <button key={o.id} onClick={() => (st.setPlan(picking, { name: o.name, slots: o.slots }), setPicking(null), st.toast('Planned'))}>
                    <Flatlay slots={o.slots} />
                    {o.name}
                  </button>
                ))}
              </div>
              {!st.outfits.length && (
                <p className="meta-line" style={{ marginTop: 12 }}>
                  Saved outfits from the <Link href={st.href('/builder')} className="link">builder</Link> appear here too.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
