/* A tab's scrolling page: safe-area aware, with room for the tab bar and the demo banner on top. */

import { Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/lib/store';
import { C, F, GUTTER } from '@/theme';
import { T } from './ui';

export function Screen({ children, ...rest }: ScrollViewProps & { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...rest}
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 96 : 110), paddingHorizontal: GUTTER, gap: 18 }}
      keyboardShouldPersistTaps="handled"
    >
      <DemoBanner />
      {children}
    </ScrollView>
  );
}

export function DemoBanner() {
  const st = useStore();
  if (!st.demo) return null;
  return (
    <View style={styles.banner}>
      <T v="small" style={{ color: C.note, flex: 1 }}>
        <T v="small" style={{ color: C.note, fontFamily: F.semibold }}>
          {"You're exploring Jordan's demo closet. "}
        </T>
        {"Changes here aren't saved."}
      </T>
      <Pressable accessibilityRole="button" onPress={st.leaveDemo} hitSlop={8}>
        <T v="small" style={{ color: C.note, fontFamily: F.semibold, textDecorationLine: 'underline' }}>
          Leave demo
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: C.noteTint },
});
