/* A short confirmation that slides up from the bottom and fades away. */

import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/lib/store';
import { C, F } from '@/theme';
import { Icon } from './Icon';

export function Toast() {
  const { toastMsg } = useStore();
  const insets = useSafeAreaInsets();
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.set(withTiming(toastMsg ? 1 : 0, { duration: 200 }));
  }, [toastMsg, shown]);
  const style = useAnimatedStyle(() => ({ opacity: shown.get(), transform: [{ translateY: (1 - shown.get()) * 16 }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 92 }, style]} accessibilityLiveRegion="polite">
      <Icon name="check" size={17} color={C.white} width={2.2} />
      <Text style={styles.text} numberOfLines={2}>
        {toastMsg?.text ?? ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.ink,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  text: { color: C.white, fontFamily: F.medium, fontSize: 14, flex: 1 },
});
