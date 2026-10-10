'use client';

import { useEffect, useRef, useState } from 'react';
import { AccountSection } from '@/components/AccountSection';
import { BoardSwatches, Icon, ShopSwitch } from '@/components/ui';
import { KNOWN_STORES } from '@/lib/catalog-meta';
import { todayISO } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { setThemePref, useThemePref, type ThemePref } from '@/lib/theme';

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsPage() {
  const st = useStore();
  const theme = useThemePref();
  const [city, setCity] = useState(st.settings.city);
  const [cityError, setCityError] = useState('');
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/tag')
      .then((r) => r.json())
      .then((d) => setAiEnabled(!!d.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const toggleStore = (s: string) =>
    st.requireAccount('save your settings', () => {
      const fav = st.settings.favoriteStores;
      st.updateSettings({ favoriteStores: fav.includes(s) ? fav.filter((x) => x !== s) : [...fav, s] });
    });

  const download = async () => {
    const json = await st.exportData();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `rotation-closet-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Make it yours</h1>
        </div>
      </header>

      <AccountSection />

      <section className="card settings-section">
        <h3>Weather</h3>
        <p>Your city sets layers and the forecast for each day on Today. Temperatures are in °F.</p>
        <form
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}
          onSubmit={(e) => {
            e.preventDefault();
            setCityError('');
            st.requireAccount('save your settings', async () => {
              const ok = await st.setCity(city);
              if (!ok) setCityError("Couldn't find that city. Try adding the state or country.");
              else st.toast(city ? 'City saved' : 'City cleared');
            });
          }}
        >
          <label className="field" style={{ minWidth: 260 }}>
            <span>City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. San Francisco" />
          </label>
          <button className="btn primary" type="submit">
            Save
          </button>
        </form>
        {cityError && <p className="error-note">{cityError}</p>}
      </section>

      <section className="card settings-section">
        <h3>Appearance</h3>
        <p>Rotation follows your device&apos;s light or dark setting unless you pick one here. The choice is saved in this browser.</p>
        <div className="seg" role="group" aria-label="Theme" style={{ alignSelf: 'flex-start' }}>
          {THEMES.map((t) => (
            <button key={t.value} className={theme === t.value ? 'active' : ''} aria-pressed={theme === t.value} onClick={() => setThemePref(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-section">
        <h3>Outfit boards</h3>
        <p>
          The background for outfits that don&apos;t have their own. Each one is a quiet neutral, so it won&apos;t change how a color reads. Stone helps white pieces stand out. To give one outfit
          any color, use the dot in the corner of its canvas.
        </p>
        <BoardSwatches labels />
      </section>

      <section className="card settings-section">
        <h3>Shopping</h3>
        <p>Suggestions list your favorite stores first, then the lowest price. They never change which pieces are recommended.</p>
        <ShopSwitch />
        <div className="store-chips">
          {KNOWN_STORES.map((s) => (
            <button key={s} className={`chip-toggle ${st.settings.favoriteStores.includes(s) ? 'on' : ''}`} onClick={() => toggleStore(s)} aria-pressed={st.settings.favoriteStores.includes(s)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-section">
        <h3>Photo tagging</h3>
        <p>
          {aiEnabled === null
            ? 'Checking…'
            : aiEnabled
            ? 'On. When you add a photo, Claude suggests the type, color and a name, and you confirm them. The background is still removed on your device.'
            : "Off on this server. Photos are still tagged with their color automatically; set ANTHROPIC_API_KEY on the server to have Claude suggest the type and name too."}
        </p>
      </section>

      <section className="card settings-section">
        <h3>Your data</h3>
        <p>
          {st.demo
            ? "You're in the demo closet; nothing here is saved."
            : st.account
            ? 'Your closet is saved in this browser and to your account. Download a copy to keep a backup of your own.'
            : st.needsAccount
            ? st.items.length
              ? 'These pieces are only in this browser, and changes aren\'t saved until you sign in. Signing in adds them to your account.'
              : 'Nothing is saved until you sign in. Once you have, you can also restore a closet from a backup file here.'
            : st.accountsOn
            ? 'Your closet is saved in this browser. Sign in again to sync it with your account, or download a copy to keep a backup of your own.'
            : 'Your closet lives only in this browser. Download a copy to back it up or move it to another device.'}
        </p>
        {!st.demo && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {st.items.length > 0 && (
              <button className="btn" onClick={download}>
                <Icon name="upload" />
                Download my closet
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  await st.importData(await f.text());
                  st.toast('Closet restored');
                } catch {
                  st.toast("That file isn't a Rotation backup");
                }
              }}
            />
            {/* Signed out, this only asks to sign in: a browser opens the file picker only straight from a click. */}
            <button className="btn" onClick={() => (st.needsAccount ? st.requireAccount('restore your closet', () => {}) : fileRef.current?.click())}>
              Restore from a file
            </button>
            {st.needsAccount && !st.items.length ? null : confirmReset ? (
              <button
                className="btn"
                style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}
                onClick={async () => {
                  try {
                    await st.resetAll();
                    st.toast('Everything was deleted');
                  } catch {
                    st.toast("Couldn't reach your account, so nothing was deleted. Try again when you're online.");
                  }
                  setConfirmReset(false);
                }}
              >
                {st.account ? 'Delete everything here and in my account' : 'Delete everything permanently'}
              </button>
            ) : (
              <button className="btn ghost" onClick={() => setConfirmReset(true)}>
                <Icon name="trash" />
                Delete all data
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
