/* The outfit builder, phone first: the canvas fills the top of the screen and your closet is the tray below it.
   Tap a piece to put it on, or touch and hold it and drag it onto the canvas. Pieces that don't go with the outfit
   fade and sort to the end, and Shop the gap offers pieces you could try on the canvas before buying them. */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATS } from '@core/catalog-meta';
import { addDays, fmt } from '@core/dates';
import { check, fitsBoard, forSlot, isComplete, slotOf, SLOTS } from '@core/engine';
import { ASPECT } from '@core/layout';
import type { Cat, Item, Piece, Slot } from '@core/types';
import { Tile } from '@/components/Art';
import { CarryProvider, CarryTile } from '@/components/Carry';
import { Icon } from '@/components/Icon';
import { OutfitCanvas } from '@/components/OutfitCanvas';
import { ChoiceSheet } from '@/components/Sheet';
import { Btn, FilterChip, IconBtn, Seg, SwitchRow, T } from '@/components/ui';
import { placePiece, removeSlot } from '@/lib/board';
import { useDays } from '@/lib/days';
import { useStore } from '@/lib/store';
import { C, F, GUTTER, R } from '@/theme';

const SLOT_LABEL: Record<Slot, string> = { outer: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', bag: 'Bag', jewelry: 'Jewelry', acc: 'Accessory' };

export default function Builder() {
  const st = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { today } = useDays();
  const { draft, setDraft } = st;
  const [tray, setTray] = useState<'closet' | 'shop'>('closet');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [planning, setPlanning] = useState(false);

  const slots = draft.slots;
  const pieces = SLOTS.filter((s) => slots[s]).map((s) => st.wearableById(slots[s])!).filter(Boolean);
  const complete = isComplete(slots, st.wearableById);
  const verdict = check(pieces);
  const trial = pieces.filter((p) => !('wears' in p)) as Piece[];
  // Any owned piece can be saved, worn or planned; a piece you'd still have to buy can't.
  const ready = pieces.length > 0 && trial.length === 0;
  const onBoard = new Set(Object.values(slots));
  const fits = (i: Item) => fitsBoard(i, slots, st.wearableById);
  const closet = st.items.filter((i) => cat === 'all' || i.cat === cat).sort((a, b) => Number(fits(b)) - Number(fits(a)) || a.wears - b.wears);
  const dressOn = st.wearableById(slots.top)?.cat === 'dress';
  const shop = st.settings.showShop ? forSlot(draft.focus, slots, st.items, st.catalog).shop : [];

  const reserved = insets.top + insets.bottom + 430;
  const canvasW = Math.max(220, Math.min(width - GUTTER * 2, (height - reserved) / ASPECT));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/closet'));
  const put = (id: string, at?: { x: number; y: number }) => {
    const w = st.wearableById(id);
    if (!w) return;
    const next = placePiece(slots, draft.layout, w, st.wearableById, at);
    setDraft({ ...draft, ...next, focus: slotOf(w) });
  };
  const remove = (s: Slot) => setDraft({ ...draft, ...removeSlot(slots, draft.layout, s), focus: s });
  const name = draft.name.trim() || 'Untitled outfit';

  const planDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CarryProvider onDrop={put} style={{ paddingTop: insets.top + 8 }}>
        <View style={styles.head}>
          <IconBtn icon="x" label="Close" size={38} onPress={close} />
          <View style={{ flex: 1 }}>
            <T v="eyebrow">Building an outfit</T>
            <TextInput value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} style={styles.name} accessibilityLabel="Outfit name" returnKeyType="done" />
          </View>
          {pieces.length > 0 && <Btn kind="ghost" size="sm" label="Clear" onPress={() => setDraft({ name: 'New outfit', slots: {}, focus: 'top' })} />}
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: GUTTER }}>
          <OutfitCanvas
            slots={slots}
            layout={draft.layout}
            width={canvasW}
            onLayout={(layout) => setDraft({ ...draft, layout })}
            onRemove={remove}
            onSelect={(s) => setDraft({ ...draft, focus: s })}
            onCompare={(id) => router.push({ pathname: '/compare/[id]', params: { id } })}
          />
        </View>

        <View style={styles.status}>
          {!verdict.ok ? (
            <View style={styles.verdict}>
              <Icon name="alert" size={15} color={C.warn} />
              <T v="small" style={{ color: C.warn, flex: 1 }} numberOfLines={2}>
                {verdict.reason}
              </T>
            </View>
          ) : complete ? (
            <View style={styles.verdict}>
              <Icon name="check" size={15} color={C.good} width={2.2} />
              <T v="small" style={{ color: C.good }}>
                These work together
              </T>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {trial.length > 0 && (
            <T v="small" style={{ color: C.gapInk, fontFamily: F.semibold }}>
              {trial.length} to shop
            </T>
          )}
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <View style={styles.trayBar}>
            <Seg
              options={[
                ['closet', 'Your closet'],
                ['shop', 'Shop the gap'],
              ]}
              value={tray}
              onChange={setTray}
            />
          </View>
          {tray === 'closet' ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 6 }}>
                <FilterChip label="All" on={cat === 'all'} onPress={() => setCat('all')} />
                {CATS.map((c) => (st.items.some((i) => i.cat === c.id) ? <FilterChip key={c.id} label={c.label} on={cat === c.id} onPress={() => setCat(c.id)} /> : null))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
                {closet.map((it) => (
                  <CarryTile key={it.id} w={it} onTap={() => put(it.id)} faded={!fits(it)} style={styles.trayPiece} accessibilityLabel={`Put ${it.name} on the canvas`}>
                    <View>
                      <Tile w={it} style={onBoard.has(it.id) ? styles.on : undefined} />
                      {onBoard.has(it.id) && (
                        <View style={styles.check}>
                          <Icon name="check" size={12} color={C.white} width={2.6} />
                        </View>
                      )}
                    </View>
                    <T v="label" style={{ fontSize: 12.5 }} numberOfLines={1}>
                      {it.name}
                    </T>
                    <T v="tiny" numberOfLines={1}>
                      {it.brand}
                    </T>
                  </CarryTile>
                ))}
              </ScrollView>
            </>
          ) : st.settings.showShop ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 6 }}>
                {SLOTS.map((s) => (
                  <FilterChip key={s} label={SLOT_LABEL[s]} on={draft.focus === s} onPress={() => setDraft({ ...draft, focus: s })} />
                ))}
              </ScrollView>
              {draft.focus === 'bottom' && dressOn ? (
                <T v="small" style={{ paddingHorizontal: GUTTER }}>
                  A dress is on the canvas, so no bottom is needed.
                </T>
              ) : shop.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
                  {shop.map(({ piece, unlock }) => (
                    <CarryTile key={piece.id} w={piece} onTap={() => put(piece.id)} style={[styles.trayPiece, { width: 120 }]} accessibilityLabel={`Try the ${piece.name} on the canvas`}>
                      <Tile w={piece} bg={C.gapTint} style={onBoard.has(piece.id) ? styles.on : undefined} />
                      <T v="label" style={{ fontSize: 12.5 }} numberOfLines={1}>
                        {piece.name}
                      </T>
                      <T v="tiny" style={{ color: C.gapInk, fontFamily: F.semibold }}>
                        Unlocks {unlock} outfits
                      </T>
                    </CarryTile>
                  ))}
                </ScrollView>
              ) : (
                <T v="small" style={{ paddingHorizontal: GUTTER }}>
                  Nothing new needed here. Your closet already covers this slot.
                </T>
              )}
            </>
          ) : (
            <View style={{ paddingHorizontal: GUTTER, gap: 6 }}>
              <T v="small">Shopping suggestions are hidden. Only pieces you own are shown.</T>
              <SwitchRow label="Show shopping suggestions" value={st.settings.showShop} onChange={(v) => st.updateSettings({ showShop: v })} />
            </View>
          )}
        </View>

        <View style={[styles.foot, { paddingBottom: insets.bottom + 10 }]}>
          <Btn
            size="sm"
            icon="check"
            label="Wear today"
            disabled={!ready}
            onPress={() => {
              st.wear(slots, undefined, draft.layout);
              st.toast('Logged as worn today');
            }}
          />
          <Btn size="sm" icon="planner" label="Plan" disabled={!ready} onPress={() => setPlanning(true)} />
          <View style={{ flex: 1 }} />
          <Btn
            kind="primary"
            label="Save outfit"
            disabled={!ready}
            onPress={() => {
              st.saveOutfit(name, slots, draft.layout);
              st.toast('Saved to your outfits');
            }}
          />
        </View>
      </CarryProvider>

      <ChoiceSheet
        visible={planning}
        title={`Plan "${name}" for`}
        options={planDays.map((d) => {
          const existing = st.plans.find((p) => p.date === d);
          const label = d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : fmt(d, { weekday: 'long', month: 'short', day: 'numeric' });
          return [d, label, existing ? `Replaces "${existing.name}"` : undefined] as [string, string, string?];
        })}
        onPick={(d) => {
          st.setPlan(d, { name, slots, ...(draft.layout ? { layout: draft.layout } : {}) });
          st.toast(d === today ? 'Planned for today' : `Planned for ${fmt(d, { weekday: 'long' })}`);
        }}
        onClose={() => setPlanning(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, paddingBottom: 10 },
  name: { fontFamily: F.serif, fontSize: 26, lineHeight: 30, color: C.ink, padding: 0, marginTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: GUTTER, minHeight: 26 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  trayBar: { paddingHorizontal: GUTTER, paddingTop: 2 },
  tray: { paddingHorizontal: GUTTER, gap: 10, paddingBottom: 4 },
  trayPiece: { width: 96, gap: 3 },
  on: { borderWidth: 2, borderColor: C.ink },
  check: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: GUTTER, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line2, backgroundColor: C.panel2, borderTopLeftRadius: R.card, borderTopRightRadius: R.card },
});
