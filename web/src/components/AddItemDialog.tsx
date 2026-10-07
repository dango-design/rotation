'use client';

import { useEffect, useRef, useState } from 'react';
import { averageColor, removeBackground, toJpegBase64, warmUp } from '@/lib/bgremove';
import { nearestSwatch, swatchByName, TYPES } from '@/lib/catalog-meta';
import { useStore } from '@/lib/store';
import type { GarmentType } from '@/lib/types';
import { ItemForm, type ItemFields } from './ItemForm';
import { Icon } from './ui';

type Step =
  | { kind: 'choose' }
  | { kind: 'working'; label: string; original?: string }
  | { kind: 'pick'; original: string; cutout: string; originalBlob: Blob; cutoutBlob: Blob; rgb: [number, number, number] }
  | { kind: 'link' }
  | { kind: 'form'; initial: Partial<ItemFields>; blob?: Blob; url?: string; ai?: boolean };

interface Tags {
  name?: string;
  type?: GarmentType;
  colorName?: string;
  brand?: string | null;
}

/** Ask the server to tag a photo with Claude; returns null when tagging is off or fails. */
async function tagPhoto(blob: Blob): Promise<Tags | null> {
  try {
    const image = await toJpegBase64(blob);
    const res = await fetch('/api/tag', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image }) });
    if (!res.ok) return null;
    return (await res.json()) as Tags;
  } catch {
    return null;
  }
}

function fieldsFrom(tags: Tags | null, rgb: [number, number, number], source: ItemFields['source']): Partial<ItemFields> {
  const sw = (tags?.colorName && swatchByName(tags.colorName)) || nearestSwatch(...rgb);
  const type = tags?.type && TYPES[tags.type] ? tags.type : undefined;
  return {
    source,
    name: tags?.name ?? '',
    brand: tags?.brand ?? '',
    colorName: sw.name,
    ...(type ? { type, cat: TYPES[type].cat } : {}),
  };
}

