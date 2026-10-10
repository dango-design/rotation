/* Adding a piece on the phone: take a photo, pick one from Photos, paste one, or describe it.
   On an iPhone with iOS 17 or later, every photo's background is cut out on the phone (src/lib/cutout.ts). When a
   photo holds several pieces, you pick which to add and each gets its own details; a pair can stay one piece.
   Expo Go doesn't include the cutout module, so there a photo is kept as it is, and a cutout copied from Photos still
   pastes in clean. Dragging pieces in from other apps still needs its own add-on (see mobile/README.md). */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { ItemForm, type ItemFields } from '@/components/ItemForm';
import { ModalScreen } from '@/components/ModalScreen';
import { Btn, T, tap } from '@/components/ui';
import { canCutOut, cutOut, keptAsIs, looksLikePair, type CutResult } from '@/lib/cutout';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';

type Photo = { uri: string; width?: number; height?: number };
type FormStep = { kind: 'form'; photo?: Photo; queue: Photo[]; total: number; note?: string };
type Step =
  | { kind: 'choose' }
  | { kind: 'cutting'; photo: Photo }
  | { kind: 'pick'; photo: Photo; cut: CutResult; chosen: number[]; together: boolean }
  | FormStep
  | { kind: 'saving' };

const one = (photo?: Photo, note?: string): FormStep => ({ kind: 'form', photo, queue: [], total: 1, note });

export default function AddScreen() {
  const st = useStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [error, setError] = useState('');
  // Counts each photo, so a cut that finishes after you've gone back doesn't jump ahead.
  const run = useRef(0);

  const restart = () => {
    run.current += 1;
    setError('');
    setStep({ kind: 'choose' });
  };

  const withPhoto = async (photo: Photo, pasted: boolean) => {
    if (!canCutOut) return setStep(one(photo, pasted ? undefined : keptAsIs));
    const mine = ++run.current;
    setStep({ kind: 'cutting', photo });
    const cut = await cutOut(photo.uri);
    if (mine !== run.current) return;
    if (!cut || !cut.pieces.length) return setStep(one(photo, 'No piece stood out from the background, so the photo is kept as it is.'));
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
        canCutOut
          ? 'There’s no image to paste yet. Copy a photo of the piece in another app, then come back and paste.'
          : 'There’s no image to paste yet. In Photos, touch and hold the piece until it lifts out, tap Copy, then come back and paste.',
      );
    withPhoto({ uri: img.data, width: img.size.width, height: img.size.height }, true);
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

  if (step.kind === 'form') {
    const n = step.total - step.queue.length;
    return (
      <ModalScreen eyebrow={step.total > 1 ? `Piece ${n} of ${step.total}` : 'Add pieces'} onClose={restart}>
        <T v="h2">Check the details</T>
        <T>Type and color decide what it pairs with. Price makes cost per wear work.</T>
        {step.note ? <T v="small">{step.note}</T> : null}
        {error ? <T style={{ color: C.warn }}>{error}</T> : null}
        <ItemForm
          key={step.photo?.uri ?? 'described'}
          initial={{ source: step.photo ? 'photo' : 'manual' }}
          previewUrl={step.photo?.uri}
          submitLabel={step.queue.length ? 'Add and go to the next piece' : 'Add to closet'}
          onSubmit={(f) => save(f, step)}
          onCancel={restart}
        />
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
            <PickCard key={p.uri} uri={p.uri} label={`Piece ${i + 1}`} on={!together && chosen.includes(i)} onPress={() => toggle(i)} />
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
      <T>{canCutOut ? 'A photo is fastest for anything you own. The background is cut out on your phone.' : 'A photo is fastest for anything you own. For a clean cutout, paste one from Photos.'}</T>
      <View style={{ gap: 10 }}>
        <Option icon="camera" title="Take a photo" sub="Lay it flat on a plain surface" recommended onPress={() => fromPicker(true)} />
        <Option icon="photos" title="Choose from Photos" sub="Any photo of the piece" onPress={() => fromPicker(false)} />
        {canCutOut ? (
          <Option icon="paste" title="Paste a photo" sub="Copy a photo of the piece in another app, then paste it here" onPress={paste} />
        ) : (
          <Option icon="paste" title="Paste a cutout" sub="In Photos, touch and hold the piece, tap Copy, then paste here" onPress={paste} />
        )}
        <Option icon="pencil" title="Describe it" sub="Pick the type and color; we draw it for you" onPress={() => setStep(one())} />
        <Option icon="link" title="Product link" sub="Coming to the phone app; use the web app for now" disabled />
      </View>
      {error ? <T style={{ color: C.warn }}>{error}</T> : null}
    </ModalScreen>
  );
}

function PickCard({ uri, label, on, onPress }: { uri: string; label: string; on: boolean; onPress: () => void }) {
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
      <View style={styles.pickTile}>
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
});
