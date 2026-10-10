'use client';

/* Signing in with a code sent by email (decision 013). The same two steps sit in Settings > Your account and in the
   prompt that opens when someone signed out tries to save or add pieces (decision 014). */

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Icon } from './ui';

/** Plain words for what went wrong with a code. */
function problem(e: unknown) {
  const err = e as { status?: number; code?: string; message?: string };
  if (err.status === 429 || err.code === 'over_email_send_rate_limit') return 'Wait a minute before asking for another code.';
  if (err.code === 'otp_expired' || err.status === 403) return "That code didn't work or has expired. Check it, or send a new one.";
  if (err.code === 'email_address_invalid' || err.code === 'validation_failed') return "That email address doesn't look right.";
  if (!navigator.onLine) return "You're offline. Connect to the internet and try again.";
  return 'Something went wrong. Try again in a moment.';
}

/** An email address, then the code from the email. `intro` explains the email step; `onSignedIn` runs once the code works.
    `autoFocus` puts the cursor in the field, for the prompt. */
export function SignInForm({ intro, onSignedIn, autoFocus = false }: { intro: React.ReactNode; onSignedIn?: () => void; autoFocus?: boolean }) {
  const st = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      onSignedIn?.();
    } catch (err) {
      setError(problem(err));
    }
    setBusy(false);
  };

  return (
    <>
      {step === 'email' ? (
        <>
          {intro}
          <form className="sign-in-form" onSubmit={send}>
            <label className="field" style={{ minWidth: 260 }}>
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus={autoFocus}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p>
            We sent a code to <b>{email.trim()}</b>. Enter it here. If the email has a link instead, open it in this browser.
          </p>
          <form className="sign-in-form" onSubmit={verify}>
            <label className="field" style={{ width: 180 }}>
              <span>Code</span>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                maxLength={10}
                autoFocus
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
    </>
  );
}

/** What signing in does, for someone who hasn't yet. Pieces already on the device (from before accounts) go up with it. */
export function SignInIntro() {
  const st = useStore();
  const n = st.items.length;
  return (
    <>
      <p>
        Building outfits with the demo closet doesn&apos;t need an account. Building your own closet and saving outfits do, so everything is backed up and
        on every device you sign in on. There&apos;s no password: we email you a code.
      </p>
      {n > 0 && <p>The {n === 1 ? 'piece' : `${n} pieces`} already in this browser will be added to your account.</p>}
    </>
  );
}

/** Opens when someone signed out tries to save or add pieces. Once they're in and their closet has arrived, the store
    closes it and finishes what they started. */
export function SignInDialog() {
  const st = useStore();
  const { closeSignIn } = st;
  /** The code worked; waiting for the account's closet. */
  const [arriving, setArriving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSignIn();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSignIn]);

  return (
    <>
      <div className="backdrop" onClick={closeSignIn} />
      <div className="modal-wrap">
        <div className="modal sign-in" role="dialog" aria-modal="true" aria-labelledby="sign-in-title">
          <button className="icon-btn close" onClick={closeSignIn} aria-label="Close">
            <Icon name="x" />
          </button>
          <h2 id="sign-in-title">Sign in to {st.signInAsk}</h2>
          {arriving ? (
            <p className="lede" role="status">
              Signed in. Getting your closet ready…
            </p>
          ) : (
            <SignInForm intro={<SignInIntro />} onSignedIn={() => setArriving(true)} autoFocus />
          )}
        </div>
      </div>
    </>
  );
}
