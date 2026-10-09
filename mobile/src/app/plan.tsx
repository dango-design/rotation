/* Planning (or logging) one day's outfit piece by piece, phone first: the canvas on top, the pieces for each step
   in a tray below. Tap a piece to put it on, or touch and hold it and drag it onto the canvas. Each step suggests
   the two pieces that fit best and fades the ones that clash, using the same rules as the web planner. */

import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmt } from '@core/dates';
import { SLOTS } from '@core/engine';
import { ASPECT } from '@core/layout';
import { nextStep, piecesFor, STEPS, type StepPiece } from '@core/planning';
import type { Layout, OutfitSlots, Settings, Slot } from '@core/types';
import { Tile } from '@/components/Art';
import { CarryProvider, CarryTile } from '@/components/Carry';
import { Icon } from '@/components/Icon';
import { OutfitCanvas } from '@/components/OutfitCanvas';
import { ChoiceSheet } from '@/components/Sheet';
import { Btn, FilterChip, IconBtn, Seg, T } from '@/components/ui';
import { placePiece, removeSlot } from '@/lib/board';
import { useDays } from '@/lib/days';
import { useStore, type PlanSeed } from '@/lib/store';
import { C, F, GUTTER, R } from '@/theme';

const SORTS: Record<string, [string, ((a: StepPiece, b: StepPiece) => number) | null]> = {
  suggested: ['Suggested', null],
  least: ['Least worn', (a, b) => a.item.wears - b.item.wears],
  most: ['Most worn', (a, b) => b.item.wears - a.item.wears],
  recent: ['Recently added', (a, b) => b.item.createdAt.localeCompare(a.item.createdAt)],
  name: ['Name', (a, b) => a.item.name.localeCompare(b.item.name)],
};

const OCCASIONS: [Settings['occasion'], string][] = [
  ['casual', 'Casual'],
  ['work', 'Work'],
  ['dressy', 'Dressy'],
];

export default function PlanScreen() {
  const { planSeed } = useStore();
  if (!planSeed) return <Redirect href="/" />;
  return <Planner seed={planSeed} />;
}

