'use client';

/* The flat-lay board with one spot per slot, shared by the outfit board in the closet and the day planner on Today. */

import { useState } from 'react';
import { SLOTS } from '@/lib/engine';
import { useStore } from '@/lib/store';
import type { OutfitSlots, Piece, Slot } from '@/lib/types';
import { useUI } from './Shell';
import { Art, Icon, LAYOUT, money } from './ui';

export const SLOT_LABEL: Record<Slot, string> = { outer: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', acc: 'Extra' };

export function OutfitBoard({
  slots,
  focus,
  onFocus,
  onRemove,
  onDrop,
}: {
  slots: OutfitSlots;
  focus?: Slot | null;
  onFocus: (slot: Slot) => void;
  onRemove: (slot: Slot) => void;
  onDrop?: (id: string) => void;
}) {
  const st = useStore();
  const ui = useUI();
  const [dragOver, setDragOver] = useState(false);
  const dressOn = st.wearableById(slots.top)?.cat === 'dress';

  const slotEl = (s: Slot) => {
    const [l, t, w] = LAYOUT[s];
    const it = slots[s] ? st.wearableById(slots[s]) : undefined;
    const focused = focus === s ? 'focused' : '';
    const box = { left: `${l + w * 0.18}%`, top: `${t + w * 0.18}%`, width: `${w * 0.64}%`, aspectRatio: '1' };
    if (s === 'bottom' && dressOn)
      return (
        <div key={s} className="slot empty" style={{ ...box, opacity: 0.6 }}>
          Dress covers this
        </div>
      );
    if (!it)
      return (
        <div key={s} className={`slot empty ${focused}`} role="button" tabIndex={0} onClick={() => onFocus(s)} onKeyDown={(e) => e.key === 'Enter' && onFocus(s)} style={box}>
          + {SLOT_LABEL[s]}
        </div>
      );
    const isTrial = !('wears' in it);
    const pos = it.cat === 'dress' ? [46, 4, 52] : [l, t, w];
    return (
      <div key={s} className={`slot ${focused} ${isTrial ? 'trial' : ''}`} role="button" tabIndex={0} aria-label={it.name} onClick={() => onFocus(s)} onKeyDown={(e) => e.key === 'Enter' && onFocus(s)} style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, width: `${pos[2]}%`, aspectRatio: '1' }}>
        <Art w={it} />
        <button className="slot-x" onClick={(e) => (e.stopPropagation(), onRemove(s))} aria-label={`Remove ${it.name}`}>
          <Icon name="x" />
        </button>
        {isTrial && (
          <div className="trial-tag">
            Not in your closet · from {money(Math.min(...(it as Piece).options.map((o) => o.price)))}
            <button className="btn" onClick={(e) => (e.stopPropagation(), ui.open({ type: 'compare', id: it.id }))}>
              Compare stores
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`board ${dragOver ? 'drag-over' : ''}`}
      onDragOver={onDrop ? (e) => (e.preventDefault(), setDragOver(true)) : undefined}
      onDragLeave={onDrop ? () => setDragOver(false) : undefined}
      onDrop={
        onDrop
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              onDrop(e.dataTransfer.getData('text/plain'));
            }
          : undefined
      }
    >
      {SLOTS.map(slotEl)}
    </div>
  );
}
