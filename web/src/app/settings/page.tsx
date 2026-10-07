'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, ShopSwitch } from '@/components/ui';
import { KNOWN_STORES } from '@/lib/catalog-meta';
import { todayISO } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const st = useStore();
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

  const toggleStore = (s: string) => {
    const fav = st.settings.favoriteStores;
    st.updateSettings({ favoriteStores: fav.includes(s) ? fav.filter((x) => x !== s) : [...fav, s] });
  };

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

      <section className="card settings-section">
        <h3>Weather</h3>
        <p>Your city sets layers and the forecast in the planner. Temperatures are in °F.</p>
        <form
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}
          onSubmit={async (e) => {
            e.preventDefault();
            setCityError('');
            const ok = await st.setCity(city);
            if (!ok) setCityError("Couldn't find that city. Try adding the state or country.");
            else st.toast(city ? 'City saved' : 'City cleared');
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
            : 'Your closet lives only in this browser. Download a copy to back it up or move it to another device.'}
        </p>
        {!st.demo && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={download}>
              <Icon name="upload" />
              Download my closet
            </button>
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
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Restore from a file
            </button>
            {confirmReset ? (
              <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} onClick={async () => (await st.resetAll(), setConfirmReset(false), st.toast('Everything was deleted'))}>
                Delete everything permanently
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
