/* A bottom sheet for short choices: sorting, picking a day, picking a saved outfit. */

import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, GUTTER } from '@/theme';
import { Icon } from './Icon';
import { T, tap } from './ui';

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grabber} />
        <T v="label" style={styles.title}>
          {title}
        </T>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: GUTTER }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** A sheet listing options, with a check by the current one. */
export function ChoiceSheet<V extends string>({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: [V, string, string?][];
  value?: V;
  onPick: (v: V) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {options.map(([v, label, hint]) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected: v === value }}
          onPress={() => {
            tap();
            onPick(v);
            onClose();
          }}
          style={({ pressed }) => [styles.option, pressed && { backgroundColor: C.panel2 }]}
        >
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: v === value ? F.semibold : F.medium, color: C.ink }}>{label}</T>
            {hint ? <T v="small">{hint}</T> : null}
          </View>
          {v === value && <Icon name="check" size={18} color={C.ink} width={2.2} />}
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,27,25,0.32)' },
  sheet: { backgroundColor: C.panel, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: C.line2, marginBottom: 10 },
  title: { paddingHorizontal: GUTTER, paddingBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
