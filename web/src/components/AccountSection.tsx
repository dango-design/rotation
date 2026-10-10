'use client';

/* Settings > Your account: sign in with a code sent by email, see where the closet stands with the
   account, and sign out. Accounts are optional; without one the closet stays in this browser. */

import { useState } from 'react';
import { useStore, type SyncState } from '@/lib/store';

const STATUS: Record<SyncState, string> = {
  off: '',
  synced: 'Your closet is saved to your account and stays the same on every device you sign in on.',
  syncing: 'Saving to your account…',
  offline: "You're offline. Changes stay on this device and go to your account when you're back online.",
  error: "Couldn't reach your account just now. Changes stay on this device and Rotation will try again.",
};

/** Plain words for what went wrong with a code. */
function problem(e: unknown) {
  const err = e as { status?: number; code?: string; message?: string };
  if (err.status === 429 || err.code === 'over_email_send_rate_limit') return 'Wait a minute before asking for another code.';
  if (err.code === 'otp_expired' || err.status === 403) return "That code didn't work or has expired. Check it, or send a new one.";
  if (err.code === 'email_address_invalid' || err.code === 'validation_failed') return "That email address doesn't look right.";
  if (!navigator.onLine) return "You're offline. Connect to the internet and try again.";
  return "Something went wrong. Try again in a moment.";
}

export function AccountSection() {
  const st = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      await st.sendCode(email.trim());
      setStep('code');
      setCode('');
    } catch (err) {
      setError(problem(err));
    }
    setBusy(false);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await st.verifyCode(email.trim(), code.trim());
      st.toast('Signed in');
    } catch (err) {
      setError(problem(err));
    }
    setBusy(false);
  };

  return (
    <section className="card settings-section">
      <h3>Your account</h3>
      {step === 'email' ? (
        <>
          <p>
            Sign in to back up your closet and see it on your other devices. There&apos;s no password: we email you a code. Your pieces, outfits, plans and
            photos are saved to your account, and only you can see them. Backgrounds are still removed on this device.
          </p>
          <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={send}>
            <label className="field" style={{ minWidth: 260 }}>
              <span>Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
          {st.items.length > 0 && <p>The {st.items.length === 1 ? 'piece' : `${st.items.length} pieces`} already here will be added to your account.</p>}
        </>
      ) : (
        <>
          <p>
            We sent a code to <b>{email.trim()}</b>. Enter it here. If the email has a link instead, open it in this browser.
          </p>
          <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={verify}>
            <label className="field" style={{ width: 180 }}>
              <span>Code</span>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn ghost sm" disabled={busy} onClick={() => send()}>
              Send a new code
            </button>
            <button className="btn ghost sm" disabled={busy} onClick={() => (setStep('email'), setError(''))}>
              Use a different email
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
