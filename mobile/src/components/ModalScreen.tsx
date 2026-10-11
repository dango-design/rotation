/* A screen that slides up over the tabs: a close button, an eyebrow, and scrolling content. */

import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, GUTTER } from '@/theme';
import { BuildTag } from './BuildTag';
import { IconBtn, T } from './ui';

export function ModalScreen({ eyebrow, children, onClose }: { eyebrow?: string; children: React.ReactNode; onClose?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // iOS page sheets start below the status bar; elsewhere these screens fill the window.
  const top = Platform.OS === 'ios' ? 14 : insets.top + 10;
  const close = onClose ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: top }]}>
        <T v="eyebrow" style={{ flex: 1 }}>
          {eyebrow ?? ''}
        </T>
        <IconBtn icon="x" label="Close" size={36} onPress={close} />
      </View>
      <BuildTag style={styles.tag} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 16 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, paddingBottom: 8 },
  tag: { paddingHorizontal: GUTTER, marginTop: -6, marginBottom: 8 },
});
