/* A garment as its photo, or as the flat-lay illustration drawn from its type and color (shared with the web app). */

import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { garmentSvg } from '@core/garments';
import { resolveLayout, stackOrder } from '@core/layout';
import type { Layout, OutfitSlots, Wearable } from '@core/types';
import { useStore } from '@/lib/store';
import { C, R } from '@/theme';

/* The web app defines these once per page; each drawing here carries its own copy. */
const DEFS =
  '<defs><linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/>' +
  '</linearGradient><pattern id="p-stripe" width="12" height="12" patternUnits="userSpaceOnUse">' +
  '<rect width="12" height="12" fill="#EFE9DC"/><rect y="7" width="12" height="4" fill="#25324B"/></pattern></defs>';

const drawing = (type: string, color: string, pattern?: string) =>
  garmentSvg(type, color, pattern).replace(/<svg [^>]*>/, (open) => open.replace(/ class="[^"]*"| aria-hidden="[^"]*"/g, '') + DEFS);

/** A soft shadow that follows the garment's outline, like the web app's drop-shadow. */
export const garmentShadow = (strength = 1): ViewStyle =>
  Platform.select<ViewStyle>({
    web: { filter: `drop-shadow(0 ${6 * strength}px ${7 * strength}px rgba(28, 27, 25, ${0.13 * strength}))` } as ViewStyle,
    ios: { shadowColor: '#1C1B19', shadowOpacity: 0.13 * strength, shadowRadius: 5 * strength, shadowOffset: { width: 0, height: 5 * strength } },
    default: {},
  });

type W = Wearable & { imageId?: string; source?: string };

export const Art = memo(function Art({ w }: { w?: W }) {
  const { imageFor } = useStore();
  const uri = imageFor(w);
  const xml = useMemo(() => (w && !uri ? drawing(w.type, w.color, w.pattern) : ''), [w, uri]);
  if (!w) return null;
  if (uri) return <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={120} />;
  return <SvgXml xml={xml} width="100%" height="100%" />;
});

/** A square tile with a piece on it. */
export function Tile({ w, size, style, bg = C.tile }: { w?: W; size?: number; style?: StyleProp<ViewStyle>; bg?: string }) {
  const photoOnWhite = w?.source === 'link';
  return (
    <View style={[styles.tile, { backgroundColor: photoOnWhite ? C.white : bg }, size ? { width: size, borderRadius: size < 60 ? 8 : R.tile } : null, style]}>
      <View style={[styles.art, garmentShadow(size && size < 60 ? 0.6 : 1)]}>
        <Art w={w} />
      </View>
    </View>
  );
}

/** An outfit drawn as a flat lay, arranged as saved or at true-to-life sizes. Pieces still to buy are dashed. */
export function Flatlay({ slots, layout, style, bg = C.tile }: { slots: OutfitSlots; layout?: Layout; style?: StyleProp<ViewStyle>; bg?: string }) {
  const { wearableById } = useStore();
  const placed = resolveLayout(slots, layout, wearableById);
  return (
    <View style={[styles.flatlay, { backgroundColor: bg }, style]}>
      {stackOrder(placed).map((s) => {
        const w = wearableById(slots[s])!;
        const p = placed[s]!;
        const ghost = !('wears' in w);
        return (
          <View key={s} style={[styles.piece, garmentShadow(0.8), { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z }]}>
            <Art w={w} />
            {ghost && <View style={styles.ghost} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { aspectRatio: 1, borderRadius: R.tile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  art: { width: '86%', height: '86%' },
  flatlay: { aspectRatio: 1 / 1.02, borderRadius: R.tile, overflow: 'hidden' },
  piece: { position: 'absolute', aspectRatio: 1 },
  ghost: { position: 'absolute', left: '6%', top: '6%', right: '6%', bottom: '6%', borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.gap, borderRadius: 12 },
});
