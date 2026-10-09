/* The details of a piece: type and color decide what it pairs with; price makes cost per wear work.
   Same fields and defaults as the web form. */

import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { CATS, KNOWN_STORES, SWATCHES, TYPES } from '@core/catalog-meta';
import type { Cat, GarmentType, Item } from '@core/types';
import { C, F, GUTTER, R } from '@/theme';
import { Tile } from './Art';
import { Icon } from './Icon';
import { Btn, Chip, FilterChip, T, tap } from './ui';

export type ItemFields = Omit<Item, 'id' | 'createdAt' | 'wears'> & { wears?: number };

const FORMALITY: [number, string][] = [
  [1, 'Relaxed'],
  [1.5, 'Casual'],
  [2, 'Smart casual'],
  [2.5, 'Smart'],
  [3, 'Tailored'],
];

const typesIn = (cat: Cat) => (Object.entries(TYPES) as [GarmentType, (typeof TYPES)[GarmentType]][]).filter(([, t]) => t.cat === cat);

export function ItemForm({
  initial,
  previewUrl,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: {
  initial: Partial<ItemFields>;
  previewUrl?: string;
  submitLabel?: string;
  onSubmit: (f: ItemFields) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<GarmentType>(initial.type ?? 'tee');
  const [cat, setCat] = useState<Cat>(initial.cat ?? TYPES[initial.type ?? 'tee'].cat);
  const [colorName, setColorName] = useState(initial.colorName ?? 'White');
  const [name, setName] = useState(initial.name ?? '');
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [store, setStore] = useState(initial.store ?? '');
  const [price, setPrice] = useState(initial.price ? String(initial.price) : '');
  const [size, setSize] = useState(initial.size ?? '');
  const [f, setF] = useState<number>(initial.f ?? TYPES[initial.type ?? 'tee'].f);
  const [fTouched, setFTouched] = useState(initial.f !== undefined);

  const swatch = SWATCHES.find((s) => s.name === colorName) ?? SWATCHES[0];
  const pickType = (t: GarmentType) => {
    setType(t);
    if (!fTouched) setF(TYPES[t].f);
  };
  const pickCat = (c: Cat) => {
    setCat(c);
    pickType(typesIn(c)[0][0]);
  };

  // Keep a color name that isn't a swatch (e.g. "Stone"), but draw with the chosen swatch.
  const color = initial.colorName === colorName && initial.color ? initial.color : swatch.hex;
  const preview = { id: 'preview', name, type, cat, color, colorName, tone: swatch.tone, f, pattern: swatch.pattern, denim: swatch.denim };
  const fallbackName = `${colorName} ${TYPES[type].label.toLowerCase()}`;
  const storeHint = KNOWN_STORES.find((s) => brand.trim().length > 1 && s.toLowerCase().startsWith(brand.trim().toLowerCase()) && s !== brand.trim());

  const submit = () =>
    onSubmit({
      ...initial,
      name: name.trim() || fallbackName,
      type,
      cat,
      color,
      colorName,
      tone: swatch.tone,
      pattern: swatch.pattern,
      denim: swatch.denim,
      f,
      brand: brand.trim(),
      store: store.trim() && store.trim() !== brand.trim() ? store.trim() : undefined,
      price: price ? Number(price.replace(/[^0-9.]/g, '')) || undefined : undefined,
      size: size.trim() || undefined,
      source: initial.source ?? 'manual',
    });

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 112 }}>
          {previewUrl ? (
            <View style={[styles.photo, initial.source === 'link' && { backgroundColor: C.white }]}>
              <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            </View>
          ) : (
            <Tile w={preview} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Name">
            <TextInput value={name} onChangeText={setName} placeholder={fallbackName} placeholderTextColor={C.ink3} style={styles.input} />
          </Field>
        </View>
      </View>

      <Field label="Category">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 6 }}>
          {CATS.map((c) => (
            <FilterChip key={c.id} label={c.label} on={cat === c.id} onPress={() => pickCat(c.id)} />
          ))}
        </ScrollView>
      </Field>

      <Field label="Type">
        <View style={styles.wrap}>
          {typesIn(cat).map(([id, t]) => (
            <FilterChip key={id} label={t.label} on={type === id} onPress={() => pickType(id)} />
          ))}
        </View>
      </Field>

      <Field label="How dressy">
        <View style={styles.wrap}>
          {FORMALITY.map(([v, l]) => (
            <FilterChip
              key={v}
              label={l}
              on={f === v}
              onPress={() => {
                setF(v);
                setFTouched(true);
              }}
            />
          ))}
        </View>
      </Field>

      <Field label={`Color · ${colorName}`}>
        <View style={styles.wrap}>
          {SWATCHES.map((s) => {
            const on = colorName === s.name;
            return (
              <Pressable
                key={s.name}
                accessibilityRole="button"
                accessibilityLabel={s.name}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  tap();
                  setColorName(s.name);
                }}
                style={[styles.swatch, { backgroundColor: s.hex }, on && styles.swatchOn]}
              >
                {s.pattern === 'stripe' && <View style={styles.stripe} />}
                {on && <Icon name="check" size={14} color={s.tone === 'neutral' && ['White', 'Ecru', 'Oatmeal', 'Light Blue', 'Silver', 'Navy Stripe'].includes(s.name) ? C.ink : C.white} width={2.6} />}
              </Pressable>
            );
          })}
        </View>
      </Field>

      <View style={styles.grid2}>
        <Field label="Brand" style={{ flex: 1 }}>
          <TextInput value={brand} onChangeText={setBrand} placeholder="e.g. Uniqlo" placeholderTextColor={C.ink3} style={styles.input} autoCapitalize="words" />
          {storeHint && (
            <Pressable onPress={() => setBrand(storeHint)} accessibilityRole="button">
              <Chip label={storeHint} icon="check" tone="gap" style={{ marginTop: 6 }} />
            </Pressable>
          )}
        </Field>
        <Field label="Bought at (if different)" style={{ flex: 1 }}>
          <TextInput value={store} onChangeText={setStore} placeholder="e.g. Nordstrom" placeholderTextColor={C.ink3} style={styles.input} autoCapitalize="words" />
        </Field>
      </View>
      <View style={styles.grid2}>
        <Field label="Price paid ($)" style={{ flex: 1 }}>
          <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.ink3} style={styles.input} />
        </Field>
        <Field label="Size" style={{ flex: 1 }}>
          <TextInput value={size} onChangeText={setSize} placeholder="e.g. M or 32 × 30" placeholderTextColor={C.ink3} style={styles.input} />
        </Field>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <Btn kind="ghost" label="Cancel" onPress={onCancel} />
        <Btn kind="primary" label={submitLabel} onPress={submit} />
      </View>
    </View>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <T v="tiny" style={{ fontFamily: F.semibold, color: C.ink2 }}>
        {label}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { aspectRatio: 1, borderRadius: R.tile, backgroundColor: C.tile, overflow: 'hidden' },
  input: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.panel, paddingHorizontal: 12, fontFamily: F.sans, fontSize: 15, color: C.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(28,27,25,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  swatchOn: { borderWidth: 2.5, borderColor: C.ink },
  stripe: { position: 'absolute', left: 0, right: 0, top: 14, height: 6, backgroundColor: '#25324B' },
  grid2: { flexDirection: 'row', gap: 10 },
});
