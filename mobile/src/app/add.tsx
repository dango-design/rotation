/* Adding a piece on the phone: take a photo, pick one from Photos, paste a cutout, or describe it.
   A pasted cutout is the fastest way to a clean photo today: in Photos, touch and hold the piece until it lifts out
   of the background, tap Copy, then paste it here. Automatic background removal and dragging pieces in from other
   apps need a development build with a small Swift add-on (see mobile/README.md). */

import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { ItemForm, type ItemFields } from '@/components/ItemForm';
import { ModalScreen } from '@/components/ModalScreen';
import { T, tap } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, F, R } from '@/theme';

type Photo = { uri: string; width?: number; height?: number };
type Step = { kind: 'choose' } | { kind: 'saving' } | { kind: 'form'; photo?: Photo };

export default function AddScreen() {
  const st = useStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [error, setError] = useState('');

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
    setStep({ kind: 'form', photo: { uri: a.uri, width: a.width, height: a.height } });
  };

  const paste = async () => {
    setError('');
    const has = await Clipboard.hasImageAsync().catch(() => false);
    const img = has ? await Clipboard.getImageAsync({ format: 'png' }).catch(() => null) : null;
    if (!img) return setError('There’s no image to paste yet. In Photos, touch and hold the piece until it lifts out, tap Copy, then come back and paste.');
    setStep({ kind: 'form', photo: { uri: img.data, width: img.size.width, height: img.size.height } });
  };

  const save = async (f: ItemFields, photo?: Photo) => {
    setStep({ kind: 'saving' });
    try {
      await st.addItem(f, photo);
      st.toast(`${f.name} added to your closet${st.demo ? ' (demo, not saved)' : ''}`);
      router.back();
    } catch {
      setError("Couldn't save that photo. Try again, or describe the piece instead.");
      setStep({ kind: 'form', photo });
    }
  };

  if (step.kind === 'form')
    return (
      <ModalScreen eyebrow="Add pieces" onClose={() => setStep({ kind: 'choose' })}>
        <T v="h2">Check the details</T>
        <T>Type and color decide what it pairs with. Price makes cost per wear work.</T>
        {error ? <T style={{ color: C.warn }}>{error}</T> : null}
        <ItemForm initial={{ source: step.photo ? 'photo' : 'manual' }} previewUrl={step.photo?.uri} submitLabel="Add to closet" onSubmit={(f) => save(f, step.photo)} onCancel={() => setStep({ kind: 'choose' })} />
      </ModalScreen>
    );

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
      <T>A photo is fastest for anything you own. For a clean cutout, paste one from Photos.</T>
      <View style={{ gap: 10 }}>
        <Option icon="camera" title="Take a photo" sub="Lay it flat on a plain surface" recommended onPress={() => fromPicker(true)} />
        <Option icon="photos" title="Choose from Photos" sub="Any photo of the piece" onPress={() => fromPicker(false)} />
        <Option icon="paste" title="Paste a cutout" sub="In Photos, touch and hold the piece, tap Copy, then paste here" onPress={paste} />
        <Option icon="pencil" title="Describe it" sub="Pick the type and color; we draw it for you" onPress={() => setStep({ kind: 'form' })} />
        <Option icon="link" title="Product link" sub="Coming to the phone app; use the web app for now" disabled />
      </View>
      {error ? <T style={{ color: C.warn }}>{error}</T> : null}
    </ModalScreen>
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
});
