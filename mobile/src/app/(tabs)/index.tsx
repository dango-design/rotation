/* Today: the day view and the week planner in one, as on the web. The strip picks a day; a day with nothing
   planned asks for an outfit, which is built piece by piece in the day planner. */

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { lowestPrice } from '@core/catalog';
import { isAccessory, onePhrase, TYPES } from '@core/catalog-meta';
import { addDays, ago, daysBetween, fmt, longDay, weekStart } from '@core/dates';
import { rankPieces, slotOf, SLOTS, whyLine } from '@core/engine';
import { bestOutfitWith } from '@core/styling';
import { hexOf } from '@core/backgrounds';
import type { Background, Layout, OutfitSlots } from '@core/types';
import { Flatlay, Tile } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Btn, Card, Chip, IconBtn, money, Row, SectionHead, T, tap } from '@/components/ui';
import { useDays } from '@/lib/days';
import { useStore } from '@/lib/store';
import { C, F, GUTTER, R, shadow } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const DAY_W = 84;

export default function Today() {
  const st = useStore();
  const router = useRouter();
  const { today, wxFor, suggestFor, startPlanning } = useDays();
  const { width } = useWindowDimensions();
  const [day, setDay] = useState(today);
  const [picking, setPicking] = useState(false);
  const strip = useRef<ScrollView>(null);
  const picks = useMemo(() => rankPieces(st.catalog, st.items).filter((p) => p.unlock > 0 && p.dup.level < 1), [st.catalog, st.items]);

  const start = weekStart(day);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const dayIndex = days.indexOf(day);
  // Keep the selected day in the middle of the strip.
  const centerDay = (animated: boolean) => strip.current?.scrollTo({ x: Math.max(0, dayIndex * (DAY_W + 8) - (width - DAY_W) / 2 + GUTTER), animated });
  useEffect(() => {
    strip.current?.scrollTo({ x: Math.max(0, dayIndex * (DAY_W + 8) - (width - DAY_W) / 2 + GUTTER), animated: true });
  }, [dayIndex, width]);

  if (!st.items.length) {
    return (
      <Screen>
        <Header />
        <Card pad={22} style={{ gap: 12 }}>
          <T v="eyebrow">Welcome to Rotation</T>
          <T v="h2">Style what you own. Shop what&apos;s missing.</T>
          <T>Add a few pieces you wear often. A top, a bottom and some shoes is enough to start, and Rotation will build outfits from them every day.</T>
          <View style={{ gap: 8, marginTop: 6 }}>
            <Btn kind="primary" icon="plus" label="Add your first piece" onPress={() => router.push('/add')} />
            {!st.demo && <Btn label="Explore a demo closet" onPress={st.startDemo} />}
          </View>
        </Card>
      </Screen>
    );
  }

  const isToday = day === today;
  const past = day < today;
  const plan = st.plans.find((p) => p.date === day);
  const worn = st.wears.filter((w) => w.date === day).at(-1);
  const heroBg = worn ? worn.bg : plan?.bg;
  const slots = worn?.slots ?? plan?.slots;
  const weekday = isToday ? 'today' : fmt(day, { weekday: 'long' });
  const dayName = isToday ? 'today' : fmt(day, { weekday: 'long', month: 'short', day: 'numeric' });
  const pieces = slots ? SLOTS.filter((s) => slots[s]).map((s) => st.itemById(slots[s])).filter((i) => !!i) : [];
  const lead = st.settings.showShop ? picks[0] : undefined;
  const wx = wxFor(day);
  const idea = suggestFor(day, 0);
  const redis = st.items
    .filter((i) => !isAccessory(i.cat) && (!i.lastWorn || daysBetween(i.lastWorn, today) > 30))
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))
    .slice(0, 3);
  const thisWeek = weekStart(today);
  const weekLabel =
    start === thisWeek ? 'This week' : start === addDays(thisWeek, 7) ? 'Next week' : start === addDays(thisWeek, -7) ? 'Last week' : `Week of ${fmt(start, { month: 'short', day: 'numeric' })}`;

  const finish = (name: string, s: OutfitSlots, layout?: Layout, bg?: Background) => {
    setPicking(false);
    if (past) {
      st.wear(s, day, layout, bg);
      st.toast('Logged as worn');
    } else {
      st.setPlan(day, { name, slots: s, ...(layout ? { layout } : {}), ...(bg ? { bg } : {}) });
      st.toast(isToday ? 'Planned for today' : `Planned for ${fmt(day, { weekday: 'long' })}`);
    }
  };

  return (
    <Screen>
      <Header />

      <View style={{ gap: 12 }}>
        <View style={styles.stripBar}>
          <View style={{ flex: 1 }}>
            <T v="h3">{weekLabel}</T>
            <T v="small">
              {fmt(start, { month: 'short', day: 'numeric' })} to {fmt(addDays(start, 6), { month: 'short', day: 'numeric' })}
            </T>
          </View>
          {!isToday && <Btn size="sm" label="Today" onPress={() => setDay(today)} />}
          <IconBtn icon="left" label="Previous week" size={34} onPress={() => setDay(addDays(day, -7))} />
          <IconBtn icon="right" label="Next week" size={34} onPress={() => setDay(addDays(day, 7))} />
        </View>
        <ScrollView ref={strip} onLayout={() => centerDay(false)} horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 4, gap: 8 }}>
          {days.map((d) => {
            const p = st.plans.find((x) => x.date === d);
            const w = st.wears.filter((x) => x.date === d).at(-1);
            const s = w?.slots ?? p?.slots;
            const open = !s && d >= today;
            const dwx = st.weather?.days.find((x) => x.date === d);
            const on = d === day;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}${w ? ', worn' : p ? `, ${p.name}` : open ? ', plan an outfit' : ''}`}
                onPress={() => {
                  tap();
                  // An open day goes straight to planning; any other day is shown below.
                  if (open) {
                    setDay(d);
                    startPlanning(d);
                  } else setDay(d);
                }}
                style={[styles.day, on && styles.dayOn]}
              >
                <View style={styles.dayHead}>
                  <View>
                    <T style={[styles.dayName, d === today && { color: C.ink }]}>{d === today ? 'Today' : fmt(d, { weekday: 'short' })}</T>
                    <T style={styles.dayNum}>{fmt(d, { day: 'numeric' })}</T>
                  </View>
                  {dwx && <T v="tiny">{dwx.high}°</T>}
                </View>
                {s ? (
                  <Flatlay slots={s} layout={w ? w.layout : p?.layout} outfitBg={w ? w.bg : p?.bg} style={{ aspectRatio: 1, borderRadius: 8 }} />
                ) : (
                  <View style={[styles.dayEmpty, open && styles.dayOpen]}>{open ? <Icon name="plus" size={16} color={C.clay} /> : <T v="small">–</T>}</View>
                )}
                <T numberOfLines={1} style={[styles.dayLabel, open && { color: C.clay }, !!w && { color: C.good }]}>
                  {w ? 'Worn' : (p?.name ?? (open ? 'Plan it' : ' '))}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {slots ? (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <View style={{ backgroundColor: heroBg ? hexOf(heroBg) : C.tile, padding: 10 }}>
            <Flatlay slots={slots} layout={worn ? worn.layout : plan?.layout} bg="transparent" />
          </View>
          <View style={{ padding: 18, gap: 14 }}>
            <View>
              <T v="eyebrow">{worn ? `Worn ${isToday ? 'today' : `on ${dayName}`}` : `Planned for ${dayName}`}</T>
              <T v="h2" style={{ marginTop: 6 }}>
                {worn ? (plan?.name ?? 'Nice choice') : plan!.name}
              </T>
            </View>
            <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }}>
              {pieces.map((it) => (
                <Row key={it!.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: it!.id } })} style={styles.pieceRow} accessibilityRole="button">
                  <Tile w={it} size={40} />
                  <T v="label" style={{ flex: 1, fontFamily: F.medium }} numberOfLines={1}>
                    {it!.name}
                  </T>
                  <Chip label={it!.brand || TYPES[it!.type].label} style={{ alignSelf: 'center' }} />
                </Row>
              ))}
            </View>
            <View style={styles.actions}>
              {worn ? (
                <Chip tone="good" icon="check" label="Logged" />
              ) : (
                <>
                  {day <= today && (
                    <Btn
                      kind="primary"
                      icon="check"
                      label={isToday ? 'Wear this' : 'Wore it'}
                      onPress={() => {
                        st.wear(slots, day, plan?.layout, plan?.bg);
                        st.toast(isToday ? 'Logged as worn today' : 'Logged as worn');
                      }}
                    />
                  )}
                  {!past && <Btn icon="pencil" label="Change" onPress={() => startPlanning(day, { slots: plan!.slots, layout: plan!.layout, bg: plan!.bg, name: plan!.name })} />}
                  <Btn
                    kind="ghost"
                    label="Clear plan"
                    onPress={() => {
                      st.setPlan(day, null);
                      st.toast('Plan cleared');
                    }}
                  />
                </>
              )}
            </View>
          </View>
        </Card>
      ) : (
        <Card pad={20} style={{ gap: 10 }}>
          <T v="eyebrow" style={{ color: past ? C.ink3 : C.clayInk }}>
            {past ? `Nothing logged · ${dayName}` : `Nothing planned · ${dayName}`}
          </T>
          <T v="h2">{past ? `What did you wear on ${weekday}?` : isToday ? "Today's a blank canvas." : `${weekday}'s a blank canvas.`}</T>
          <T>{past ? 'Log it piece by piece so Rotation knows what you reach for.' : 'Start with a piece you feel like wearing. Rotation suggests what goes with it as you build.'}</T>
          {!past && wx && (
            <View style={styles.wxLine}>
              <Icon name={wx.sky} size={18} color={C.ink2} />
              <T>
                {wx.temp}° and {wx.word}
                {wx.temp < 66 ? ', so bring a layer' : ''}
              </T>
            </View>
          )}
          <View style={{ gap: 8, marginTop: 4 }}>
            <Btn kind="primary" icon="plus" label={past ? 'Log an outfit' : `Plan ${isToday ? "today's" : `${weekday}'s`} outfit`} onPress={() => startPlanning(day)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {st.outfits.length > 0 && <Btn grow label="Use a saved outfit" onPress={() => setPicking(true)} />}
              {!past && idea && <Btn grow kind="ghost" icon="shuffle" label="Surprise me" onPress={() => startPlanning(day, { slots: idea.slots, offset: 1 })} />}
            </View>
          </View>
        </Card>
      )}

      {lead && (
        <Pressable onPress={() => router.navigate('/fill')} accessibilityRole="button" style={({ pressed }) => [styles.lead, pressed && { opacity: 0.92 }]}>
          <T v="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Fill the gap
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Tile w={lead.piece} size={92} bg="rgba(255,255,255,0.94)" />
            <View style={{ flex: 1 }}>
              <T v="num" style={{ color: C.white }}>
                {lead.unlock}
              </T>
              <T style={{ color: C.white }}>new outfits from {onePhrase(lead.piece.type)}</T>
            </View>
          </View>
          <T v="small" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {whyLine(lead.piece, st.items)} From {money(lowestPrice(lead.piece))} at {lead.piece.options.length} stores.
          </T>
          <View style={styles.leadBtn}>
            <T v="label" style={{ color: C.gapInk }}>
              See the outfits
            </T>
            <Icon name="arrow" size={16} color={C.gapInk} />
          </View>
        </Pressable>
      )}

      {redis.length > 0 && (
        <View>
          <SectionHead title="Rediscover what you own" sub="Pieces you haven't reached for lately, styled with things you wear all the time." />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12, paddingBottom: 4 }}>
            {redis.map((it) => (
              <Card key={it.id} pad={12} style={{ width: 232, gap: 12 }}>
                <Flatlay slots={bestOutfitWith(it, st.items)} />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <T v="label" numberOfLines={1}>
                      {it.name}
                    </T>
                    <T v="small">{it.lastWorn ? `Last worn ${ago(it.lastWorn, today)}` : 'Not worn yet'}</T>
                  </View>
                  <Btn
                    size="sm"
                    label="Style it"
                    onPress={() => {
                      st.setDraft({ name: `Styling the ${it.name}`, slots: bestOutfitWith(it, st.items), focus: slotOf(it) });
                      router.push('/builder');
                    }}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      <Sheet visible={picking} title={past ? `Log ${fmt(day, { weekday: 'long', month: 'short', day: 'numeric' })}` : `Plan ${fmt(day, { weekday: 'long', month: 'short', day: 'numeric' })}`} onClose={() => setPicking(false)}>
        <T v="small" style={{ marginBottom: 12 }}>
          {past ? 'Which of your saved outfits did you wear?' : 'Pick one of your saved outfits.'}
        </T>
        <View style={styles.picker}>
          {st.outfits.map((o) => (
            <Pressable key={o.id} onPress={() => finish(o.name, o.slots, o.layout, o.bg)} style={styles.pick} accessibilityRole="button" accessibilityLabel={o.name}>
              <Flatlay slots={o.slots} layout={o.layout} outfitBg={o.bg} />
              <T v="label" numberOfLines={1}>
                {o.name}
              </T>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

function Header() {
  const st = useStore();
  const router = useRouter();
  const { today } = useDays();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T v="eyebrow" style={{ flex: 1 }}>
          {longDay(today)}
        </T>
        <IconBtn icon="settings" label="Settings" size={38} onPress={() => router.push('/settings')} />
      </View>
      <T v="h1">{greeting()}</T>
      <Pressable style={styles.wxLine} disabled={!!st.weather} onPress={() => router.push('/settings')} accessibilityRole={st.weather ? 'text' : 'link'}>
        <Icon name={st.weather?.sky ?? 'cloud'} size={19} color={C.ink2} />
        {st.weather ? (
          <T>
            {st.settings.city} · {st.weather.summary}
          </T>
        ) : (
          <T>
            <T style={{ color: C.ink, textDecorationLine: 'underline', fontFamily: F.medium }}>Add your city</T> for weather-aware outfits
          </T>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stripBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  day: { width: DAY_W, backgroundColor: C.panel, borderRadius: 14, padding: 8, gap: 6, borderWidth: 2, borderColor: 'transparent', ...shadow },
  dayOn: { borderColor: C.ink },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayName: { fontFamily: F.semibold, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: C.ink3 },
  dayNum: { fontFamily: F.serif, fontSize: 22, lineHeight: 24, color: C.ink },
  dayEmpty: { aspectRatio: 1, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  dayOpen: { borderColor: C.clayLine, backgroundColor: 'rgba(248,236,228,0.55)' },
  dayLabel: { fontFamily: F.semibold, fontSize: 11, color: C.ink2 },
  pieceRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wxLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lead: { backgroundColor: C.gap, borderRadius: R.card, padding: 20, gap: 14 },
  leadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: R.pill, backgroundColor: C.white },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 8 },
  pick: { width: '47%', gap: 6 },
});
