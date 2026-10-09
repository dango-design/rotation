'use client';

import { useMemo, useState } from 'react';
import { CATS, KNOWN_STORES, SWATCHES, TYPES } from '@/lib/catalog-meta';
import type { Cat, GarmentType, Item } from '@/lib/types';
import { Art, Icon } from './ui';

export type ItemFields = Omit<Item, 'id' | 'createdAt' | 'wears'> & { wears?: number };

const FORMALITY: [number, string][] = [
  [1, 'Relaxed'],
  [1.5, 'Casual'],
  [2, 'Smart casual'],
  [2.5, 'Smart'],
  [3, 'Tailored'],
];

export function ItemForm({
  initial,
  previewUrl,
  aiTagged,
  submitLabel = 'Save',
  onChangePhoto,
  onSubmit,
  onCancel,
}: {
  initial: Partial<ItemFields>;
  previewUrl?: string;
  aiTagged?: boolean;
  submitLabel?: string;
  /** Offered under the photo when there are other photos or cutouts to choose from. */
  onChangePhoto?: () => void;
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
  const [bought, setBought] = useState(initial.bought ?? '');
  const [f, setF] = useState<number>(initial.f ?? TYPES[initial.type ?? 'tee'].f);
  const [fTouched, setFTouched] = useState(initial.f !== undefined);

  const swatch = SWATCHES.find((s) => s.name === colorName) ?? SWATCHES[0];
  const typesInCat = useMemo(() => (Object.entries(TYPES) as [GarmentType, (typeof TYPES)[GarmentType]][]).filter(([, t]) => t.cat === cat), [cat]);

  const pickCat = (c: Cat) => {
    setCat(c);
    const first = (Object.entries(TYPES) as [GarmentType, (typeof TYPES)[GarmentType]][]).find(([, t]) => t.cat === c)![0];
    pickType(first);
  };
  const pickType = (t: GarmentType) => {
    setType(t);
    if (!fTouched) setF(TYPES[t].f);
  };

  // Keep the colorName the person typed if it isn't a swatch (e.g. "Stone"), but draw with the chosen swatch.
  const preview = { id: 'preview', name, type, cat, color: initial.colorName === colorName && initial.color ? initial.color : swatch.hex, colorName, tone: swatch.tone, f, pattern: swatch.pattern, denim: swatch.denim };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...initial,
      name: name.trim() || `${colorName} ${TYPES[type].label.toLowerCase()}`,
      type,
      cat,
      color: preview.color,
      colorName,
      tone: swatch.tone,
      pattern: swatch.pattern,
      denim: swatch.denim,
      f,
      brand: brand.trim(),
      store: store.trim() && store.trim() !== brand.trim() ? store.trim() : undefined,
      price: price ? Number(price) : undefined,
      size: size.trim() || undefined,
      bought: bought || undefined,
      source: initial.source ?? 'manual',
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className={`preview-row ${previewUrl ? 'has-photo' : ''}`}>
        <div className="preview-col">
          <div className="tile">{previewUrl ? <img className={`photo ${initial.source === 'link' && !initial.cutout ? 'on-white' : ''}`} src={previewUrl} alt="" /> : <Art w={preview} />}</div>
          {onChangePhoto && (
            <button type="button" className="btn sm" onClick={onChangePhoto}>
              <Icon name="camera" />
              Change photo
            </button>
          )}
        </div>
        <div>
          {aiTagged && (
            <span className="chip ai-chip" style={{ marginBottom: 8 }}>
              <Icon name="builder" />
              Suggested from the photo; check it
            </span>
          )}
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${colorName} ${TYPES[type].label.toLowerCase()}`} />
          </label>
        </div>
      </div>

      <div className="field">
        <span>Category</span>
        <div className="seg" style={{ flexWrap: 'wrap', borderRadius: 14 }}>
          {CATS.map((c) => (
            <button type="button" key={c.id} className={cat === c.id ? 'active' : ''} onClick={() => pickCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid2">
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => pickType(e.target.value as GarmentType)}>
            {typesInCat.map(([id, t]) => (
              <option key={id} value={id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>How dressy</span>
          <select
            value={f}
            onChange={(e) => {
              setF(Number(e.target.value));
              setFTouched(true);
            }}
          >
            {FORMALITY.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field">
        <span>Color · {colorName}</span>
        <div className="swatches">
          {SWATCHES.map((s) => (
            <button
              type="button"
              key={s.name}
              title={s.name}
              aria-label={s.name}
              className={`swatch ${colorName === s.name ? 'on' : ''} ${s.pattern ? 'stripe' : ''}`}
              style={{ background: s.hex }}
              onClick={() => setColorName(s.name)}
            />
          ))}
        </div>
      </div>

      <div className="grid2">
        <label className="field">
          <span>Brand</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} list="known-stores" placeholder="e.g. Uniqlo" />
        </label>
        <label className="field">
          <span>Bought at (if different)</span>
          <input value={store} onChange={(e) => setStore(e.target.value)} list="known-stores" placeholder="e.g. Nordstrom" />
        </label>
        <label className="field">
          <span>Price paid ($)</span>
          <input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="field">
          <span>Size</span>
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. M or 32 × 30" />
        </label>
        <label className="field">
          <span>Date bought</span>
          <input type="date" value={bought} onChange={(e) => setBought(e.target.value)} />
        </label>
      </div>
      <datalist id="known-stores">
        {KNOWN_STORES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
