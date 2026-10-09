/* Store options for a suggested piece, and the note on how ranking and money work. Same rules as the web app. */

import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';
import { findUrl } from '@core/catalog';
import type { Item, Piece, StoreOption } from '@core/types';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';
import { Icon } from './Icon';
import { Btn, Chip, money, T } from './ui';

export const listKey = (pieceId: string, store: string) => `${pieceId}|${store}`;

/** The size to pick at a store: from past purchases there, or inferred from the same kind of piece elsewhere. */
export function sizeHint(store: string, p: Piece, items: Item[]) {
  const sameCat = items.filter((i) => i.cat === p.cat && i.size && i.size !== 'One size');
  const here = sameCat.find((i) => (i.store ?? i.brand) === store);
  if (here) return `Your size: ${here.size}, from your closet`;
  const any = [...sameCat].sort((a, b) => b.wears - a.wears)[0];
  return any ? `Likely ${any.size}, based on your other ${p.cat === 'shoes' ? 'shoes' : 'pieces like this'}` : '';
}

/** Store options for a piece: favorite stores first, then lowest price. */
export function sortedOptions(p: Piece, favorites: string[]): StoreOption[] {
  const fav = (o: StoreOption) => (favorites.includes(o.store) ? 1 : 0);
  return [...p.options].sort((a, b) => fav(b) - fav(a) || a.price - b.price);
}

export const openFind = (store: string, product: string) => WebBrowser.openBrowserAsync(findUrl(store, product)).catch(() => {});

export function OptionRows({ p }: { p: Piece }) {
  const { settings, items, list, addToList, toast } = useStore();
  return (
    <View style={styles.list}>
      {sortedOptions(p, settings.favoriteStores).map((o, i) => {
        const key = listKey(p.id, o.store);
        const added = list.some((e) => e.key === key);
        const hint = sizeHint(o.store, p, items);
        return (
          <View key={o.store} style={[styles.row, i > 0 && styles.rowLine]}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <T v="label" style={{ fontSize: 13.5 }}>
                  {o.store}
                </T>
                {settings.favoriteStores.includes(o.store) && <Icon name="star" size={12} color={C.clay} fill={C.clay} />}
                <T v="label" style={{ marginLeft: 'auto', fontSize: 13.5 }}>
                  {money(o.price)}
                </T>
              </View>
              <Pressable onPress={() => openFind(o.store, o.product)} accessibilityRole="link" accessibilityHint="Searches for it at the store">
                <T v="small" style={{ color: C.ink2 }}>
                  {o.product} · <T v="small" style={{ textDecorationLine: 'underline', color: C.ink2 }}>find it</T>
                </T>
              </Pressable>
              {hint ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="ruler" size={12} color={C.ink3} />
                  <T v="tiny">{hint}</T>
                </View>
              ) : null}
            </View>
            {added ? (
              <Chip tone="good" icon="check" label="On list" />
            ) : (
              <Btn
                size="xs"
                label="Add to list"
                onPress={() => {
                  addToList(key);
                  toast(`Added to your list · ${o.product} from ${o.store}`);
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function Disclosure() {
  return (
    <View style={styles.disclosure}>
      <Icon name="shield" size={18} color={C.ink2} />
      <T v="small" style={{ flex: 1, color: C.ink2 }}>
        <T v="small" style={{ fontFamily: F.semibold, color: C.ink }}>
          How we rank, and how we make money.{' '}
        </T>
        Pieces are ranked by the new outfits they create with your closet, your style, your size being in stock, and whether you already own something
        similar. Stores are listed by your favorites, then price. Products and prices shown are examples for now; when real store links arrive, any
        commission will be disclosed and will never change the ranking.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden', backgroundColor: C.panel },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rowLine: { borderTopWidth: 1, borderTopColor: C.line },
  disclosure: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.tile, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line },
});
