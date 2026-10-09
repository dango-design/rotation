/* Store options for one suggested piece. */

import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { pieceById } from '@core/catalog';
import { duplicate, unlock, whyLine } from '@core/engine';
import { Tile } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { ModalScreen } from '@/components/ModalScreen';
import { Disclosure, OptionRows } from '@/components/Shop';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F } from '@/theme';

export default function CompareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items } = useStore();
  const p = pieceById(id);
  if (!p)
    return (
      <ModalScreen eyebrow="Compare stores">
        <T>That piece isn&apos;t in the catalog anymore.</T>
      </ModalScreen>
    );
  const dup = duplicate(p, items);
  return (
    <ModalScreen eyebrow="Compare stores">
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Tile w={p} size={96} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h2">{p.name}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="unlock" size={14} color={C.gapInk} />
            <T v="small" style={{ color: C.gapInk, fontFamily: F.semibold }}>
              Unlocks {unlock(p, items)} new outfits
            </T>
          </View>
        </View>
      </View>
      <T>{whyLine(p, items)}</T>
      {dup.level === 1 && dup.item && (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.warnTint }}>
          <T style={{ color: C.warn }}>
            <T style={{ color: C.warn, fontFamily: F.semibold }}>You already own this: </T>
            {dup.item.name}, worn {dup.item.wears} times.
          </T>
        </View>
      )}
      <OptionRows p={p} />
      <Disclosure />
    </ModalScreen>
  );
}
