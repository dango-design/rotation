/* Shared building blocks: type, buttons, chips, cards and segmented controls in Rotation's style. */

import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Switch, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { C, F, R, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

type Variant = 'body' | 'small' | 'tiny' | 'label' | 'eyebrow' | 'h1' | 'h2' | 'h3' | 'num';

const TEXT: Record<Variant, TextStyle> = {
  body: { fontFamily: F.sans, fontSize: 15, lineHeight: 21, color: C.ink2 },
  small: { fontFamily: F.sans, fontSize: 13, lineHeight: 18, color: C.ink3 },
  tiny: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 15, color: C.ink3 },
  label: { fontFamily: F.semibold, fontSize: 14, lineHeight: 19, color: C.ink },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: C.ink3 },
  h1: { fontFamily: F.serif, fontSize: 40, lineHeight: 42, letterSpacing: -0.5, color: C.ink },
  h2: { fontFamily: F.serif, fontSize: 30, lineHeight: 33, color: C.ink },
  h3: { fontFamily: F.serif, fontSize: 24, lineHeight: 27, color: C.ink },
  num: { fontFamily: F.serif, fontSize: 56, lineHeight: 54, letterSpacing: -1, color: C.ink },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[TEXT[v], style]} />;
}

type BtnKind = 'default' | 'primary' | 'ghost' | 'gap' | 'white' | 'danger';

export function Btn({
  label,
  icon,
  kind = 'default',
  size = 'md',
  onPress,
  disabled,
  style,
  grow,
}: {
  label: string;
  icon?: IconName;
  kind?: BtnKind;
  size?: 'md' | 'sm' | 'xs';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  grow?: boolean;
}) {
  const palette = BTN[kind];
  const h = size === 'md' ? 44 : size === 'sm' ? 34 : 28;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { height: h, paddingHorizontal: size === 'md' ? 18 : size === 'sm' ? 13 : 10, backgroundColor: palette.bg, borderColor: palette.border },
        grow && { flex: 1 },
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={size === 'md' ? 17 : 15} color={palette.fg} />}
      <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: size === 'md' ? 14.5 : size === 'sm' ? 13 : 12, color: palette.fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const BTN: Record<BtnKind, { bg: string; border: string; fg: string }> = {
  default: { bg: C.panel, border: C.line2, fg: C.ink },
  primary: { bg: C.ink, border: C.ink, fg: C.white },
  ghost: { bg: 'transparent', border: 'transparent', fg: C.ink },
  gap: { bg: C.gap, border: C.gap, fg: C.white },
  white: { bg: C.white, border: C.white, fg: C.gapInk },
  danger: { bg: C.panel, border: C.warn, fg: C.warn },
};

export function IconBtn({ icon, label, onPress, size = 40, color = C.ink, bg = C.panel, badge, disabled }: { icon: IconName; label: string; onPress: () => void; size?: number; color?: string; bg?: string; badge?: number; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, { width: size, height: size, backgroundColor: bg }, pressed && { opacity: 0.7 }, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={size * 0.48} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, icon, tone = 'default', style }: { label: string; icon?: IconName; tone?: 'default' | 'good' | 'warn' | 'gap' | 'clay'; style?: StyleProp<ViewStyle> }) {
  const t = CHIP[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      {icon && <Icon name={icon} size={12} color={t.fg} width={2} />}
      <Text style={[styles.chipText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const CHIP = {
  default: { bg: C.tile, fg: C.ink2 },
  good: { bg: C.goodTint, fg: C.good },
  warn: { bg: C.warnTint, fg: C.warn },
  gap: { bg: C.gapTint, fg: C.gapInk },
  clay: { bg: C.clay, fg: C.white },
};

export function Card({ children, style, pad = 18 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[styles.card, { padding: pad }, style]}>{children}</View>;
}

/** A row of pill buttons, one of which is selected. */
export function Seg<V extends string>({ options, value, onChange, style }: { options: [V, string][]; value: V; onChange: (v: V) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.seg, style]} accessibilityRole="tablist">
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(v);
            }}
            style={[styles.segBtn, on && styles.segOn]}
          >
            <Text style={[styles.segText, on && { color: C.ink }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChip({ label, count, on, onPress, icon }: { label: string; count?: number; on: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.filter, on && { backgroundColor: C.ink, borderColor: C.ink }]}
    >
      {icon && <Icon name={icon} size={14} color={on ? C.white : C.good} width={2} />}
      <Text style={[styles.filterText, on && { color: C.white }]}>{label}</Text>
      {count !== undefined && <Text style={[styles.filterCount, on && { color: 'rgba(255,255,255,0.6)' }]}>{count}</Text>}
    </Pressable>
  );
}

export function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.good, false: C.line2 }} thumbColor={C.white} ios_backgroundColor={C.line2} />
    </View>
  );
}

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <T v="h3">{title}</T>
        {sub ? <T v="small" style={{ marginTop: 4, color: C.ink2 }}>{sub}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Note({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.note, style]}>
      <T v="small">{children}</T>
    </View>
  );
}

/** A pressable row that fills its width, for lists. */
export function Row({ children, onPress, style, ...rest }: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable {...rest} onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress ? { backgroundColor: C.panel2 } : null, style]}>
      {children}
    </Pressable>
  );
}

export const money = (n: number) => '$' + n.toFixed(2);

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: R.pill, borderWidth: 1 },
  iconBtn: { borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.clay, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: C.white, fontFamily: F.bold, fontSize: 10.5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: R.pill, alignSelf: 'flex-start' },
  chipText: { fontFamily: F.semibold, fontSize: 11.5 },
  card: { backgroundColor: C.panel, borderRadius: R.card, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(28,27,25,0.06)', ...shadow },
  seg: { flexDirection: 'row', padding: 3, borderRadius: R.pill, backgroundColor: C.tile, alignSelf: 'flex-start' },
  segBtn: { height: 32, paddingHorizontal: 14, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.panel, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontFamily: F.semibold, fontSize: 13, color: C.ink2 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.line2, backgroundColor: C.panel },
  filterText: { fontFamily: F.medium, fontSize: 13.5, color: C.ink2 },
  filterCount: { fontFamily: F.semibold, fontSize: 12.5, color: C.ink3 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  switchText: { fontFamily: F.medium, fontSize: 14.5, color: C.ink2, flex: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  note: { padding: 12, borderRadius: 12, backgroundColor: C.panel2, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
