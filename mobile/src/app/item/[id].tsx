/* One piece: what it pairs with, how much it's worn, and pieces that would complete it. Same as the web drawer. */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { lowestPrice } from '@core/catalog';
import { TYPES } from '@core/catalog-meta';
import { ago, shortDate } from '@core/dates';
import { check, cpw, outfitsWith, pairsWith, rankPieces, slotOf } from '@core/engine';
import { bestOutfitWith } from '@core/styling';
import { Tile } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { ItemForm } from '@/components/ItemForm';
import { ModalScreen } from '@/components/ModalScreen';
import { Btn, Chip, money, Note, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F, GUTTER, R } from '@/theme';

const SOURCE: Record<string, string> = {
  photo: 'Added from a photo.',
  link: 'Added from a product link; the photo and details came from the store page.',
  manual: 'Added by description; the illustration is drawn from its type and color.',
  email: 'Imported from an order email (demo).',
  demo: 'Part of the demo closet.',
};

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = useStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const it = st.itemById(id);

  if (!it)
    return (
      <ModalScreen eyebrow="Piece">
        <T>This piece is no longer in your closet.</T>
      </ModalScreen>
    );

  const pairs = pairsWith(it, st.items);
  const c = cpw(it);
  const shop = st.settings.showShop
    ? rankPieces(
        st.catalog.filter((p) => slotOf(p) !== slotOf(it) && check([it, p]).ok),
        st.items,
      )
        .filter((x) => x.unlock > 0 && x.dup.level < 1)
        .slice(0, 2)
    : [];

  if (editing)
    return (
      <ModalScreen eyebrow="Edit piece" onClose={() => setEditing(false)}>
        <ItemForm
          initial={it}
          previewUrl={st.imageFor(it)}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={(f) => {
            st.updateItem({ ...it, ...f });
            setEditing(false);
            st.toast('Saved');
          }}
        />
      </ModalScreen>
    );

  return (
    <ModalScreen eyebrow={TYPES[it.type].label}>
      <Tile w={it} style={{ width: '100%', borderRadius: 18 }} />
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip label={it.brand || TYPES[it.type].label} />
          {it.store ? <Chip label={`Bought at ${it.store}`} /> : null}
        </View>
        <T v="h2">{it.name}</T>
        <T v="small">
          {it.colorName} · {TYPES[it.type].label}
          {it.size ? ` · Size ${it.size}` : ''}
          {it.bought ? ` · Bought ${shortDate(it.bought)}` : ''}
        </T>
      </View>

      <View style={styles.kv}>
        <Stat v={String(it.wears)} l="wears" />
        <Stat v={c ? money(c) : '—'} l="cost per wear" line />
        <Stat v={ago(it.lastWorn)} l="last worn" line small />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn
          grow
          kind="primary"
          icon="builder"
          label="Style it"
          onPress={() => {
            st.setDraft({ name: `Styling the ${it.name}`, slots: bestOutfitWith(it, st.items), focus: slotOf(it) });
            router.replace('/builder');
          }}
        />
        <Btn
          grow
          icon="check"
          label="Wore it today"
          onPress={() => {
            st.wear({ [slotOf(it)]: it.id });
            st.toast(`Logged a wear for the ${it.name}`);
          }}
        />
      </View>

      <View>
        <T v="label">Pairs with {pairs.length} pieces you own</T>
        <T v="small" style={{ marginBottom: 10 }}>
          Most-worn first · {outfitsWith(it, st.items).length} complete outfits
        </T>
        {pairs.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}>
            {pairs.slice(0, 12).map((p) => (
              <Pressable key={p.id} onPress={() => router.setParams({ id: p.id })} accessibilityRole="button" accessibilityLabel={p.name}>
                <Tile w={p} size={64} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Note>Add more pieces to see what this goes with.</Note>
        )}
      </View>

      {shop.length > 0 && (
        <View style={{ gap: 8 }}>
          <View>
            <T v="label">Complete it</T>
            <T v="small">Pieces that pair with this one, ranked by outfits unlocked</T>
          </View>
          {shop.map(({ piece, unlock }) => (
            <Pressable key={piece.id} style={styles.shop} onPress={() => router.push({ pathname: '/compare/[id]', params: { id: piece.id } })} accessibilityRole="button">
              <Tile w={piece} size={54} bg={C.white} />
              <View style={{ flex: 1 }}>
                <T v="label" style={{ fontSize: 13.5 }}>
                  {piece.name}
                </T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="unlock" size={12} color={C.gapInk} />
                  <T v="tiny" style={{ color: C.gapInk, fontFamily: F.semibold }}>
                    Unlocks {unlock} outfits
                  </T>
                </View>
                <T v="tiny">
                  From {money(lowestPrice(piece))} at {piece.options.length} stores
                </T>
              </View>
              <Icon name="right" size={18} color={C.gapInk} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.provenance}>
        <Icon name={it.source === 'link' ? 'link' : it.source === 'photo' ? 'camera' : 'info'} size={16} color={C.ink3} />
        <T v="small" style={{ flex: 1 }}>
          {SOURCE[it.source]}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn size="sm" icon="pencil" label="Edit" onPress={() => setEditing(true)} />
        {confirmDelete ? (
          <Btn
            size="sm"
            kind="danger"
            label="Remove permanently"
            onPress={() => {
              st.removeItem(it.id);
              st.toast(`${it.name} removed`);
              router.back();
            }}
          />
        ) : (
          <Btn size="sm" kind="ghost" icon="trash" label="Remove" onPress={() => setConfirmDelete(true)} />
        )}
      </View>
    </ModalScreen>
  );
}

function Stat({ v, l, line, small }: { v: string; l: string; line?: boolean; small?: boolean }) {
  return (
    <View style={[{ flex: 1, padding: 12 }, line && { borderLeftWidth: 1, borderLeftColor: C.line }]}>
      <T style={{ fontFamily: F.serif, fontSize: small ? 18 : 24, lineHeight: small ? 24 : 26, color: C.ink }} numberOfLines={1} adjustsFontSizeToFit>
        {v}
      </T>
      <T v="tiny">{l}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  kv: { flexDirection: 'row', borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.panel },
  shop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: R.tile, backgroundColor: C.gapTint },
  provenance: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: C.panel2 },
});
