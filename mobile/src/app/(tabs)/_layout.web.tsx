/* The browser preview of the phone app: the same three tabs, drawn as a phone-style bar at the bottom. */

import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { C, F } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={styles.bar}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="today" label="Today" />
          </TabTrigger>
          <TabTrigger name="closet" href="/closet" asChild>
            <TabButton icon="closet" label="Closet" />
          </TabTrigger>
          <TabTrigger name="fill" href="/fill" asChild>
            <TabButton icon="unlock" label="Fill the gap" />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ icon, label, isFocused, ...props }: TabTriggerSlotProps & { icon: IconName; label: string }) {
  const color = isFocused ? C.ink : C.ink3;
  return (
    <Pressable {...props} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: isFocused }}>
      <Icon name={icon} size={23} color={color} width={isFocused ? 2 : 1.7} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 22,
    backgroundColor: 'rgba(251,250,247,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line2,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: F.semibold, fontSize: 10.5 },
});
