'use client';

/* Planning (or logging) one day's outfit piece by piece: pick a top, then what goes with it.
   Each step lists your pieces for that slot, suggests the two that fit best, and fades the ones that clash. */

import { useState } from 'react';
import { check, isComplete, SLOTS } from '@/lib/engine';
import { nextStep, piecesFor, STEPS } from '@/lib/planning';
import { useStore } from '@/lib/store';
import type { OutfitSlots, Slot } from '@/lib/types';
import { OutfitBoard } from './OutfitBoard';
import { Icon, Tile } from './ui';

export function DayPlanner({
  date,
  dayLabel,
  mode,
  initial,
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
  initialName: string;
  weather?: { temp: number; word: string };
  /** A suggested outfit for the day, or null when there is none to offer. */
  surprise: (n: number) => OutfitSlots | null;
  onDone: (name: string, slots: OutfitSlots) => void;
  onCancel: () => void;
}) {
  const st = useStore();
  const [slots, setSlots] = useState<OutfitSlots>(initial ?? {});
  const [name, setName] = useState(initialName);
  const [step, setStep] = useState<Slot>(() => nextStep(initial ?? {}, st.wearableById) ?? 'top');
  const [surprises, setSurprises] = useState(0);

  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  const complete = isComplete(slots, st.wearableById);
  const verdict = check(pieces);
  const ready = complete && verdict.ok;
  const rows = piecesFor(step, slots, st.items, st.wearableById, { occasion: st.settings.occasion, today: date });
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
    setStep(s);
  };
  const surpriseMe = () => {
    const s = surprise(surprises);
    if (!s) return;
    setSlots(s);
    setSurprises((n) => n + 1);
    setStep(nextStep(s, st.wearableById) ?? 'top');
  };
  const after = nextStep(slots, st.wearableById, step);

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
          <OutfitBoard slots={slots} focus={step} onFocus={setStep} onRemove={remove} />
          <div className="board-status">
            {!complete ? (
              <span className="verdict empty">
                <Icon name="info" />
                {dress ? 'Add shoes to finish the outfit' : 'Pick a top, a bottom and shoes'}
              </span>
            ) : verdict.ok ? (
              <span className="verdict ok">
                <Icon name="check" />
                These work together
              </span>
            ) : (
              <span className="verdict bad">
                <Icon name="alert" />
                {verdict.reason}
              </span>
            )}
          </div>
        </div>

        <div className="planner-steps">
          <div className="step-tabs" role="tablist" aria-label="Pieces">
            {STEPS.map((s) => {
              const covered = s.slot === 'bottom' && dress;
              return (
                <button key={s.slot} role="tab" aria-selected={step === s.slot} className={`${step === s.slot ? 'active' : ''} ${slots[s.slot] || covered ? 'done' : ''}`} onClick={() => setStep(s.slot)} disabled={covered}>
                  {slots[s.slot] || covered ? <Icon name="check" /> : null}
                  {s.label}
                  {s.optional && !slots[s.slot] ? <small>optional</small> : null}
                </button>
              );
            })}
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
            <p className="empty-note">No {current.label.toLowerCase()} pieces in your closet yet.</p>
          )}
          <div className="planner-foot">
            {current.optional && !slots[step] && after && after !== step && (
              <button className="btn ghost sm" onClick={() => setStep(after)}>
                Skip
              </button>
            )}
            <span className="spacer" />
            <button className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn primary" disabled={!ready} onClick={() => onDone(name.trim() || 'Planned outfit', slots)}>
              <Icon name={mode === 'log' ? 'check' : 'planner'} />
              {mode === 'log' ? 'Log as worn' : `Plan for ${dayLabel}`}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
