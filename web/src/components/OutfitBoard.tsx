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
  const empty = !SLOTS.some((s) => slots[s]);

  const slotEl = (s: Slot) => {
    const [l, t, w] = LAYOUT[s];
    const it = slots[s] ? st.wearableById(slots[s]) : undefined;
    const focused = focus === s ? 'focused' : '';
    // Empty spots aren't drawn: the step tabs (or the closet filters) say what to add next.
    if (!it) return null;
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
      {empty ? <span className="board-empty">Your picks show up here</span> : SLOTS.map(slotEl)}
    </div>
  );
}
