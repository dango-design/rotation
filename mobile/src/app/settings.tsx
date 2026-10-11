/* Settings: weather city, shopping, and your data. Backups use the web app's format, so a closet can move
   from the browser to the phone and back until accounts and sync arrive. */

import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KNOWN_STORES } from '@core/catalog-meta';
import { todayISO } from '@core/dates';
import { ModalScreen } from '@/components/ModalScreen';
import { build, buildLabel, committedAt, runtime, server, version } from '@/components/BuildTag';
import { Btn, Card, FilterChip, SwitchRow, T } from '@/components/ui';
import { readText, shareJson } from '@/lib/files';
import { useStore } from '@/lib/store';
import { C, F } from '@/theme';

export default function SettingsScreen() {
  const st = useStore();
  const [city, setCity] = useState(st.settings.city);
  const [cityError, setCityError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState('');

  const toggleStore = (s: string) => {
    const fav = st.settings.favoriteStores;
    st.updateSettings({ favoriteStores: fav.includes(s) ? fav.filter((x) => x !== s) : [...fav, s] });
  };

  const saveCity = async () => {
    setCityError('');
    const ok = await st.setCity(city);
    if (!ok) setCityError("Couldn't find that city. Try adding the state or country.");
    else st.toast(city ? 'City saved' : 'City cleared');
  };

  const backup = async () => {
    setBusy('backup');
    try {
      await shareJson(`rotation-closet-${todayISO()}.json`, await st.exportData());
    } catch {
      st.toast("Couldn't make a backup");
    }
    setBusy('');
  };

  const restore = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy('restore');
    try {
      await st.importData(await readText(res.assets[0].uri));
      st.toast('Closet restored');
    } catch {
      st.toast("That file isn't a Rotation backup");
    }
    setBusy('');
  };

  return (
    <ModalScreen eyebrow="Settings">
      <T v="h1">Make it yours</T>

      <Card style={{ gap: 10 }}>
        <T v="h3">Weather</T>
        <T>Your city sets layers and the forecast for each day on Today. Temperatures are in °F.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={city} onChangeText={setCity} placeholder="e.g. San Francisco" placeholderTextColor={C.ink3} style={styles.input} returnKeyType="done" onSubmitEditing={saveCity} accessibilityLabel="City" />
          <Btn kind="primary" label="Save" onPress={saveCity} />
        </View>
        {cityError ? <T style={{ color: C.warn }}>{cityError}</T> : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Shopping</T>
        <T>Suggestions list your favorite stores first, then the lowest price. They never change which pieces are recommended.</T>
        <SwitchRow
          label="Show shopping suggestions"
          value={st.settings.showShop}
          onChange={(v) => {
            st.updateSettings({ showShop: v });
            st.toast(v ? 'Shopping suggestions are on' : 'Shopping suggestions hidden. Your closet still works the same.');
          }}
        />
        <T v="tiny" style={{ fontFamily: F.semibold, color: C.ink2 }}>
          Favorite stores
        </T>
        <View style={styles.wrap}>
          {KNOWN_STORES.map((s) => (
            <FilterChip key={s} label={s} on={st.settings.favoriteStores.includes(s)} onPress={() => toggleStore(s)} />
          ))}
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Your data</T>
        {st.demo ? (
          <>
            <T>You&apos;re in the demo closet; nothing here is saved.</T>
            <Btn label="Leave the demo" onPress={st.leaveDemo} />
          </>
        ) : (
          <>
            <T>Your closet lives only on this phone. Make a backup to keep a copy, or restore one made in the Rotation web app to bring your closet here.</T>
            <Btn icon="upload" label={busy === 'backup' ? 'Making a backup…' : 'Back up my closet'} disabled={!!busy} onPress={backup} />
            <Btn label={busy === 'restore' ? 'Restoring…' : 'Restore from a backup'} disabled={!!busy} onPress={restore} />
            {confirmReset ? (
              <Btn
                kind="danger"
                label="Delete everything permanently"
                onPress={async () => {
                  await st.resetAll();
                  setConfirmReset(false);
                  st.toast('Everything was deleted');
                }}
              />
            ) : (
              <Btn kind="ghost" icon="trash" label="Delete all data" onPress={() => setConfirmReset(true)} />
            )}
          </>
        )}
      </Card>

      <Card style={{ gap: 6 }}>
        <T v="h3">This version</T>
        <T>
          Rotation {version} · {runtime}
        </T>
        {build?.commit ? (
          <T v="small">
            {build.branch && build.branch !== 'HEAD' ? `Branch ${build.branch} · ` : ''}commit {build.commit}
            {committedAt ? `, ${committedAt}` : ''}
          </T>
        ) : null}
        {build?.changed ? <T v="small">Includes changes that aren&apos;t committed yet.</T> : null}
        {server ? <T v="small">Running from {server}</T> : null}
        {__DEV__ && buildLabel() ? <T v="small">The same short label is at the top of each sheet and on Today while testing.</T> : null}
      </Card>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.panel, paddingHorizontal: 12, fontFamily: F.sans, fontSize: 15, color: C.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
