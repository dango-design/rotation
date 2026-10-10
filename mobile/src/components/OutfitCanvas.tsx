/* The outfit canvas on a phone, built on the same layout model as the web canvas (@core/layout): pieces start at
   true-to-life sizes, and an arrangement is saved as x, y, width and stacking order in % of the canvas.
   Drag a piece to move it. Pinch anywhere on the canvas to resize the selected piece, so even earrings can be
   resized without covering them with two fingers. The tools under the canvas bring a piece forward or send it back,
   reset it to its true size, or remove it. Gestures run on the UI thread and only save when a finger lifts. */

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, type PinchGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { lowestPrice } from '@core/catalog';
import { ASPECT, MAX_W, MIN_W, resizeAround, resolveLayout, restack, stackOrder, trueWidth } from '@core/layout';
import type { Layout, OutfitSlots, Piece, PieceLayout, Slot, Wearable } from '@core/types';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';
import { Art, garmentShadow } from './Art';
import { useCarry } from './Carry';
import { Icon, type IconName } from './Icon';
import { money, T } from './ui';

type Live = Record<string, PieceLayout>;

/* Worklet copies of the layout rules, so they can run on the UI thread while a finger moves. */
const clampW = (w: number) => {
  'worklet';
  return Math.min(MAX_W, Math.max(MIN_W, w));
};
/** Keeps at least a fifth of a piece on the canvas, as on the web. */
const keepVisible = (p: PieceLayout): PieceLayout => {
  'worklet';
  const h = p.w / ASPECT;
  return { ...p, x: Math.min(100 - p.w * 0.2, Math.max(-p.w * 0.8, p.x)), y: Math.min(100 - h * 0.2, Math.max(-h * 0.8, p.y)) };
};

