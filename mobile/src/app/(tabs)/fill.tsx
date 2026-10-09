/* Fill the gap: the pieces that would add the most new outfits, with store options and what wasn't recommended. */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { lowestPrice } from '@core/catalog';
import { KNOWN_STORES, TYPES } from '@core/catalog-meta';
import { rankPieces, slotOf, totalOutfits, whyLine } from '@core/engine';
import { bestOutfitWith, previewsFor } from '@core/styling';
import type { Piece } from '@core/types';
import { Flatlay, Tile } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Disclosure, OptionRows } from '@/components/Shop';
import { Btn, Card, Chip, IconBtn, money, SectionHead, SwitchRow, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F } from '@/theme';

export default function Fill() {
  const st = useStore();
  const router = useRouter();
  const ranked = useMemo(() => rankPieces(st.catalog, st.items), [st.catalog, st.items]);
  const picks = ranked.filter((p) => p.unlock > 0 && p.dup.level < 1);
  const top3 = picks.slice(0, 3);
  const more = picks.slice(3, 6);
  const total = top3.reduce((a, p) => a + p.unlock, 0);
  const spend = top3.reduce((a, p) => a + lowestPrice(p.piece), 0);
  const skipped = ranked.filter((p) => p.dup.level === 1 || (p.unlock === 0 && p.piece.cat === 'outer')).slice(0, 4);

  const tryIt = (p: Piece) => {
    st.setDraft({ name: `Trying the ${p.name.toLowerCase()}`, slots: bestOutfitWith(p, st.items), focus: slotOf(p) });
    router.push('/builder');
  };

  const head = (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T v="eyebrow" style={{ flex: 1 }}>
          Fill the gap
        </T>
        <IconBtn icon="bag" label={`Shopping list, ${st.list.length} items`} size={38} badge={st.list.length} onPress={() => router.push('/list')} />
      </View>
      {st.settings.showShop && top3.length ? (
        <T v="h1">
          {top3.length === 1 ? 'One piece' : `${['', 'One', 'Two', 'Three'][top3.length]} pieces`},{' '}
          <T v="h1" style={{ fontFamily: F.serifItalic, color: C.gap }}>
            {total} new outfits
          </T>
        </T>
      ) : (
        <T v="h1">Your closet, as it is</T>
      )}
      <T>
        We compared {st.catalog.length} common pieces from {KNOWN_STORES.length} stores with your {st.items.length}. These create the most new outfits with what you already
        own.
      </T>
    </View>
  );

  if (!st.settings.showShop)
    return (
      <Screen>
        {head}
        <Card pad={22} style={{ gap: 10 }}>
          <Icon name="shield" size={26} color={C.ink2} />
          <T v="h3">Shopping suggestions are off</T>
          <T>Your closet makes {totalOutfits(st.items)} outfits. Rotation keeps styling what you own and won&apos;t show anything for sale until you turn this back on.</T>
          <SwitchRow label="Show shopping suggestions" value={false} onChange={(v) => st.updateSettings({ showShop: v })} />
        </Card>
      </Screen>
    );

  if (!top3.length)
    return (
      <Screen>
        {head}
        <Card pad={22} style={{ gap: 10 }}>
          <T v="h2">Nothing to suggest yet</T>
          <T>Suggestions need something to pair with. Add a few tops, bottoms and shoes, and Rotation will find the pieces that unlock the most new outfits.</T>
          <Btn kind="primary" icon="plus" label="Add pieces" onPress={() => router.push('/add')} />
        </Card>
      </Screen>
    );

  return (
    <Screen>
      {head}
      <View style={styles.summary}>
        <View style={{ flexDirection: 'row' }}>
          {top3.map((p, i) => (
            <Tile key={p.piece.id} w={p.piece} size={54} bg={C.white} style={[styles.stackTile, i > 0 && { marginLeft: -12 }]} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3" style={{ color: C.white }}>
            {total} new outfits from {money(spend)}
          </T>
          <T v="small" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Lowest example price for each piece, about {money(spend / total)} per new outfit.
          </T>
        </View>
      </View>

      {top3.map(({ piece: p, unlock }, i) => {
        const prev = previewsFor(p, st.items, 3, i * 2);
        return (
          <Card key={p.id} pad={16} style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View>
                <Tile w={p} size={112} />
                <View style={styles.rank}>
                  <T style={styles.rankText}>{i + 1}</T>
                </View>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h3">{p.name}</T>
                <T v="small">
                  {TYPES[p.type].label} · {p.colorName} · from {money(lowestPrice(p))} at {p.options.length} stores
                </T>
                <View style={styles.unlock}>
                  <T v="num" style={{ color: C.gapInk, fontSize: 46, lineHeight: 46 }}>
                    {unlock}
                  </T>
                  <T v="small" style={{ color: C.gapInk, fontFamily: F.semibold, flex: 1 }}>
                    new outfits with what you own
                  </T>
                </View>
              </View>
            </View>
            <T>{whyLine(p, st.items)}</T>
            <View>
              <T v="eyebrow" style={{ marginBottom: 8 }}>
                Outfits it unlocks
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {prev.map((o, k) => (
                  <View key={k} style={{ width: 140, gap: 4 }}>
                    <Flatlay slots={o} />
                    <T v="tiny" numberOfLines={2}>
                      {[o.top !== p.id ? o.top : o.bottom, o.shoes]
                        .map((id) => st.itemById(id)?.name)
                        .filter(Boolean)
                        .join(' · ')}
                    </T>
                  </View>
                ))}
              </ScrollView>
            </View>
            <OptionRows p={p} />
            <Btn icon="builder" label="Try with my closet" onPress={() => tryIt(p)} />
          </Card>
        );
      })}

      {more.length > 0 && (
        <View>
          <SectionHead title="Also worth a look" sub="Fewer new outfits, still a good fit with your closet." />
          <View style={{ gap: 10 }}>
            {more.map(({ piece: p, unlock, dup }) => (
              <Card key={p.id} pad={12} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Tile w={p} size={72} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label">{p.name}</T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="unlock" size={13} color={C.gapInk} />
                    <T v="tiny" style={{ color: C.gapInk, fontFamily: F.semibold }}>
                      Unlocks {unlock} outfits · from {money(lowestPrice(p))}
                    </T>
                  </View>
                  <T v="small" numberOfLines={3}>
                    {dup.level > 0 && dup.item ? `Close to your ${dup.item.name.toLowerCase()}, so it ranks lower.` : whyLine(p, st.items)}
                  </T>
                  <Btn size="xs" kind="ghost" label={`Compare ${p.options.length} stores`} style={{ alignSelf: 'flex-start', marginLeft: -10 }} onPress={() => router.push({ pathname: '/compare/[id]', params: { id: p.id } })} />
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {skipped.length > 0 && (
        <View>
          <SectionHead title="What we didn't recommend, and why" sub="Fewer, better picks mean fewer returns and more trust." />
          <Card pad={12} style={{ gap: 4 }}>
            {skipped.map(({ piece: p, dup }, i) => (
              <View key={p.id} style={[styles.skip, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }]}>
                <Tile w={p} size={48} />
                <View style={{ flex: 1, gap: 4 }}>
                  <T v="label" style={{ fontSize: 13.5 }}>
                    {p.name}
                  </T>
                  <T v="small">
                    {dup.level === 1 && dup.item
                      ? `You already own one in ${dup.item.colorName.toLowerCase()} and have worn it ${dup.item.wears} times.`
                      : 'The layers you own already work with every outfit you can make.'}
                  </T>
                  {dup.level === 1 ? <Chip tone="warn" icon="alert" label="You own this" /> : <Chip label="0 new outfits" />}
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}
      <Disclosure />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: C.gap, marginHorizontal: 0 },
  stackTile: { borderWidth: 3, borderColor: C.gap },
  rank: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: C.white, fontFamily: F.bold, fontSize: 12 },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  skip: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
});
