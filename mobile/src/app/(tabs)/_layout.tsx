/* The three tabs from decision 005, as a native iOS and Android tab bar. */

import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { C } from '@/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={C.ink} labelStyle={{ selected: { color: C.ink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="wb_sunny" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>Closet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hanger" md="checkroom" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fill">
        <NativeTabs.Trigger.Label>Fill the gap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'lock.open', selected: 'lock.open.fill' }} md="lock_open" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
