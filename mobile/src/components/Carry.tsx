/* Carrying a piece from a tray onto the canvas. Touch and hold a piece in the tray, then drag it: it lifts out
   with a little haptic bump, follows your finger, and lands on the canvas where you let go. A quick tap still
   puts it on the canvas in its usual spot. Everything that follows the finger runs on the UI thread. */

import * as Haptics from 'expo-haptics';
import { createContext, useContext, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Item, Piece } from '@core/types';
import { Art, garmentShadow } from './Art';

type Rect = { x: number; y: number; w: number; h: number };

interface CarryCtx {
  canvasRef: React.RefObject<View | null>;
  /** 1 while a carried piece is over the canvas. */
  over: SharedValue<number>;
  rect: SharedValue<Rect>;
  x: SharedValue<number>;
  y: SharedValue<number>;
  begin: (w: Item | Piece) => void;
  drop: (id: string, at: { x: number; y: number }) => void;
  end: () => void;
}

const Ctx = createContext<CarryCtx | null>(null);
export const useCarry = () => useContext(Ctx);

const GHOST = 92;

export function CarryProvider({ onDrop, children, style }: { onDrop: (id: string, at: { x: number; y: number }) => void; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const rootRef = useRef<View>(null);
  const canvasRef = useRef<View>(null);
  const [carried, setCarried] = useState<Item | Piece | null>(null);
  const over = useSharedValue(0);
  const active = useSharedValue(0);
  const rect = useSharedValue<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const origin = useSharedValue({ x: 0, y: 0 });
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const begin = (w: Item | Piece) => {
    setCarried(w);
    active.set(withSpring(1, { damping: 18, stiffness: 260 }));
    rootRef.current?.measureInWindow((ox, oy) => origin.set({ x: ox, y: oy }));
    canvasRef.current?.measureInWindow((cx, cy, cw, ch) => rect.set({ x: cx, y: cy, w: cw, h: ch }));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  const drop = (id: string, at: { x: number; y: number }) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDrop(id, at);
  };
  const end = () => {
    active.set(withTiming(0, { duration: 140 }));
    over.set(0);
    setTimeout(() => setCarried(null), 150);
  };

  const ghost = useAnimatedStyle(() => ({
    opacity: active.get(),
    transform: [
      { translateX: x.get() - origin.get().x - GHOST / 2 },
      { translateY: y.get() - origin.get().y - GHOST / 2 },
      { scale: 0.8 + 0.25 * active.get() + 0.1 * over.get() },
    ],
  }));

  return (
    <Ctx.Provider value={{ canvasRef, over, rect, x, y, begin, drop, end }}>
      <View ref={rootRef} style={[{ flex: 1 }, style]} collapsable={false}>
        {children}
        <Animated.View pointerEvents="none" style={[styles.ghost, garmentShadow(1.6), ghost]}>
          {carried && <Art w={carried} />}
        </Animated.View>
      </View>
    </Ctx.Provider>
  );
}

/** A tray piece: tap to put it on the canvas, or touch and hold to carry it there. */
export function CarryTile({
  w,
  onTap,
  children,
  style,
  accessibilityLabel,
}: {
  w: Item | Piece;
  onTap: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const carry = useCarry();
  const lifting = useSharedValue(0);
  const dim = useAnimatedStyle(() => ({ opacity: lifting.get() ? 0.3 : 1 }));
  if (!carry) {
    return (
      <Pressable onPress={onTap} style={style} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </Pressable>
    );
  }
  const { over, rect, x, y, begin, drop, end } = carry;
  const id = w.id;
  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd((_e, ok) => {
      if (ok) scheduleOnRN(onTap);
    });
  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart((e) => {
      lifting.set(1);
      x.set(e.absoluteX);
      y.set(e.absoluteY);
      scheduleOnRN(begin, w);
    })
    .onUpdate((e) => {
      x.set(e.absoluteX);
      y.set(e.absoluteY);
      const r = rect.get();
      over.set(e.absoluteX >= r.x && e.absoluteX <= r.x + r.w && e.absoluteY >= r.y && e.absoluteY <= r.y + r.h ? 1 : 0);
    })
    .onEnd(() => {
      const r = rect.get();
      if (over.get() && r.w > 0) scheduleOnRN(drop, id, { x: ((x.get() - r.x) / r.w) * 100, y: ((y.get() - r.y) / r.h) * 100 });
    })
    .onFinalize(() => {
      if (lifting.get()) scheduleOnRN(end);
      lifting.set(0);
    });
  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View style={[style, dim]} accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint="Touch and hold to drag it onto the canvas">
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  ghost: { position: 'absolute', left: 0, top: 0, width: GHOST, height: GHOST, zIndex: 100 },
});
