/* Adding a piece on the phone: take a photo, pick one from Photos, paste one, paste a product link, or describe it.
   Every photo's pieces are cut out on the phone (src/lib/cutout.ts): with Apple's subject lifting in the development
   build, and with the web app's piece finder everywhere, Expo Go included. When a photo holds several pieces, you pick
   which to add and each gets its own details, starting from the type and color the finder saw; a pair can stay one
   piece. A product link is read on the phone (src/lib/product-link.ts) and the finder picks the product out of the
   page's photos; when it isn't sure, you pick the cutout or another photo from the page, as on the web.
   Dragging pieces in from other apps still needs its own add-on (see mobile/README.md). */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { nearestSwatch, TYPES } from '@core/catalog-meta';
import { PART_TYPE } from '@core/garment-hints';
import { Icon, type IconName } from '@/components/Icon';
import { ItemForm, type ItemFields } from '@/components/ItemForm';
import { ModalScreen } from '@/components/ModalScreen';
import { usePieceFinder } from '@/components/PieceFinder';
import { Btn, T, tap } from '@/components/ui';
import { canCutOut, couldntStart, findPieces, fromFinder, keptAsIs, looksLikePair, nothingFound, type Cut, type FinderCut, type Pieces } from '@/lib/cutout';
import { linkIn, readLink, type Product } from '@/lib/product-link';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';

/** "Which one is it?" for a product page: the cutouts found so far, the one shown large, and a photo being read. */
type LinkPick = { kind: 'linkPick'; product: Product; pieces: FinderCut[]; shown: number; sure: boolean; busy: number | null };
type FormStep = { kind: 'form'; photo?: Cut; queue: Cut[]; total: number; note?: string; product?: Product; pick?: LinkPick };
type Step =
  | { kind: 'choose' }
  | { kind: 'link' }
  | { kind: 'reading'; label: string }
  | LinkPick
  | { kind: 'cutting'; photo: Cut }
  | { kind: 'pick'; photo: Cut; cut: Pieces; chosen: number[]; together: boolean }
  | FormStep
  | { kind: 'saving' };

const one = (photo?: Cut, note?: string): FormStep => ({ kind: 'form', photo, queue: [], total: 1, note });

/**
 * The details form's starting point: the type and color the finder saw, when it saw them. From a product page, also
 * its name, brand, store and price, and the type its name says, unless the finder saw a different kind of piece.
 */
function fieldsFor(c?: Cut & { cutout?: boolean }, p?: Product): Partial<ItemFields> {
  const f: Partial<ItemFields> = { source: p ? 'link' : c ? 'photo' : 'manual' };
  const fromName = p?.hint && (!c?.part || c.part === p.hint.part) ? (p.hint.type ?? PART_TYPE[p.hint.part]) : undefined;
  const type = fromName ?? (c?.part ? PART_TYPE[c.part] : undefined);
  if (type) {
    f.type = type;
    f.cat = TYPES[type].cat;
  }
  if (c?.rgb) f.colorName = nearestSwatch(...c.rgb).name;
  if (!p) return f;
  return {
    ...f,
    cutout: c?.cutout,
    name: p.title,
    brand: p.brand || p.store || '',
    store: p.brand && p.store !== p.brand ? p.store : undefined,
    price: p.price ?? undefined,
    link: p.url,
  };
}

