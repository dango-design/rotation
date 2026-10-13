/* Store options for one suggested piece. */

import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { pieceById } from '@core/catalog';
import { unlock, whyLine } from '@core/engine';
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
      <OptionRows p={p} />
      <Disclosure />
    </ModalScreen>
  );
}
