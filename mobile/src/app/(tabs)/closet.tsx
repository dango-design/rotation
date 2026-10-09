/* Closet: what you own. Pieces and saved outfits, as on the web. Building an outfit opens the canvas full screen,
   with the closet as its tray, instead of the web's side panel (decision 005 flagged the phone board as cramped). */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CATS } from '@core/catalog-meta';
import { cpw } from '@core/engine';
import { plural } from '@core/format';
import type { Cat, Item } from '@core/types';
import { Flatlay, Tile } from '@/components/Art';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { ChoiceSheet } from '@/components/Sheet';
import { Btn, Card, FilterChip, IconBtn, money, Seg, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F, GUTTER, R } from '@/theme';

type SortKey = 'recent' | 'worn' | 'least' | 'cpw';

const SORTS: Record<SortKey, [string, (a: Item, b: Item) => number]> = {
  recent: ['Recently added', (a, b) => b.createdAt.localeCompare(a.createdAt)],
  worn: ['Most worn', (a, b) => b.wears - a.wears],
  least: ['Least worn', (a, b) => a.wears - b.wears],
  cpw: ['Lowest cost per wear', (a, b) => (cpw(a) ?? Infinity) - (cpw(b) ?? Infinity)],
};

const BADGE: Record<string, [IconName, string]> = {
  photo: ['camera', 'Photo'],
  link: ['link', 'Link'],
  manual: ['pencil', 'Described'],
  email: ['mail', 'Email'],
  demo: ['info', 'Demo'],
};

const GAP = 10;

export default function Closet() {
  const st = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<'pieces' | 'outfits'>('pieces');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sorting, setSorting] = useState(false);

  const cols = width >= 700 ? 5 : 3;
  const cardW = (Math.min(width, 900) - GUTTER * 2 - GAP * (cols - 1)) / cols;
  const items = st.items.filter((i) => cat === 'all' || i.cat === cat).sort(SORTS[sort][1]);
  const stores = new Set(st.items.map((i) => i.store ?? i.brand).filter(Boolean));

  const newOutfit = () => {
    st.setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
    router.push('/builder');
  };

  /** The one number a card shows: whatever the closet is sorted by. */
  const metric = (it: Item) => {
    if (sort === 'worn' || sort === 'least') return plural(it.wears, 'wear');
    if (sort === 'cpw') {
      const c = cpw(it);
      return c ? `${money(c)}/wear` : 'No price';
    }
    return null;
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T v="eyebrow" style={{ flex: 1 }}>
            Closet
          </T>
          <IconBtn icon="plus" label="Add pieces" size={38} bg={C.ink} color={C.white} onPress={() => router.push('/add')} />
        </View>
        <T v="h1">{view === 'pieces' ? plural(st.items.length, 'piece') : plural(st.outfits.length, 'saved outfit')}</T>
        <T>
          {view === 'outfits'
            ? 'Outfits you built and saved. Open one to change it.'
            : `${stores.size ? `From ${plural(stores.size, 'brand and store', 'brands and stores')}. ` : ''}Tap any piece to see what it pairs with.`}
        </T>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Seg
          options={[
            ['pieces', 'Pieces'],
            ['outfits', `Outfits${st.outfits.length ? ` ${st.outfits.length}` : ''}`],
          ]}
          value={view}
          onChange={setView}
        />
        <View style={{ flex: 1 }} />
        {st.items.length > 0 && <Btn size="sm" icon="builder" label="New outfit" onPress={newOutfit} />}
      </View>

      {st.items.length === 0 ? (
        <Card pad={22} style={{ gap: 10 }}>
          <T v="h2">Your closet is empty</T>
          <T>Start with what you wear most. A photo on a plain background works best.</T>
          <Btn kind="primary" icon="camera" label="Add your first piece" onPress={() => router.push('/add')} />
          {!st.demo && <Btn label="Explore a demo closet" onPress={st.startDemo} />}
        </Card>
      ) : view === 'pieces' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 6 }}>
            <FilterChip label="All" count={st.items.length} on={cat === 'all'} onPress={() => setCat('all')} />
            {CATS.map((c) => {
              const n = st.items.filter((i) => i.cat === c.id).length;
              return n ? <FilterChip key={c.id} label={c.label} count={n} on={cat === c.id} onPress={() => setCat(c.id)} /> : null;
            })}
          </ScrollView>
          <Pressable onPress={() => setSorting(true)} style={styles.sort} accessibilityRole="button" accessibilityLabel={`Sort: ${SORTS[sort][0]}`}>
            <Icon name="sort" size={15} color={C.ink2} />
            <T v="small" style={{ color: C.ink2, fontFamily: F.medium }}>
              {SORTS[sort][0]}
            </T>
            <Icon name="down" size={14} color={C.ink3} />
          </Pressable>
          <View style={styles.grid}>
            {items.map((it) => {
              const [ic, label] = BADGE[it.source] ?? BADGE.manual;
              const m = metric(it);
              return (
                <Pressable
                  key={it.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: it.id } })}
                  style={({ pressed }) => [{ width: cardW, gap: 6 }, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel={it.name}
                >
                  <View>
                    <Tile w={it} />
                    <View style={styles.src}>
                      <Icon name={ic} size={10} color={C.ink2} width={2} />
                      <T style={styles.srcText} numberOfLines={1}>
                        {it.source === 'email' ? (it.store ?? it.brand) : label}
                      </T>
                    </View>
                  </View>
                  <View>
                    <T v="label" style={{ fontSize: 12.5, lineHeight: 16 }} numberOfLines={2}>
                      {it.name}
                    </T>
                    <T v="tiny" numberOfLines={1}>
                      {m ?? it.brand}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : st.outfits.length ? (
        <View style={styles.grid}>
          {st.outfits.map((o) => (
            <Card key={o.id} pad={10} style={{ width: (Math.min(width, 900) - GUTTER * 2 - GAP) / 2, gap: 8 }}>
              <Pressable
                onPress={() => {
                  st.setDraft({ name: o.name, slots: o.slots, layout: o.layout, focus: 'top' });
                  router.push('/builder');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Open ${o.name}`}
              >
                <Flatlay slots={o.slots} layout={o.layout} />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="label" style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>
                  {o.name}
                </T>
                <IconBtn
                  icon="trash"
                  label={`Delete ${o.name}`}
                  size={30}
                  color={C.ink3}
                  onPress={() => {
                    st.removeOutfit(o.id);
                    st.toast('Outfit deleted');
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card pad={22} style={{ gap: 10 }}>
          <T v="h2">No saved outfits yet</T>
          <T>Put a few pieces on the canvas and save the ones you like. Saved outfits can be planned for any day on Today.</T>
          <Btn kind="primary" icon="builder" label="Build an outfit" onPress={newOutfit} />
        </Card>
      )}

      <ChoiceSheet visible={sorting} title="Sort your closet" options={Object.entries(SORTS).map(([k, [label]]) => [k as SortKey, label] as [SortKey, string])} value={sort} onPick={setSort} onClose={() => setSorting(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sort: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: -6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, rowGap: 16 },
  src: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, height: 18, paddingHorizontal: 6, borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.92)', maxWidth: '88%' },
  srcText: { fontFamily: F.semibold, fontSize: 9.5, color: C.ink2 },
});
