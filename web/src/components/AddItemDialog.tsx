'use client';

import { useEffect, useRef, useState } from 'react';
import { nearestSwatch, swatchByName, TYPES } from '@/lib/catalog-meta';
import { hintFrom, PART_TYPE, pathWords, type Hint } from '@/lib/garment-hints';
import { useStore } from '@/lib/store';
import type { GarmentType } from '@/lib/types';
import { findInPhoto, findInProduct, toJpegBase64, type Found, type Piece } from '@/lib/vision/find';
import { warmUp } from '@/lib/vision/models';
import { ItemForm, type ItemFields } from './ItemForm';
import { Icon } from './ui';

type Step =
  | { kind: 'choose' }
  | { kind: 'working'; label: string; original?: string }
  | { kind: 'pick' }
  | { kind: 'link' }
  | { kind: 'form'; initial: Partial<ItemFields>; blob?: Blob; url?: string; ai?: boolean };

interface Tags {
  name?: string;
  type?: GarmentType;
  colorName?: string;
  brand?: string | null;
}

interface Product {
  title: string;
  brand: string | null;
  store: string;
  price: number | null;
  category: string;
  images: string[];
  url: string;
}

type Shown = Piece & { url: string };

/** Pieces found in one photo or product page, and which of them are being added. */
interface Session {
  from: 'photo' | 'link';
  sure: boolean;
  pieces: Shown[];
  selected: string[];
  /** Pieces still to add after the one in the form. */
  queue: string[];
  /** Position of the piece in the form, for "Piece 2 of 3". */
  index: number;
  total: number;
  product?: Product;
  hint?: Hint;
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

/** Form fields for a piece: Claude's tags first, then what the product name says, then what the parser saw. */
function fieldsFor(piece: Pick<Piece, 'part' | 'rgb' | 'cutout'>, tags: Tags | null, found: Session): Partial<ItemFields> {
  const sw = (tags?.colorName && swatchByName(tags.colorName)) || nearestSwatch(...piece.rgb);
  const fromHint = found.hint && (!piece.part || piece.part === found.hint.part) ? found.hint.type ?? PART_TYPE[found.hint.part] : undefined;
  const type = (tags?.type && TYPES[tags.type] ? tags.type : undefined) ?? fromHint ?? (piece.part ? PART_TYPE[piece.part] : undefined);
  const base: Partial<ItemFields> = {
    source: found.from,
    cutout: piece.cutout,
    name: tags?.name ?? '',
    brand: tags?.brand ?? '',
    colorName: sw.name,
    ...(type ? { type, cat: TYPES[type].cat } : {}),
  };
  const p = found.product;
  if (!p) return base;
  return { ...base, name: p.title || base.name, brand: p.brand || base.brand || p.store || '', store: p.brand && p.store !== p.brand ? p.store : undefined, price: p.price ?? undefined, link: p.url };
}

export function AddItemDialog({ onClose }: { onClose: () => void }) {
  const { addItem, toast, demo } = useStore();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [found, setFound] = useState<Session | null>(null);
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

  const show = (f: Found, from: Session['from'], extra: Pick<Session, 'product' | 'hint'> = {}): Session => ({
    from,
    sure: f.sure,
    pieces: f.pieces.map((p) => ({ ...p, url: track(URL.createObjectURL(p.blob)) })),
    selected: f.guess ? [f.guess] : [],
    queue: [],
    index: 0,
    total: 0,
    ...extra,
  });

  /** Tag the next piece in the queue and open its details. */
  const openNext = async (f: Session) => {
    const [id, ...queue] = f.queue;
    const piece = f.pieces.find((p) => p.id === id);
    if (!piece) return;
    const next = { ...f, queue, index: f.index + 1 };
    setFound(next);
    setStep({ kind: 'working', label: 'Reading the photo…', original: piece.url });
    const tags = await tagPhoto(piece.blob);
    setStep({ kind: 'form', initial: fieldsFor(piece, tags, next), blob: piece.blob, url: piece.url, ai: !!tags });
  };

  const add = (f: Session, ids: string[]) => openNext({ ...f, selected: ids, queue: ids, index: 0, total: ids.length });

  const onFile = async (file: File) => {
    setError('');
    const original = track(URL.createObjectURL(file));
    setStep({ kind: 'working', label: 'Finding the clothes in your photo…', original });
    try {
      // One retry covers a model download that was cut off.
      const result = await findInPhoto(file).catch(() => findInPhoto(file));
      const f = show(result, 'photo');
      setFound(f);
      if (f.sure) add(f, [f.pieces[0].id]);
      else setStep({ kind: 'pick' });
    } catch {
      setError("Couldn't remove the background, so the original photo will be used.");
      const f: Session = { from: 'photo', sure: false, pieces: [], selected: [], queue: [], index: 0, total: 1 };
      setFound(f);
      setStep({ kind: 'working', label: 'Reading the photo…', original });
      const tags = await tagPhoto(file);
      setStep({ kind: 'form', initial: fieldsFor({ rgb: [200, 200, 200], cutout: false }, tags, f), blob: file, url: original, ai: !!tags });
    }
  };

  const importLink = async () => {
    setError('');
    setStep({ kind: 'working', label: 'Reading the product page…' });
    let product: Product;
    try {
      const res = await fetch('/api/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: linkUrl }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'That page could not be read.');
      product = { ...d, url: linkUrl };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That page could not be read.');
      setStep({ kind: 'link' });
      return;
    }

    const hint = hintFrom(product.title, product.category, pathWords(product.url));
    let result: Found | null = null;
    if (product.images.length) {
      setStep({ kind: 'working', label: 'Finding the product in its photos…' });
      result = await findInProduct(product.images, hint, (done, total) =>
        setStep({ kind: 'working', label: total > 1 ? `Checking photo ${done} of ${total}…` : 'Removing the background…' }),
      ).catch(() => null);
    }
    if (!result) {
      // No usable photo: keep the details and draw the piece instead.
      if (product.images.length) setError("Couldn't load the product's photos, so we'll draw it instead.");
      const f: Session = { from: 'link', sure: false, pieces: [], selected: [], queue: [], index: 1, total: 1, product, hint };
      setFound(f);
      setStep({ kind: 'form', initial: fieldsFor({ rgb: [200, 200, 200], cutout: false }, null, f) });
      return;
    }
    const f = show(result, 'link', { product, hint });
    setFound(f);
    if (f.sure) add(f, [f.pieces[0].id]);
    else setStep({ kind: 'pick' });
  };

  const save = (fields: ItemFields, blob?: Blob) => {
    addItem(fields, blob);
    toast(`${fields.name} added to your closet${demo ? ' (demo, not saved)' : ''}`);
    if (found?.queue.length) return openNext(found);
    setFound(null);
    setError('');
    setStep({ kind: 'choose' });
    setLinkUrl('');
  };

  const toggle = (id: string) =>
    setFound((f) => {
      if (!f) return f;
      // A product page is one product, so pick one; a photo can hold several pieces worth adding.
      const selected = f.from === 'link' ? [id] : f.selected.includes(id) ? f.selected.filter((s) => s !== id) : [...f.selected, id];
      return { ...f, selected };
    });

  // "As one piece" isn't counted: it's the same pieces together, offered in case they are one.
  const cutouts = found?.pieces.filter((p) => p.cutout && !p.together).length ?? 0;
  const pickLede =
    found?.from === 'link'
      ? found.sure
        ? 'Here is what we found on the page. Pick the right piece, or use the photo as it is.'
        : "This page has a few photos, and we couldn't tell for sure which piece is the product. Pick it, or use the photo as it is."
      : cutouts > 1
        ? `We found ${cutouts} pieces in your photo. Pick the ones you want to add; each gets its own details next.`
        : found?.sure
          ? 'Pick the cutout, or use the photo as it is.'
          : "We couldn't find one clear piece in this photo. Pick the cutout if it looks right, or use the photo as it is.";
  const chosen = found?.selected.length ?? 0;

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
                onChange={(e) => {
                  if (e.target.files?.[0]) onFile(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <div className="add-options">
                <button className="add-opt rec" onClick={() => fileRef.current?.click()}>
                  <Icon name="camera" />
                  <b>Photo</b>
                  <small>Take or upload one; we find each piece and remove the background on your device</small>
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
              <div className="processing" role="status">
                <span className="spinner" />
                {step.label}
              </div>
            </>
          )}

          {step.kind === 'pick' && found && (
            <>
              <h2>{found.from === 'link' ? 'Which one is it?' : cutouts > 1 ? 'Which pieces?' : 'Does this look right?'}</h2>
              <p className="lede">{pickLede}</p>
              <div className="piece-picks" role="group" aria-label="Pieces found">
                {found.pieces.map((p) => {
                  const on = found.selected.includes(p.id);
                  return (
                    <button key={p.id} type="button" className={`piece-pick ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(p.id)}>
                      <div className="tile">
                        <img className={`photo ${p.cutout ? '' : 'as-is'}`} src={p.url} alt="" />
                        <span className="pick-check" aria-hidden="true">
                          <Icon name="check" />
                        </span>
                      </div>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setStep(found.from === 'link' ? { kind: 'link' } : { kind: 'choose' })}>
                  Back
                </button>
                <button type="button" className="btn primary" disabled={!chosen} onClick={() => add(found, found.selected)}>
                  {found.from === 'link' ? 'Use this one' : chosen > 1 ? `Add ${chosen} pieces` : 'Add this piece'}
                </button>
              </div>
            </>
          )}

          {step.kind === 'link' && (
            <>
              <h2>Add from a product link</h2>
              <p className="lede">Paste a product page from any online store. We read its name and price, find the product in its photos and remove the background.</p>
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
              {found && found.total > 1 && (
                <div className="eyebrow">
                  Piece {found.index} of {found.total}
                </div>
              )}
              <h2>Check the details</h2>
              <p className="lede">Type and color decide what it pairs with. Price makes cost per wear work.</p>
              {error && <p className="error-note">{error}</p>}
              {found && found.pieces.length > 1 && found.total <= 1 && (
                <button type="button" className="link" style={{ margin: '10px 0 4px', fontSize: 13 }} onClick={() => setStep({ kind: 'pick' })}>
                  Not the right piece? Choose another
                </button>
              )}
              <ItemForm
                key={`${found?.index ?? 0}-${step.url ?? ''}`}
                initial={step.initial}
                previewUrl={step.url}
                aiTagged={step.ai}
                submitLabel={found && found.queue.length ? 'Add and go to the next piece' : 'Add to closet'}
                onSubmit={(f) => save(f, step.blob)}
                onCancel={() => {
                  setFound(null);
                  setError('');
                  setStep({ kind: 'choose' });
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
