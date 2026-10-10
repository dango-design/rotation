'use client';

/* Settings > Your account: sign in with a code sent by email, see where the closet stands with the
   account, and sign out. Building a closet and saving need an account (decision 014). */

import { useState } from 'react';
import { useStore, type SyncState } from '@/lib/store';
import { SignInForm, SignInIntro } from './SignIn';

const STATUS: Record<SyncState, string> = {
  off: '',
  synced: 'Your closet is saved to your account and stays the same on every device you sign in on.',
  syncing: 'Saving to your account…',
  offline: "You're offline. Changes stay on this device and go to your account when you're back online.",
  error: "Couldn't reach your account just now. Changes stay on this device and Rotation will try again.",
};

export function AccountSection() {
  const st = useStore();
  const [busy, setBusy] = useState(false);
  /** Changes that haven't reached the account, when signing out would lose them. */
  const [unsaved, setUnsaved] = useState(0);

  if (st.demo) return null;

  if (st.account) {
    const out = async (anyway = false) => {
      setBusy(true);
      try {
        const left = await st.signOut(anyway);
        setUnsaved(left);
        if (!left) st.toast('Signed out');
      } catch {
        st.toast("Couldn't sign out. Try again.");
      }
      setBusy(false);
    };
    return (
      <section className="card settings-section">
        <h3>Your account</h3>
        <p>
          Signed in as <b>{st.account.email}</b>. {STATUS[st.syncState]}
        </p>
        {unsaved > 0 ? (
          <>
            <p className="error-note" role="alert">
              {unsaved === 1 ? "1 change hasn't" : `${unsaved} changes haven't`} reached your account yet. Signing out now would lose{' '}
              {unsaved === 1 ? 'it' : 'them'}.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" disabled={busy} onClick={() => setUnsaved(0)}>
                Stay signed in
              </button>
              <button className="btn ghost" style={{ color: 'var(--warn)' }} disabled={busy} onClick={() => out(true)}>
                Sign out anyway
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(st.syncState === 'error' || st.syncState === 'offline') && (
                <button className="btn" disabled={busy} onClick={() => void st.syncNow()}>
                  Try again now
                </button>
              )}
              <button className="btn" disabled={busy} onClick={() => out()}>
                Sign out
              </button>
            </div>
            <p>Signing out takes your closet off this browser. It stays in your account for next time.</p>
          </>
        )}
      </section>
    );
  }

  if (!st.accountsOn) {
    return (
      <section className="card settings-section">
        <h3>Your account</h3>
        <p>Accounts aren&apos;t set up on this server yet, so your closet stays in this browser.</p>
      </section>
    );
  }

  return (
    <section className="card settings-section">
      <h3>Your account</h3>
      <SignInForm
        intro={
          st.owner ? (
            // Signed in here before and never signed out, so the closet is still this account's (the session lapsed).
            <p>You&apos;re signed out in this browser, but your closet is still here. Sign in with the same email to keep saving it to your account.</p>
          ) : (
            <>
              <SignInIntro />
              <p>Your pieces, outfits, plans and photos are saved to your account, and only you can see them. Backgrounds are still removed on this device.</p>
            </>
          )
        }
        onSignedIn={() => st.toast('Signed in')}
      />
    </section>
  );
}