function Planner({ seed }: { seed: PlanSeed }) {
  const st = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { today, wxFor, suggestFor } = useDays();
  const [slots, setSlots] = useState<OutfitSlots>(seed.slots ?? {});
  const [layout, setLayout] = useState<Layout | undefined>(seed.layout);
  const [name, setName] = useState(seed.name);
  const [step, setStep] = useState<Slot>(() => nextStep(seed.slots ?? {}, st.wearableById) ?? 'top');
  const [surprises, setSurprises] = useState(0);
  const [occasion, setOccasion] = useState(st.settings.occasion);
  const [sort, setSort] = useState('suggested');
  const [sorting, setSorting] = useState(false);
  const stepBar = useRef<ScrollView>(null);
  const stepX = useRef<Partial<Record<Slot, number>>>({});
  // Keep the current step's tab in view as the planner moves along.
  useEffect(() => {
    const t = setTimeout(() => stepBar.current?.scrollTo({ x: Math.max(0, (stepX.current[step] ?? 0) - GUTTER - 40), animated: true }), 60);
    return () => clearTimeout(t);
  }, [step]);

  const date = seed.day;
  const mode = seed.mode;
  const dayLabel = date === today ? 'today' : fmt(date, { weekday: 'long' });
  const weather = wxFor(date);
  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  // Any one piece is an outfit worth planning or logging; clashing pieces are only faded as a hint.
  const ready = pieces.length > 0;
  const suggestedOrder = piecesFor(step, slots, st.items, st.wearableById, { occasion, today: date, temp: weather?.temp });
  const by = SORTS[sort][1];
  const rows = by ? [...suggestedOrder].sort(by) : suggestedOrder;
  const dress = st.wearableById(slots.top)?.cat === 'dress';
  const current = STEPS.find((s) => s.slot === step)!;
  const following = STEPS[STEPS.findIndex((s) => s.slot === step) + 1]?.slot;

  // The canvas takes what's left once the header, steps and tray have their room.
  const reserved = insets.top + insets.bottom + (mode === 'plan' ? 470 : 430);
  const canvasW = Math.max(220, Math.min(width - GUTTER * 2, (height - reserved) / ASPECT));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const put = (id: string, at?: { x: number; y: number }) => {
    const it = st.itemById(id);
    if (!it) return;
    const next = placePiece(slots, layout, it, st.wearableById, at);
    setSlots(next.slots);
    setLayout(next.layout);
    setStep(nextStep(next.slots, st.wearableById, step) ?? step);
  };
  const pick = (id: string) => {
    if (slots[step] === id) {
      const next = removeSlot(slots, layout, step);
      setSlots(next.slots);
      setLayout(next.layout);
    } else put(id);
  };
  const remove = (s: Slot) => {
    const next = removeSlot(slots, layout, s);
    setSlots(next.slots);
    setLayout(next.layout);
    setStep(s);
  };
  const surpriseMe = () => {
    const s = suggestFor(date, surprises + seed.offset, occasion)?.slots;
    if (!s) return;
    setSlots(s);
    setLayout(undefined);
    setSurprises((n) => n + 1);
    setStep(nextStep(s, st.wearableById) ?? 'top');
  };
  const done = () => {
    const n = name.trim() || 'Planned outfit';
    if (mode === 'log') {
      st.wear(slots, date, layout);
      st.toast('Logged as worn');
    } else {
      st.setPlan(date, { name: n, slots, ...(layout ? { layout } : {}) });
      st.toast(date === today ? 'Planned for today' : `Planned for ${fmt(date, { weekday: 'long' })}`);
    }
    st.setPlanSeed(null);
    close();
  };

  const stepHint =
    step === 'outer' && weather
      ? weather.temp >= 66
        ? `${weather.temp}° and ${weather.word}: warm enough to skip a layer.`
        : `${weather.temp}° and ${weather.word}: a layer will help.`
      : step === 'top' && !pieces.length
        ? 'Start with what you feel like wearing. Rotation suggests what goes with it.'
        : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CarryProvider onDrop={(id, at) => put(id, at)} style={{ paddingTop: insets.top + 8 }}>
        <View style={styles.head}>
          <IconBtn icon="x" label="Cancel" size={38} onPress={close} />
          <View style={{ flex: 1 }}>
            <T v="eyebrow" style={{ color: C.clayInk }}>
              {mode === 'log' ? `Logging ${dayLabel}` : `Planning ${dayLabel}`}
            </T>
            <TextInput value={name} onChangeText={setName} style={styles.name} accessibilityLabel="Outfit name" returnKeyType="done" />
          </View>
        </View>
        {mode === 'plan' && (
          <View style={styles.occasion}>
            <Seg
              options={OCCASIONS}
              value={occasion}
              onChange={(v) => {
                setOccasion(v);
                // Remembered as the default for the next day planned.
                st.updateSettings({ occasion: v });
              }}
            />
            <Btn size="sm" icon="shuffle" label="Surprise me" onPress={surpriseMe} />
          </View>
        )}

        <View style={{ alignItems: 'center', paddingHorizontal: GUTTER }}>
          <OutfitCanvas
            slots={slots}
            layout={layout}
            width={canvasW}
            onLayout={setLayout}
            onRemove={remove}
            onSelect={(s) => setStep(s)}
            emptyHint={mode === 'log' ? 'Tap the pieces you wore, or touch and hold one and drag it here.' : undefined}
          />
        </View>

        <View style={{ flex: 1, gap: 8, paddingTop: 4 }}>
          <ScrollView ref={stepBar} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.steps} style={{ flexGrow: 0 }}>
            {STEPS.map((s) => {
              const covered = s.slot === 'bottom' && dress;
              const done = !!slots[s.slot] || covered;
              return covered ? null : (
                <View key={s.slot} onLayout={(e) => (stepX.current[s.slot] = e.nativeEvent.layout.x)}>
                  <FilterChip label={s.label} on={step === s.slot} icon={done ? 'check' : undefined} onPress={() => setStep(s.slot)} />
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.trayHead}>
            <T v="small" style={{ flex: 1 }} numberOfLines={2}>
              {stepHint ?? `${current.label}: ${rows.length ? `${rows.length} in your closet` : 'none yet'}`}
            </T>
            <Btn size="xs" kind="ghost" icon="sort" label={SORTS[sort][0]} onPress={() => setSorting(true)} />
          </View>
          {rows.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
              {rows.map(({ item, fits, suggested, why }) => {
                const on = slots[step] === item.id;
                return (
                  <CarryTile key={item.id} w={item} onTap={() => pick(item.id)} faded={!fits} style={styles.trayPiece} accessibilityLabel={`${item.name}${fits ? '' : ", doesn't go with the rest"}`}>
                    <View>
                      <Tile w={item} style={on ? styles.on : undefined} />
                      {suggested && (
                        <View style={styles.badge}>
                          <Icon name="builder" size={10} color={C.white} width={2} />
                          <T style={styles.badgeText}>Suggested</T>
                        </View>
                      )}
                      {on && (
                        <View style={styles.check}>
                          <Icon name="check" size={12} color={C.white} width={2.6} />
                        </View>
                      )}
                    </View>
                    <T v="label" style={{ fontSize: 12.5 }} numberOfLines={1}>
                      {item.name}
                    </T>
                    <T v="tiny" style={suggested ? { color: C.clayInk } : undefined} numberOfLines={1}>
                      {why ?? item.brand}
                    </T>
                  </CarryTile>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: GUTTER }}>
              <T v="small">No {current.plural} in your closet yet.</T>
            </View>
          )}
        </View>

        <View style={[styles.foot, { paddingBottom: insets.bottom + 10 }]}>
          {!slots[step] && following ? <Btn kind="ghost" size="sm" label="Skip" onPress={() => setStep(following)} /> : <View />}
          <Btn kind="primary" icon={mode === 'log' ? 'check' : 'planner'} label={mode === 'log' ? 'Log as worn' : `Plan for ${dayLabel}`} disabled={!ready} onPress={done} />
        </View>
      </CarryProvider>

      <ChoiceSheet visible={sorting} title="Sort pieces" options={Object.entries(SORTS).map(([k, [label]]) => [k, label] as [string, string])} value={sort} onPick={setSort} onClose={() => setSorting(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, paddingBottom: 8 },
  occasion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: GUTTER, paddingBottom: 10 },
  name: { fontFamily: F.serif, fontSize: 26, lineHeight: 30, color: C.ink, padding: 0, marginTop: 2 },
  steps: { paddingHorizontal: GUTTER, gap: 6 },
  trayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: GUTTER, minHeight: 30 },
  tray: { paddingHorizontal: GUTTER, gap: 10, paddingBottom: 4 },
  trayPiece: { width: 96, gap: 3 },
  on: { borderWidth: 2, borderColor: C.ink },
  badge: { position: 'absolute', top: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 3, height: 18, paddingHorizontal: 6, borderRadius: R.pill, backgroundColor: C.clay },
  badgeText: { fontFamily: F.semibold, fontSize: 9.5, color: C.white },
  check: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line2, backgroundColor: C.panel2 },
});