const bump = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export function OutfitCanvas({
  slots,
  layout,
  width,
  onLayout,
  onRemove,
  onSelect,
  onCompare,
  emptyHint = 'Tap a piece below to add it, or touch and hold one and drag it here.',
}: {
  slots: OutfitSlots;
  layout?: Layout;
  width: number;
  onLayout: (layout: Layout | undefined) => void;
  onRemove: (slot: Slot) => void;
  onSelect?: (slot: Slot) => void;
  /** Opens store options for a piece that isn't owned yet. */
  onCompare?: (id: string) => void;
  emptyHint?: string;
}) {
  const st = useStore();
  const carry = useCarry();
  const placed = resolveLayout(slots, layout, st.wearableById);
  const order = stackOrder(placed);
  const [picked, setPicked] = useState<Slot | null>(null);
  const selected = picked && slots[picked] ? picked : null;
  const height = width * ASPECT;

  // Where every piece is right now, in % of the canvas. Gestures write here; a lifted finger saves it.
  const live = useSharedValue<Live>(placed as Live);
  const sel = useSharedValue<string>('');
  const placedKey = JSON.stringify(placed);
  useEffect(() => {
    live.set(JSON.parse(placedKey));
  }, [placedKey, live]);
  useEffect(() => {
    sel.set(selected ?? '');
  }, [selected, sel]);

  const select = (s: Slot) => {
    setPicked(s);
    onSelect?.(s);
  };
  const commit = (s: string, p: PieceLayout) => onLayout({ ...placed, [s]: p });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      if (sel.get()) scheduleOnRN(bump);
    })
    .onChange((e) => {
      const s = sel.get();
      const cur = live.get()[s];
      if (!cur) return;
      const w = clampW(cur.w * e.scaleChange);
      const next = { ...cur, w, x: cur.x + (cur.w - w) / 2, y: cur.y + (cur.w - w) / ASPECT / 2 };
      live.set({ ...live.get(), [s]: next });
    })
    .onEnd(() => {
      const s = sel.get();
      const cur = live.get()[s];
      if (cur) scheduleOnRN(commit, s, cur);
    });

  const deselect = Gesture.Tap().onEnd((_e, ok) => {
    if (!ok) return;
    sel.set('');
    scheduleOnRN(setPicked, null);
  });

  // A worklet copies everything it reads to the UI thread. The carry context also holds the canvas's view, which
  // can't be copied, so the border reads only the shared value it needs.
  const noCarry = useSharedValue(0);
  const over = carry?.over ?? noCarry;
  const carryOver = useAnimatedStyle(() => ({ borderColor: over.get() ? C.gap : 'transparent' }));

  const sp = selected ? placed[selected] : undefined;
  const selItem = selected ? st.wearableById(slots[selected]) : undefined;
  const trial = selItem && !('wears' in selItem) ? (selItem as Piece) : undefined;

  return (
    <View style={{ width, gap: 10 }}>
      <GestureDetector gesture={pinch}>
        <Animated.View ref={carry?.canvasRef} collapsable={false} style={[styles.board, { width, height }, carryOver]} accessibilityLabel="Outfit canvas">
          <GestureDetector gesture={deselect}>
            <View style={StyleSheet.absoluteFill}>
              {order.length === 0 && (
                <View style={styles.empty}>
                  <T v="small" style={{ textAlign: 'center' }}>
                    {emptyHint}
                  </T>
                </View>
              )}
            </View>
          </GestureDetector>
          {order.map((s) => {
            const w = st.wearableById(slots[s]);
            return w ? <CanvasPiece key={s} slot={s} w={w} z={placed[s]!.z} selected={selected === s} canvas={{ width, height }} live={live} sel={sel} pinch={pinch} onSelect={select} onCommit={commit} /> : null;
          })}
        </Animated.View>
      </GestureDetector>

      {selected && sp ? (
        <View style={styles.tools}>
          {trial ? (
            <Pressable style={styles.trial} onPress={() => onCompare?.(trial.id)} accessibilityRole="button">
              <T v="tiny" style={{ color: C.white, fontFamily: F.semibold }} numberOfLines={1}>
                Not in your closet · from {money(lowestPrice(trial))}
              </T>
              {onCompare && <T v="tiny" style={{ color: C.white, textDecorationLine: 'underline', fontFamily: F.semibold }}>Compare</T>}
            </Pressable>
          ) : (
            <T v="small" style={{ flex: 1, color: C.ink2 }} numberOfLines={1}>
              {selItem?.name}
            </T>
          )}
          <Tool icon="forward" label="Bring forward" disabled={selected === order[order.length - 1]} onPress={() => onLayout(restack(placed, selected, 'forward'))} />
          <Tool icon="backward" label="Send backward" disabled={selected === order[0]} onPress={() => onLayout(restack(placed, selected, 'backward'))} />
          <Tool icon="ruler" label="True-to-life size" onPress={() => onLayout({ ...placed, [selected]: resizeAround(sp, trueWidth(selItem!.type)) })} />
          <Tool
            icon="trash"
            label="Remove from outfit"
            onPress={() => {
              onRemove(selected);
              setPicked(null);
            }}
          />
        </View>
      ) : (
        <View style={styles.tools}>
          <T v="tiny" style={{ flex: 1 }}>
            {order.length ? 'Drag to move. Select a piece, then pinch to resize it.' : ' '}
          </T>
          {layout && order.length > 0 && (
            <Pressable onPress={() => onLayout(undefined)} hitSlop={8} accessibilityRole="button" accessibilityHint="Puts every piece back at its true size and spot">
              <T v="tiny" style={{ color: C.ink, fontFamily: F.semibold }}>
                Tidy up
              </T>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function CanvasPiece({
  slot,
  w,
  z,
  selected,
  canvas,
  live,
  sel,
  pinch,
  onSelect,
  onCommit,
}: {
  slot: Slot;
  w: Wearable;
  z: number;
  selected: boolean;
  canvas: { width: number; height: number };
  live: SharedValue<Live>;
  sel: SharedValue<string>;
  pinch: PinchGesture;
  onSelect: (s: Slot) => void;
  onCommit: (s: string, p: PieceLayout) => void;
}) {
  const lift = useSharedValue(0);
  const { width: W, height: H } = canvas;
  const trial = !('wears' in w);

  const pan = Gesture.Pan()
    .averageTouches(true)
    .minDistance(2)
    .simultaneousWithExternalGesture(pinch)
    .onBegin(() => {
      sel.set(slot);
      scheduleOnRN(onSelect, slot);
    })
    .onStart(() => {
      lift.set(withSpring(1, { damping: 16, stiffness: 280 }));
      scheduleOnRN(bump);
    })
    .onChange((e) => {
      const cur = live.get()[slot];
      if (!cur) return;
      live.set({ ...live.get(), [slot]: keepVisible({ ...cur, x: cur.x + (e.changeX / W) * 100, y: cur.y + (e.changeY / H) * 100 }) });
    })
    .onEnd(() => {
      const cur = live.get()[slot];
      if (cur) scheduleOnRN(onCommit, slot, cur);
    })
    .onFinalize(() => {
      lift.set(withSpring(0, { damping: 18, stiffness: 260 }));
    });

  const style = useAnimatedStyle(() => {
    const p = live.get()[slot];
    if (!p) return { opacity: 0 };
    const size = (p.w / 100) * W;
    return {
      width: size,
      height: size,
      opacity: 1,
      transform: [{ translateX: (p.x / 100) * W }, { translateY: (p.y / 100) * H }, { scale: 1 + 0.05 * lift.get() }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.piece, { zIndex: z + 1 }, style]} accessible accessibilityRole="button" accessibilityLabel={w.name} accessibilityState={{ selected }}>
        <View style={[StyleSheet.absoluteFill, garmentShadow(1.2)]}>
          <Art w={w} />
        </View>
        {(selected || trial) && <View pointerEvents="none" style={[styles.outline, trial && styles.trialOutline, selected && { borderStyle: 'solid' }]} />}
      </Animated.View>
    </GestureDetector>
  );
}

function Tool({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={4}
      onPress={() => {
        bump();
        onPress();
      }}
      style={({ pressed }) => [styles.tool, pressed && { backgroundColor: C.tile2 }, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={18} color={C.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  board: { backgroundColor: C.tile, borderRadius: R.card, overflow: 'hidden', borderWidth: 2.5, borderColor: 'transparent' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  piece: { position: 'absolute', left: 0, top: 0 },
  outline: { position: 'absolute', left: -2, top: -2, right: -2, bottom: -2, borderWidth: 1.5, borderColor: C.gap, borderRadius: 4 },
  trialOutline: { borderStyle: 'dashed', backgroundColor: 'rgba(234,239,247,0.35)' },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38 },
  tool: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  trial: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 32, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.gap },
});
