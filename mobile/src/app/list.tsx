/* The shopping list, grouped by store, with the outfits each piece unlocks. */

import { Pressable, StyleSheet, View } from 'react-native';
import { pieceById } from '@core/catalog';
import { unlock } from '@core/engine';
import type { Piece, StoreOption } from '@core/types';
import { Tile } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { ModalScreen } from '@/components/ModalScreen';
import { Disclosure, openFind } from '@/components/Shop';
import { Btn, Card, money, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F } from '@/theme';

export default function ListScreen() {
  const { list, items, removeFromList, toast } = useStore();
  const entries = list
    .map((e) => {
      const [pid, store] = e.key.split('|');
      const piece = pieceById(pid);
      const option = piece?.options.find((o) => o.store === store);
      return piece && option ? { key: e.key, piece, option } : null;
    })
    .filter(Boolean) as { key: string; piece: Piece; option: StoreOption }[];
  const byStore = new Map<string, typeof entries>();
  entries.forEach((e) => byStore.set(e.option.store, [...(byStore.get(e.option.store) ?? []), e]));
  const total = entries.reduce((a, e) => a + e.option.price, 0);

  return (
    <ModalScreen eyebrow="Shopping list">
      <T v="h2">{entries.length ? `${entries.length} piece${entries.length > 1 ? 's' : ''}, ${money(total)}` : 'Your list is empty'}</T>
      {entries.length ? (
        <>
          {[...byStore.entries()].map(([store, es]) => (
            <Card key={store} pad={14} style={{ gap: 10 }}>
              <T v="label">{store}</T>
              {es.map(({ key, piece, option }) => (
                <View key={key} style={styles.row}>
                  <Tile w={piece} size={54} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="label" style={{ fontSize: 13.5 }}>
                      {option.product}
                    </T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="unlock" size={12} color={C.gapInk} />
                      <T v="tiny" style={{ color: C.gapInk, fontFamily: F.semibold }}>
                        +{unlock(piece, items)} outfits with your closet
                      </T>
                    </View>
                    <Pressable onPress={() => openFind(option.store, option.product)} accessibilityRole="link">
                      <T v="tiny">
                        {money(option.price)} · <T v="tiny" style={{ textDecorationLine: 'underline' }}>find it at {store}</T>
                      </T>
                    </Pressable>
                  </View>
                  <Btn
                    size="xs"
                    label="Remove"
                    onPress={() => {
                      removeFromList(key);
                      toast('Removed from your list');
                    }}
                  />
                </View>
              ))}
            </Card>
          ))}
          <Disclosure />
        </>
      ) : (
        <T>Pieces you add from Fill the gap land here, grouped by store, with the outfits they unlock.</T>
      )}
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