export default function AddScreen() {
  const st = useStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [error, setError] = useState('');
  const [linkText, setLinkText] = useState('');
  // Mounted with the screen, so the finder's models are downloading while you choose a photo.
  const finder = usePieceFinder();
  const canFind = canCutOut || finder.available;
  // Counts each photo, so a cut that finishes after you've gone back doesn't jump ahead.
  const run = useRef(0);

  const restart = () => {
    run.current += 1;
    setError('');
    setStep({ kind: 'choose' });
  };

  const withPhoto = async (photo: Cut, pasted: boolean) => {
    if (!canFind) return setStep(one(photo, pasted ? undefined : keptAsIs));
    const mine = ++run.current;
    setStep({ kind: 'cutting', photo });
    const cut = await findPieces(photo, finder);
    if (mine !== run.current) return;
    if (cut === 'failed') return setStep(one(photo, couldntStart));
    if (!cut || !cut.pieces.length) return setStep(one(photo, nothingFound));
    if (cut.pieces.length === 1) return setStep(one(cut.pieces[0]));
    const together = looksLikePair(cut.pieces) && !!cut.together;
    setStep({ kind: 'pick', photo, cut, chosen: together ? [] : cut.pieces.map((_, i) => i), together });
  };

  const fromPicker = async (camera: boolean) => {
    setError('');
    if (camera && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError('Rotation needs the camera to photograph a piece. You can allow it in Settings, or pick a photo instead.');
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    withPhoto({ uri: a.uri, width: a.width, height: a.height }, false);
  };

  const paste = async () => {
    setError('');
    const has = await Clipboard.hasImageAsync().catch(() => false);
    const img = has ? await Clipboard.getImageAsync({ format: 'png' }).catch(() => null) : null;
    if (!img)
      return setError(
        canFind
          ? 'There’s no image to paste yet. Copy a photo of the piece in another app, then come back and paste.'
          : 'There’s no image to paste yet. In Photos, touch and hold the piece until it lifts out, tap Copy, then come back and paste.',
      );
    withPhoto({ uri: img.data, width: img.size.width, height: img.size.height }, true);
  };

  const pasteLink = async () => {
    setError('');
    const link = linkIn(await Clipboard.getStringAsync().catch(() => ''));
    if (link) setLinkText(link);
    else setError('There’s no link to paste yet. Copy the product page’s address in Safari or the store’s app, then come back and paste.');
  };

  const importLink = async () => {
    setError('');
    const mine = ++run.current;
    setStep({ kind: 'reading', label: 'Reading the product page…' });
    let product: Product;
    try {
      product = await readLink(linkText);
    } catch (e) {
      if (mine !== run.current) return;
      setError(e instanceof Error ? e.message : 'That page could not be read.');
      return setStep({ kind: 'link' });
    }
    if (mine !== run.current) return;
    const found = product.images.length
      ? (setStep({ kind: 'reading', label: 'Finding the product in its photos…' }),
        await finder.findProduct(product.images, product.hint, (done, total) => {
          if (mine === run.current) setStep({ kind: 'reading', label: total > 1 ? `Checking photo ${done} of ${total}…` : 'Removing the background…' });
        }))
      : null;
    if (mine !== run.current) return;
    if (!found || !found.pieces.length) {
      // No usable photo: keep the details and draw the piece instead.
      const note = product.images.length ? "Couldn't load the product's photos, so it's drawn from its type and color instead." : undefined;
      return setStep({ ...one(undefined, note), product });
    }
    const pick: LinkPick = { kind: 'linkPick', product, pieces: fromFinder(found.pieces), shown: found.guess ?? 0, sure: found.sure, busy: null };
    setStep(found.sure ? { ...one(pick.pieces[pick.shown]), product, pick } : pick);
  };

  /** The person picked a photo from the page: show its cutout, finding the product in it first if it wasn't checked. */
  const pickPhoto = async (pick: LinkPick, i: number) => {
    const have = pick.pieces.findIndex((p) => p.photo === i && p.cutout);
    const any = have >= 0 ? have : pick.pieces.findIndex((p) => p.photo === i);
    if (any >= 0) return setStep({ ...pick, shown: any });
    setError('');
    setStep({ ...pick, busy: i });
    const found = await finder.findProductPhoto(pick.product.images[i], i, pick.product.hint);
    if (!found || !found.pieces.length) setError('Couldn’t read that photo. Try another one.');
    setStep((cur) => {
      if (cur.kind !== 'linkPick') return cur;
      if (!found || !found.pieces.length) return { ...cur, busy: null };
      return { ...cur, pieces: [...fromFinder(found.pieces), ...cur.pieces], shown: 0, busy: null };
    });
  };

  const save = async (f: ItemFields, form: FormStep) => {
    setStep({ kind: 'saving' });
    try {
      await st.addItem(f, form.photo);
      if (form.queue.length) {
        st.toast(`${f.name} added`);
        setStep({ kind: 'form', photo: form.queue[0], queue: form.queue.slice(1), total: form.total });
        return;
      }
      st.toast(`${form.total > 1 ? `${form.total} pieces` : f.name} added to your closet${st.demo ? ' (demo, not saved)' : ''}`);
      router.back();
    } catch {
      setError("Couldn't save that photo. Try again, or describe the piece instead.");
      setStep(form);
    }
  };

  // The finder's web view stays mounted across the steps, so its models load once per visit.
  const screen = (() => {
    if (step.kind === 'form') {
      const n = step.total - step.queue.length;
      return (
        <ModalScreen eyebrow={step.total > 1 ? `Piece ${n} of ${step.total}` : 'Add pieces'} onClose={restart}>
          <T v="h2">Check the details</T>
          <T>Type and color decide what it pairs with. Price makes cost per wear work.</T>
          {step.note ? <T v="small">{step.note}</T> : null}
          {error ? <T style={{ color: C.warn }}>{error}</T> : null}
          {step.pick ? <Btn kind="default" size="sm" icon="camera" label="Change photo" style={{ alignSelf: 'flex-start' }} onPress={() => setStep(step.pick!)} /> : null}
          <ItemForm
            key={step.photo?.uri ?? 'described'}
            initial={fieldsFor(step.photo, step.product)}
            previewUrl={step.photo?.uri}
            submitLabel={step.queue.length ? 'Add and go to the next piece' : 'Add to closet'}
            onSubmit={(f) => save(f, step)}
            onCancel={restart}
          />
        </ModalScreen>
      );
    }

    if (step.kind === 'link')
      return (
        <ModalScreen eyebrow="Add from a link" onClose={restart}>
          <T v="h2">Add from a product link</T>
          <T>Paste a product page from any online store. Rotation reads its name and price, finds the product in its photos and removes the background, all on your phone.</T>
          <View style={{ gap: 6 }}>
            <T v="tiny" style={{ fontFamily: F.semibold, color: C.ink2 }}>
              Product link
            </T>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={linkText}
                onChangeText={setLinkText}
                placeholder="https://…"
                placeholderTextColor={C.ink3}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="go"
                onSubmitEditing={() => linkText.trim() && importLink()}
                style={[styles.input, { flex: 1 }]}
              />
              <Btn size="sm" label="Paste" onPress={pasteLink} />
            </View>
          </View>
          {error ? <T style={{ color: C.warn }}>{error} You can still add it by photo or description.</T> : null}
          <View style={styles.actions}>
            <Btn kind="ghost" label="Back" onPress={restart} />
            <Btn kind="primary" label="Read the page" disabled={!linkText.trim()} onPress={importLink} />
          </View>
        </ModalScreen>
      );

    if (step.kind === 'reading')
      return (
        <ModalScreen eyebrow="Add from a link" onClose={restart}>
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 14 }}>
            <ActivityIndicator color={C.ink} />
            <T>{step.label}</T>
            {finder.status === 'loading' ? (
              <T v="small" style={{ textAlign: 'center' }}>
                The first time takes a little longer while the cutout tools download.
              </T>
            ) : null}
          </View>
        </ModalScreen>
      );

    if (step.kind === 'linkPick') {
      const { product, pieces, sure, busy } = step;
      const big = pieces[step.shown] ?? pieces[0];
      const photos = product.images.slice(0, 12);
      return (
        <ModalScreen eyebrow="Add from a link" onClose={restart}>
          <T v="h2">Which one is it?</T>
          <T>
            {sure
              ? "Here's the piece we found. If it isn't right, or the photo cuts it off, pick another cutout or another photo from the page."
              : "We couldn't tell for sure which piece is the product. Pick it, or choose a photo from the page that shows all of it."}
          </T>
          <View style={{ gap: 8 }}>
            <View style={styles.big}>
              <Image source={{ uri: big.uri }} style={{ width: '92%', height: '92%' }} contentFit="contain" />
            </View>
            <T v="label" style={{ fontSize: 13 }}>
              {big.label}
              {big.photo !== undefined && photos.length > 1 ? ` · photo ${big.photo + 1} of ${photos.length}` : ''}
            </T>
            {big.clipped ? <T v="small" style={{ color: C.warn }}>The photo cuts this piece off. Try another photo from the page.</T> : null}
          </View>
          {pieces.length > 1 && (
            <View style={styles.picks}>
              {pieces.map((p, i) => (
                <PickCard key={p.uri} uri={p.uri} label={p.label ?? `Piece ${i + 1}`} on={i === step.shown} white={!p.cutout} onPress={() => setStep({ ...step, shown: i })} />
              ))}
            </View>
          )}
          {photos.length > 1 && (
            <View style={{ gap: 8 }}>
              <T v="eyebrow">Photos on the page</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {photos.map((u, i) => {
                  const on = big.photo === i;
                  return (
                    <Pressable
                      key={u}
                      accessibilityRole="button"
                      accessibilityLabel={`Use photo ${i + 1} from the page`}
                      accessibilityState={{ selected: on }}
                      disabled={busy !== null}
                      onPress={() => {
                        tap();
                        pickPhoto(step, i);
                      }}
                      style={[styles.strip, on && styles.stripOn]}
                    >
                      <Image source={{ uri: u }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {busy === i && (
                        <View style={styles.stripBusy}>
                          <ActivityIndicator color={C.ink} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <T v="small">Pick the photo that shows the whole piece, and we&apos;ll cut it out.</T>
            </View>
          )}
          {error ? <T style={{ color: C.warn }}>{error}</T> : null}
          <View style={styles.actions}>
            <Btn kind="ghost" label="Back" onPress={() => setStep({ kind: 'link' })} />
            <Btn kind="primary" label="Use this one" disabled={busy !== null} onPress={() => setStep({ ...one(big), product, pick: step })} />
          </View>
        </ModalScreen>
      );
    }

    if (step.kind === 'cutting')
      return (
        <ModalScreen eyebrow="Add pieces" onClose={restart}>
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 14 }}>
            <View style={styles.cutting}>
              <Image source={{ uri: step.photo.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
            </View>
            <ActivityIndicator color={C.ink} />
            <T>Cutting out the piece…</T>
            {finder.status === 'loading' && !canCutOut ? (
              <T v="small" style={{ textAlign: 'center' }}>
                The first time takes a little longer while the cutout tools download.
              </T>
            ) : null}
          </View>
        </ModalScreen>
      );

    if (step.kind === 'pick') {
      const { cut, chosen, together } = step;
      const count = together ? 1 : chosen.length;
      const toggle = (i: number) => setStep({ ...step, together: false, chosen: chosen.includes(i) ? chosen.filter((x) => x !== i) : [...chosen, i].sort((a, b) => a - b) });
      const keepTogether = () => setStep({ ...step, together: !together, chosen: together ? cut.pieces.map((_, i) => i) : [] });
      const add = () => {
        const photos = together && cut.together ? [cut.together] : chosen.map((i) => cut.pieces[i]);
        setStep({ kind: 'form', photo: photos[0], queue: photos.slice(1), total: photos.length });
      };
      return (
        <ModalScreen eyebrow="Add pieces" onClose={restart}>
          <T v="h2">Which pieces?</T>
          <T>
            We found {cut.pieces.length} pieces in your photo. Pick the ones to add; each gets its own details next. A pair, like shoes, can stay together as one piece.
          </T>
          <View style={styles.picks}>
            {cut.pieces.map((p, i) => (
              <PickCard key={p.uri} uri={p.uri} label={p.label ?? `Piece ${i + 1}`} on={!together && chosen.includes(i)} onPress={() => toggle(i)} />
            ))}
            {cut.together && <PickCard uri={cut.together.uri} label="All together as one piece" on={together} onPress={keepTogether} />}
          </View>
          <View style={styles.actions}>
            <Btn kind="ghost" label="Use the photo as it is" onPress={() => setStep(one(step.photo))} />
            <Btn kind="primary" label={count > 1 ? `Add ${count} pieces` : 'Add this piece'} disabled={!count} onPress={add} />
          </View>
        </ModalScreen>
      );
    }

    if (step.kind === 'saving')
      return (
        <ModalScreen eyebrow="Add pieces">
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color={C.ink} />
            <T>Saving to your closet…</T>
          </View>
        </ModalScreen>
      );

    return (
      <ModalScreen eyebrow="Add pieces">
        <T v="h2">Add pieces</T>
        <T>{canFind ? 'A photo is fastest for anything you own. The background is cut out on your phone.' : 'A photo is fastest for anything you own. For a clean cutout, paste one from Photos.'}</T>
        <View style={{ gap: 10 }}>
          <Option icon="camera" title="Take a photo" sub="Lay it flat on a plain surface" recommended onPress={() => fromPicker(true)} />
          <Option icon="photos" title="Choose from Photos" sub="Any photo of the piece" onPress={() => fromPicker(false)} />
          {canFind ? (
            <Option icon="paste" title="Paste a photo" sub="Copy a photo of the piece in another app, then paste it here" onPress={paste} />
          ) : (
            <Option icon="paste" title="Paste a cutout" sub="In Photos, touch and hold the piece, tap Copy, then paste here" onPress={paste} />
          )}
          <Option icon="pencil" title="Describe it" sub="Pick the type and color; we draw it for you" onPress={() => setStep(one())} />
          {finder.available ? (
          <Option
            icon="link"
            title="Product link"
            sub="Paste a link from any online store"
            onPress={() => {
              setError('');
              setStep({ kind: 'link' });
            }}
          />
        ) : (
          <Option icon="link" title="Product link" sub="Use the web app for product links" disabled />
        )}
        </View>
        {error ? <T style={{ color: C.warn }}>{error}</T> : null}
      </ModalScreen>
    );
  })();

  return (
    <View style={{ flex: 1 }}>
      {screen}
      {finder.host}
    </View>
  );
}

function PickCard({ uri, label, on, onPress, white }: { uri: string; label: string; on: boolean; onPress: () => void; white?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.pick, on && styles.pickOn]}
    >
      <View style={[styles.pickTile, white && { backgroundColor: C.white }]}>
        <Image source={{ uri }} style={{ width: '88%', height: '88%' }} contentFit="contain" />
        <View style={[styles.check, on && styles.checkOn]}>{on && <Icon name="check" size={13} color={C.white} width={2.6} />}</View>
      </View>
      <T v="label" style={{ fontSize: 13 }} numberOfLines={2}>
        {label}
      </T>
    </Pressable>
  );
}

function Option({ icon, title, sub, onPress, recommended, disabled }: { icon: IconName; title: string; sub: string; onPress?: () => void; recommended?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.opt, recommended && styles.rec, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }]}
    >
      <View style={[styles.optIcon, recommended && { backgroundColor: C.ink }]}>
        <Icon name={icon} size={20} color={recommended ? C.white : C.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="label" style={{ fontFamily: F.semibold }}>
          {title}
        </T>
        <T v="small">{sub}</T>
      </View>
      {!disabled && <Icon name="right" size={18} color={C.ink3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.tile + 2, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  rec: { borderColor: C.ink, borderWidth: 1.5 },
  optIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.tile, alignItems: 'center', justifyContent: 'center' },
  cutting: { width: 180, height: 180, borderRadius: R.tile, backgroundColor: C.tile, overflow: 'hidden' },
  picks: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pick: { width: '47%', flexGrow: 1, gap: 8, padding: 8, paddingBottom: 10, borderRadius: R.tile + 2, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.panel },
  pickOn: { borderColor: C.ink, borderWidth: 2.5, padding: 7, paddingBottom: 9 },
  pickTile: { aspectRatio: 1, borderRadius: R.tile - 3, backgroundColor: C.tile, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.line2, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.ink, borderColor: C.ink },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' },
  input: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.panel, paddingHorizontal: 12, fontFamily: F.sans, fontSize: 15, color: C.ink },
  big: { aspectRatio: 1, width: '100%', maxWidth: 340, alignSelf: 'center', borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  strip: { width: 66, aspectRatio: 3 / 4, borderRadius: 9, overflow: 'hidden', borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  stripOn: { borderColor: C.ink, borderWidth: 2.5 },
  stripBusy: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
});
