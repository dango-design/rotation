/* Store options for a suggested piece, and the note on how ranking and money work. Same rules as the web app. */

import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { findUrl, sizeHint } from '@core/catalog';
import type { Piece, StoreOption } from '@core/types';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';
import { Icon } from './Icon';
import { Btn, money, T, tap } from './ui';

export const listKey = (pieceId: string, store: string) => `${pieceId}|${store}`;

/** Store options for a piece: favorite stores first, then lowest price. */
export function sortedOptions(p: Piece, favorites: string[]): StoreOption[] {
  const fav = (o: StoreOption) => (favorites.includes(o.store) ? 1 : 0);
  return [...p.options].sort((a, b) => fav(b) - fav(a) || a.price - b.price);
}

export const openFind = (store: string, product: string) => WebBrowser.openBrowserAsync(findUrl(store, product)).catch(() => {});

/** A piece's store options, each with a size hint and a way on and off the list. `limit` shows that many and folds the
    rest behind a row, so the piece leads and the stores follow. */
export function OptionRows({ p, limit }: { p: Piece; limit?: number }) {
  const { settings, items, list, addToList, removeFromList, toast } = useStore();
  const [all, setAll] = useState(false);
  const options = sortedOptions(p, settings.favoriteStores);
  const shown = limit && !all ? options.slice(0, limit) : options;
  const folded = options.slice(limit ?? options.length);
  return (
    <View style={styles.list}>
      {shown.map((o, i) => {
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
              <Pressable
                onPress={() => openFind(o.store, o.product)}
                accessibilityRole="link"
                accessibilityLabel={`find it: ${o.product} at ${o.store}`}
                accessibilityHint="Searches for it at the store"
              >
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
            {/* On the list, and still a button: pressing it again takes the piece off. The label stays "On list", so the
                confirmation isn't swapped for "Remove" the moment it appears; the hint and toast say what pressing does. */}
            {added ? (
              <Btn
                size="xs"
                kind="good"
                icon="check"
                label="On list"
                accessibilityLabel={`On list · ${o.product} from ${o.store}`}
                accessibilityHint="Takes it off your list"
                onPress={() => {
                  removeFromList(key);
                  toast(`Removed from your list · ${o.product} from ${o.store}`);
                }}
              />
            ) : (
              <Btn
                size="xs"
                label="Add to list"
                accessibilityLabel={`Add to list · ${o.product} from ${o.store}`}
                onPress={() => {
                  addToList(key);
                  toast(`Added to your list · ${o.product} from ${o.store}`);
                }}
              />
            )}
          </View>
        );
      })}
      {/* One row that stays put while the stores open and close, so focus stays on it. aria-expanded rather than
          accessibilityState: native maps it to the same state, and the web build only reads aria-expanded. */}
      {limit && folded.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          aria-expanded={all}
          onPress={() => {
            tap();
            setAll(!all);
          }}
          style={({ pressed }) => [styles.more, pressed && { backgroundColor: C.tile }]}
        >
          <T v="small" style={{ flex: 1, color: C.ink2, fontFamily: F.semibold }}>
            {all ? 'Fewer stores' : `${folded.length} more ${folded.length === 1 ? 'store' : 'stores'}, from ${money(Math.min(...folded.map((o) => o.price)))}`}
          </T>
          <View style={all && { transform: [{ rotate: '180deg' }] }}>
            <Icon name="down" size={15} color={C.ink2} />
          </View>
        </Pressable>
      ) : null}
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
  more: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.panel2 },
  disclosure: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.tile, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line },
});
