/* Which code this copy of the app is running, so it's clear what's being tested: the branch and commit its dev server
   or build was started from (app.config.js), whether that had changes not yet committed, and which dev server it
   came from (8081 is the usual one; a test copy runs on another port). The tag shows only while developing.
   An installed build also says which over-the-air update it's running (decision 023). */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { C } from '@/theme';
import { T } from './ui';

type Build = { branch: string | null; commit: string | null; committedAt: string | null; changed: boolean };

export const build: Build | undefined = Constants.expoConfig?.extra?.build;
export const version = Constants.expoConfig?.version ?? '';
export const server = Constants.expoConfig?.hostUri ?? null;
const port = server?.split(':')[1];

/** Expo Go, Rotation's own development build, or the app itself. */
export const runtime =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ? 'Expo Go' : __DEV__ ? 'Development build' : 'App';

const branch = build?.branch && build.branch !== 'HEAD' ? build.branch : null;

/** "feature/phone-links · 49fa0f9 + changes · port 8082" */
export function buildLabel() {
  if (!build?.commit) return null;
  return [branch, `${build.commit}${build.changed ? ' + changes' : ''}`, port && `port ${port}`].filter(Boolean).join(' · ');
}

/** In an installed build, its update channel and what it's running: "Update of Oct 10, 9:02 PM on preview", or
    "As built, on preview" before any update has arrived. Null while developing and in Expo Go. */
export function updateLabel() {
  if (!Updates.channel) return null;
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return `As built, on ${Updates.channel}`;
  return `Update of ${stamp(Updates.createdAt)} on ${Updates.channel}`;
}

const stamp = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** When the commit was made, e.g. "Oct 10, 8:41 PM". */
export const committedAt = build?.committedAt ? stamp(new Date(build.committedAt)) : null;

export function BuildTag({ style }: { style?: StyleProp<TextStyle> }) {
  const label = buildLabel();
  if (!__DEV__ || !label) return null;
  return (
    <T v="tiny" numberOfLines={1} style={[styles.tag, style]} accessibilityLabel={`Testing ${label}`}>
      {label}
    </T>
  );
}

const styles = StyleSheet.create({
  tag: { color: C.ink3, fontSize: 11 },
});