export function AddItemDialog({ onClose }: { onClose: () => void }) {
  const { addItem, toast, demo } = useStore();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [error, setError] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const track = (u: string) => (urls.current.push(u), u);

  useEffect(() => {
    warmUp();
    const tracked = urls.current;
    return () => tracked.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const onFile = async (file: File) => {
    setError('');
    const original = track(URL.createObjectURL(file));
    setStep({ kind: 'working', label: 'Removing the background…', original });
    try {
      const cut = await removeBackground(file);
      setStep({ kind: 'pick', original, cutout: track(URL.createObjectURL(cut.blob)), originalBlob: file, cutoutBlob: cut.blob, rgb: cut.rgb });
    } catch {
      setError("Couldn't remove the background, so the original photo will be used.");
      const rgb = await averageColor(file).catch(() => [200, 200, 200] as [number, number, number]);
      setStep({ kind: 'working', label: 'Reading the photo…', original });
      const tags = await tagPhoto(file);
      setStep({ kind: 'form', initial: fieldsFrom(tags, rgb, 'photo'), blob: file, url: original, ai: !!tags });
    }
  };

  const choosePhoto = async (which: 'cutout' | 'original') => {
    if (step.kind !== 'pick') return;
    const blob = which === 'cutout' ? step.cutoutBlob : step.originalBlob;
    const url = which === 'cutout' ? step.cutout : step.original;
    const rgb = step.rgb;
    setStep({ kind: 'working', label: 'Reading the photo…', original: url });
    const tags = await tagPhoto(blob);
    setStep({ kind: 'form', initial: fieldsFrom(tags, rgb, 'photo'), blob, url, ai: !!tags });
  };

  const importLink = async () => {
    setError('');
    setStep({ kind: 'working', label: 'Reading the product page…' });
    try {
      const res = await fetch('/api/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: linkUrl }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'That page could not be read.');
      let blob: Blob | undefined;
      let url: string | undefined;
      let rgb: [number, number, number] = [200, 200, 200];
      if (d.image) {
        blob = await (await fetch(d.image)).blob();
        url = track(URL.createObjectURL(blob));
        rgb = await averageColor(blob).catch(() => rgb);
      }
      const tags = blob ? await tagPhoto(blob) : null;
      const initial = fieldsFrom(tags, rgb, 'link');
      setStep({
        kind: 'form',
        initial: { ...initial, name: d.title || initial.name, brand: d.brand || initial.brand || d.store || '', store: d.store && d.store !== d.brand ? d.store : undefined, price: d.price ?? undefined, link: linkUrl },
        blob,
        url,
        ai: !!tags,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That page could not be read.');
      setStep({ kind: 'link' });
    }
  };

  const save = (f: ItemFields, blob?: Blob) => {
    addItem(f, blob);
    toast(`${f.name} added to your closet${demo ? ' (demo, not saved)' : ''}`);
    setStep({ kind: 'choose' });
    setLinkUrl('');
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal-wrap">
        <div className="modal" role="dialog" aria-label="Add pieces">
          <button className="icon-btn close" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>

          {step.kind === 'choose' && (
            <>
              <h2>Add pieces</h2>
              <p className="lede">A photo is fastest for anything you own. Product links work for things you bought online.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              <div className="add-options">
                <button className="add-opt rec" onClick={() => fileRef.current?.click()}>
                  <Icon name="camera" />
                  <b>Photo</b>
                  <small>Take or upload one; the background is removed on your device</small>
                </button>
                <button className="add-opt" onClick={() => setStep({ kind: 'link' })}>
                  <Icon name="link" />
                  <b>Product link</b>
                  <small>Paste a link from any online store</small>
                </button>
                <button className="add-opt" onClick={() => setStep({ kind: 'form', initial: { source: 'manual' } })}>
                  <Icon name="pencil" />
                  <b>Describe it</b>
                  <small>Pick the type and color; we draw it for you</small>
                </button>
                <div className="add-opt" style={{ opacity: 0.6, cursor: 'default' }}>
                  <Icon name="mail" />
                  <b>Order emails</b>
                  <small>Coming soon: build your closet from receipts automatically</small>
                </div>
              </div>
              {error && <p className="error-note" style={{ marginTop: 12 }}>{error}</p>}
            </>
          )}

          {step.kind === 'working' && (
            <>
              <h2>One moment</h2>
              {step.original && (
                <div className="tile" style={{ width: 200, margin: '16px 0' }}>
                  <img className="photo" src={step.original} alt="" />
                </div>
              )}
              <div className="processing">
                <span className="spinner" />
                {step.label}
              </div>
            </>
          )}

          {step.kind === 'pick' && (
            <>
              <h2>Which looks right?</h2>
              <p className="lede">Background removal is automatic and usually works best on a plain surface.</p>
              <div className="grid2" style={{ marginTop: 16 }}>
                <button className="add-opt rec" onClick={() => choosePhoto('cutout')}>
                  <div className="tile">
                    <img className="photo" src={step.cutout} alt="Background removed" />
                  </div>
                  <b>Background removed</b>
                </button>
                <button className="add-opt" onClick={() => choosePhoto('original')}>
                  <div className="tile">
                    <img className="photo" src={step.original} alt="Original" />
                  </div>
                  <b>Keep the original</b>
                </button>
              </div>
            </>
          )}

          {step.kind === 'link' && (
            <>
              <h2>Add from a product link</h2>
              <p className="lede">Paste a product page from any online store. We read its name, photo and price.</p>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  importLink();
                }}
              >
                <label className="field">
                  <span>Product link</span>
                  <input type="url" required placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} autoFocus />
                </label>
                {error && <p className="error-note">{error} You can still add it by photo or description.</p>}
                <div className="modal-actions">
                  <button type="button" className="btn ghost" onClick={() => setStep({ kind: 'choose' })}>
                    Back
                  </button>
                  <button type="submit" className="btn primary">
                    Read the page
                  </button>
                </div>
              </form>
            </>
          )}

          {step.kind === 'form' && (
            <>
              <h2>Check the details</h2>
              <p className="lede">Type and color decide what it pairs with. Price makes cost per wear work.</p>
              {error && <p className="error-note">{error}</p>}
              <ItemForm
                initial={step.initial}
                previewUrl={step.url}
                aiTagged={step.ai}
                submitLabel="Add to closet"
                onSubmit={(f) => save(f, step.blob)}
                onCancel={() => setStep({ kind: 'choose' })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
