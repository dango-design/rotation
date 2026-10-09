'use client';

/* Planning (or logging) one day's outfit piece by piece: pick a top, then what goes with it.
   Each step lists your pieces for that slot, suggests the two that fit best, and fades the ones that clash. */

import { useState } from 'react';
import { SLOTS } from '@/lib/engine';
import { nextStep, piecesFor, STEPS, type StepPiece } from '@/lib/planning';
import { useStore } from '@/lib/store';
import type { Layout, OutfitSlots, Settings, Slot } from '@/lib/types';
import { OutfitBoard } from './OutfitBoard';
import { Icon, Tile } from './ui';

/** Ways to sort a step's pieces. Suggested keeps the planner's own order; the rest are plain sorts. */
const SORTS: Record<string, [string, ((a: StepPiece, b: StepPiece) => number) | null]> = {
  suggested: ['Suggested', null],
  least: ['Least worn', (a, b) => a.item.wears - b.item.wears],
  most: ['Most worn', (a, b) => b.item.wears - a.item.wears],
  recent: ['Recently added', (a, b) => b.item.createdAt.localeCompare(a.item.createdAt)],
  name: ['Name', (a, b) => a.item.name.localeCompare(b.item.name)],
};

const OCCASIONS: [Settings['occasion'], string][] = [
  ['casual', 'Casual'],
  ['work', 'Work'],
  ['dressy', 'Dressy'],
];

