'use client';

/* The outfit canvas, shared by the day planner on Today and the outfit board in the closet.
   It works like a design canvas: drag a piece to move it, drag a corner to resize it, and bring it forward or send it
   back. Pieces start at true-to-life sizes. Keyboard: arrows nudge (Shift for bigger steps), ] and [ move a piece up
   and down the stack (with ⌘ or Ctrl, all the way), Delete removes it, Escape deselects. */

import { useRef, useState } from 'react';
import { deliverImage, renderOutfitImage } from '@/lib/export-image';
import { ASPECT, clampW, heightOf, keepVisible, resizeAround, resolveLayout, restack, stackOrder, trueWidth } from '@/lib/layout';
import { useStore } from '@/lib/store';
import type { Background, Layout, OutfitSlots, Piece, PieceLayout, Slot } from '@/lib/types';
import { useUI } from './Shell';
import { Art, BackgroundPicker, boardProps, Icon, money, useBackground } from './ui';

export const SLOT_LABEL: Record<Slot, string> = { outer: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', bag: 'Bag', jewelry: 'Jewelry', acc: 'Accessory' };

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const CORNERS: Exclude<Handle, 'move'>[] = ['nw', 'ne', 'sw', 'se'];

export function OutfitBoard({
  slots,
  layout,
  bg,
  onLayout,
  onBg,
  onRemove,
  onSelect,
  onDrop,
}: {
  slots: OutfitSlots;
  layout?: Layout;
  /** This outfit's background; unset means the default from Settings. */
  bg?: Background;
  onLayout: (layout: Layout | undefined) => void;
  onBg: (bg: Background) => void;
  onRemove: (slot: Slot) => void;
  onSelect?: (slot: Slot) => void;
  /** A piece dragged in from the closet, with where it was dropped (in % of the canvas). */
  onDrop?: (id: string, at: { x: number; y: number }) => void;
}) {
  const st = useStore();
  const ui = useUI();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ slot: Slot; handle: Handle; x: number; y: number; from: PieceLayout; moved: boolean } | null>(null);
  const [live, setLive] = useState<Layout | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const background = useBackground(bg);

  const placed = live ?? resolveLayout(slots, layout, st.wearableById);
  const order = stackOrder(placed);
  const selected = picked && slots[picked] ? picked : null;

  const select = (s: Slot) => {
    setPicked(s);
    onSelect?.(s);
  };
  const change = (s: Slot, p: PieceLayout) => onLayout({ ...placed, [s]: p });

  const start = (e: React.PointerEvent, slot: Slot, handle: Handle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    select(slot);
    ref.current?.focus({ preventScroll: true });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { slot, handle, x: e.clientX, y: e.clientY, from: placed[slot]!, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = ref.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = ((e.clientX - d.x) / box.width) * 100;
    const dy = ((e.clientY - d.y) / box.height) * 100;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 0.6) return;
    d.moved = true;
    const f = d.from;
    let next: PieceLayout;
    if (d.handle === 'move') next = keepVisible({ ...f, x: f.x + dx, y: f.y + dy });
    else {
      // Pieces stay square: grow by whichever way the corner moved further, keeping the opposite corner put.
      const sx = d.handle.includes('e') ? 1 : -1;
      const sy = d.handle.includes('s') ? 1 : -1;
      const w = clampW(f.w + Math.max(sx * dx, sy * dy * ASPECT));
      next = { ...f, w, x: sx > 0 ? f.x : f.x + f.w - w, y: sy > 0 ? f.y : f.y + heightOf(f.w) - heightOf(w) };
    }
    setLive({ ...placed, [d.slot]: next });
  };
  const end = () => {
    if (drag.current?.moved && live) onLayout(live);
    drag.current = null;
    setLive(null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const p = placed[selected]!;
    const step = e.shiftKey ? 5 : 1;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) {
      e.preventDefault();
      change(selected, keepVisible({ ...p, x: p.x + arrows[e.key][0], y: p.y + arrows[e.key][1] }));
    } else if (e.key === ']' || e.key === '[') {
      e.preventDefault();
      const all = e.metaKey || e.ctrlKey;
      onLayout(restack(placed, selected, e.key === ']' ? (all ? 'front' : 'forward') : all ? 'back' : 'backward'));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRemove(selected);
      setPicked(null);
    } else if (e.key === 'Escape') setPicked(null);
  };

  const empty = order.length === 0;
  const sel = selected ? placed[selected] : undefined;
  const top = order[order.length - 1];
  const bottom = order[0];

  return (
    <div
      ref={ref}
      className={`board canvas ${dragOver ? 'drag-over' : ''}`}
      {...boardProps(background)}
      tabIndex={empty ? -1 : 0}
      aria-label="Outfit canvas. Select a piece, then use the arrow keys to move it."
      onKeyDown={onKey}
      onPointerDown={() => setPicked(null)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDragOver={onDrop ? (e) => (e.preventDefault(), setDragOver(true)) : undefined}
      onDragLeave={onDrop ? () => setDragOver(false) : undefined}
      onDrop={
        onDrop
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              const box = ref.current!.getBoundingClientRect();
              onDrop(e.dataTransfer.getData('text/plain'), { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 });
            }
          : undefined
      }
    >
      {empty && <span className="board-empty">Your picks show up here</span>}
      {order.map((s) => {
        const it = st.wearableById(slots[s])!;
        const p = placed[s]!;
        const trial = !('wears' in it);
        return (
          <div
            key={s}
            className={`canvas-piece ${selected === s ? 'selected' : ''} ${trial ? 'trial' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z }}
            role="button"
            tabIndex={-1}
            aria-label={it.name}
            aria-pressed={selected === s}
            onPointerDown={(e) => start(e, s, 'move')}
          >
            <Art w={it} />
            {selected === s && CORNERS.map((c) => <span key={c} className={`handle ${c}`} onPointerDown={(e) => start(e, s, c)} aria-hidden="true" />)}
            {trial && (
              <div className="trial-tag" onPointerDown={(e) => e.stopPropagation()}>
                Not in your closet · from {money(Math.min(...(it as Piece).options.map((o) => o.price)))}
                <button className="btn" onClick={() => ui.open({ type: 'compare', id: it.id })}>
                  Compare stores
                </button>
              </div>
            )}
          </div>
        );
      })}

      {selected && sel && !live && (
        <div
          className={`canvas-tools ${sel.y < 12 ? 'below' : ''}`}
          style={{ left: `${Math.min(Math.max(sel.x + sel.w / 2, 18), 82)}%`, top: sel.y < 12 ? `${sel.y + heightOf(sel.w)}%` : `${sel.y}%` }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button onClick={() => onLayout(restack(placed, selected, 'forward'))} disabled={selected === top} title="Bring forward  ]" aria-label="Bring forward">
            <Icon name="forward" />
          </button>
          <button onClick={() => onLayout(restack(placed, selected, 'backward'))} disabled={selected === bottom} title="Send backward  [" aria-label="Send backward">
            <Icon name="backward" />
          </button>
          <button onClick={() => change(selected, resizeAround(sel, trueWidth(st.wearableById(slots[selected])!.type)))} title="True-to-life size" aria-label="True-to-life size">
            <Icon name="ruler" />
          </button>
          <button onClick={() => (onRemove(selected), setPicked(null))} title="Remove  Delete" aria-label="Remove from outfit">
            <Icon name="trash" />
          </button>
        </div>
      )}

      <div className="canvas-corner">
        <BackgroundPicker value={background} onChange={onBg} />
        {layout && !empty && (
          <button className="canvas-tidy" onPointerDown={(e) => e.stopPropagation()} onClick={() => (onLayout(undefined), setPicked(null))} title="Put every piece back at its true size and spot">
            Tidy up
          </button>
        )}
      </div>
    </div>
  );
}

/** Saves the outfit as a phone-sized picture of the canvas, exactly as arranged. */
export function ExportOutfit({ slots, layout, bg, name, className = 'btn' }: { slots: OutfitSlots; layout?: Layout; bg?: Background; name: string; className?: string }) {
  const st = useStore();
  const background = useBackground(bg);
  const [busy, setBusy] = useState(false);
  const empty = !Object.values(slots).some((id) => st.wearableById(id));
  const go = async () => {
    setBusy(true);
    try {
      const blob = await renderOutfitImage({ slots, layout, byId: st.wearableById, imageFor: st.imageFor, bg: background });
      const how = await deliverImage(blob, name);
      if (how === 'downloaded') st.toast('Image saved to your downloads');
    } catch {
      st.toast("Couldn't make the image. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className={className} disabled={empty || busy} onClick={go} title="Save as an image sized for your phone">
      <Icon name="upload" />
      {busy ? 'Exporting…' : 'Export image'}
    </button>
  );
}