export function DayPlanner({
  date,
  dayLabel,
  mode,
  initial,
  initialLayout,
  initialName,
  weather,
  surprise,
  onDone,
  onCancel,
}: {
  date: string;
  /** "today" or "Sunday, Oct 11". */
  dayLabel: string;
  mode: 'plan' | 'log';
  initial?: OutfitSlots;
  initialLayout?: Layout;
  initialName: string;
  weather?: { temp: number; word: string };
  /** A suggested outfit for the day, or null when there is none to offer. */
  surprise: (n: number, occasion: Settings['occasion']) => OutfitSlots | null;
  onDone: (name: string, slots: OutfitSlots, layout?: Layout) => void;
  onCancel: () => void;
}) {
  const st = useStore();
  const [slots, setSlots] = useState<OutfitSlots>(initial ?? {});
  const [layout, setLayout] = useState<Layout | undefined>(initialLayout);
  const [name, setName] = useState(initialName);
  const [step, setStep] = useState<Slot>(() => nextStep(initial ?? {}, st.wearableById) ?? 'top');
  const [surprises, setSurprises] = useState(0);
  const [occasion, setOccasion] = useState(st.settings.occasion);
  const [sort, setSort] = useState('suggested');

  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  // Any one piece is an outfit worth planning or logging; clashing pieces are only faded as a hint.
  const ready = pieces.length > 0;
  const suggestedOrder = piecesFor(step, slots, st.items, st.wearableById, { occasion, today: date, temp: weather?.temp });
  const by = SORTS[sort][1];
  const rows = by ? [...suggestedOrder].sort(by) : suggestedOrder;
  const dress = st.wearableById(slots.top)?.cat === 'dress';
  const current = STEPS.find((s) => s.slot === step)!;

  const pick = (id: string) => {
    const it = st.itemById(id);
    if (!it) return;
    const next = { ...slots };
    if (next[step] === id) delete next[step];
    else {
      next[step] = id;
      if (it.cat === 'dress') delete next.bottom;
    }
    setSlots(next);
    if (next[step] === id) setStep(nextStep(next, st.wearableById, step) ?? step);
  };
  const remove = (s: Slot) => {
    const next = { ...slots };
    delete next[s];
    setSlots(next);
    if (layout?.[s]) {
      const rest = { ...layout };
      delete rest[s];
      setLayout(rest);
    }
    setStep(s);
  };

  const surpriseMe = () => {
    const s = surprise(surprises, occasion);
    if (!s) return;
    setSlots(s);
    setLayout(undefined);
    setSurprises((n) => n + 1);
    setStep(nextStep(s, st.wearableById) ?? 'top');
  };
  // Every step can be skipped; Skip moves on to the next one in order.
  const following = STEPS[STEPS.findIndex((s) => s.slot === step) + 1]?.slot;

  const stepHint =
    step === 'outer' && weather
      ? weather.temp >= 66
        ? `${weather.temp}° and ${weather.word}: warm enough to skip a layer.`
        : `${weather.temp}° and ${weather.word}: a layer will help.`
      : step === 'top' && !pieces.length
        ? 'Start with what you feel like wearing. Rotation suggests what goes with it.'
        : null;

  return (
    <article className="card day-planner" aria-label={mode === 'log' ? `Log ${dayLabel}` : `Plan ${dayLabel}`}>
      <div className="planner-head">
        <div>
          <div className="eyebrow">{mode === 'log' ? `Logging ${dayLabel}` : `Planning ${dayLabel}`}</div>
          <input className="outfit-name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Outfit name" />
          {mode === 'plan' && (
            <div className="seg occasion-seg" role="group" aria-label="Occasion">
              {OCCASIONS.map(([v, l]) => (
                <button
                  key={v}
                  className={occasion === v ? 'active' : ''}
                  // Remembered as the default for the next day planned.
                  onClick={() => (setOccasion(v), st.updateSettings({ occasion: v }))}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="head-actions">
          {mode === 'plan' && (
            <button className="btn sm" onClick={surpriseMe}>
              <Icon name="shuffle" />
              Surprise me
            </button>
          )}
          <button className="icon-btn" onClick={onCancel} aria-label="Cancel">
            <Icon name="x" />
          </button>
        </div>
      </div>

      <div className="planner-body">
        <div className="planner-board">
          <OutfitBoard slots={slots} layout={layout} onLayout={setLayout} onRemove={remove} onSelect={setStep} />
        </div>

        <div className="planner-steps">
          <div className="step-toolbar">
            <div className="step-tabs" role="tablist" aria-label="Pieces">
              {STEPS.map((s) => {
                const covered = s.slot === 'bottom' && dress;
                return (
                  <button key={s.slot} role="tab" aria-selected={step === s.slot} className={`${step === s.slot ? 'active' : ''} ${slots[s.slot] || covered ? 'done' : ''}`} onClick={() => setStep(s.slot)} disabled={covered}>
                    {slots[s.slot] || covered ? <Icon name="check" /> : null}
                    {s.label}
                  </button>
                );
              })}
            </div>
            <select className="select step-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort pieces">
              {Object.entries(SORTS).map(([k, [label]]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {stepHint && <p className="step-hint">{stepHint}</p>}
          {rows.length ? (
            <div className="step-grid">
              {rows.map(({ item, fits, suggested, why }) => (
                <button key={item.id} className={`step-piece ${slots[step] === item.id ? 'on' : ''} ${fits ? '' : 'faded'}`} onClick={() => pick(item.id)} title={fits ? item.name : `${item.name} doesn't go with the rest`}>
                  {suggested && (
                    <span className="suggest-badge">
                      <Icon name="builder" />
                      Suggested
                    </span>
                  )}
                  <Tile w={item} />
                  <span className="step-name">{item.name}</span>
                  <span className="step-why">{why ?? item.brand}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-note">No {current.plural} in your closet yet.</p>
          )}
          <div className="planner-foot">
            {!slots[step] && following && (
              <button className="btn ghost sm" onClick={() => setStep(following)}>
                Skip
              </button>
            )}
            <span className="spacer" />
            <button className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn primary" disabled={!ready} onClick={() => onDone(name.trim() || 'Planned outfit', slots, layout)}>
              <Icon name={mode === 'log' ? 'check' : 'planner'} />
              {mode === 'log' ? 'Log as worn' : `Plan for ${dayLabel}`}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
