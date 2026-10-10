'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useThemeSync } from '@/lib/theme';
import { AddItemDialog } from './AddItemDialog';
import { CompareDrawer, ListDrawer } from './ShopDrawers';
import { ItemDrawer } from './ItemDrawer';
import { SignInDialog } from './SignIn';
import { Icon } from './ui';

type Overlay = { type: 'add' } | { type: 'item'; id: string } | { type: 'compare'; id: string } | { type: 'list' } | null;

/** Opens drawers and dialogs. Shell provides it; Storybook provides one that logs what would open. */
export const UICtx = createContext<{ open: (o: Overlay) => void; close: () => void } | null>(null);
export const useUI = () => useContext(UICtx)!;

/** Where the closet is saved, for the note under the navigation. */
function savedWhere(st: ReturnType<typeof useStore>): { title: string; note: string; dot?: 'idle' | 'waiting' } {
  if (st.demo) return { title: 'Demo closet', note: 'Changes are not saved' };
  if (st.needsAccount) return { title: 'Not signed in', note: 'Sign in to save your closet', dot: 'idle' };
  // Signed in here before and never signed out: the closet is still the account's, waiting for the session to come back.
  if (!st.account && st.accountsOn) return { title: 'Signed out', note: 'Saved on this device; sign in to sync', dot: 'waiting' };
  if (!st.account) return { title: 'Saved on this device', note: 'Nothing leaves your browser' };
  if (st.syncState === 'offline') return { title: 'Offline', note: 'Saved on this device for now', dot: 'waiting' };
  if (st.syncState === 'error') return { title: 'Not synced yet', note: 'Saved on this device; trying again', dot: 'waiting' };
  return { title: 'Saved to your account', note: st.syncState === 'syncing' ? 'Syncing…' : 'On every device you sign in on' };
}

const NAV = [
  { path: '/', label: 'Today', icon: 'today' },
  { path: '/closet', label: 'Closet', icon: 'closet' },
  { path: '/fill', label: 'Fill the gap', icon: 'unlock' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const st = useStore();
  const saved = savedWhere(st);
  const pathname = usePathname();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const open = useCallback((o: Overlay) => setOverlay(o), []);
  const close = useCallback(() => setOverlay(null), []);
  useThemeSync();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOverlay(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = overlay ? 'hidden' : '';
  }, [overlay]);
  // On the root so drawers, which render outside .app, pick up the board background too.
  useEffect(() => {
    document.documentElement.dataset.board = st.settings.board ?? 'linen';
  }, [st.settings.board]);
  // Close any open drawer or dialog when the page changes.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOverlay(null);
  }

  /** Adding pieces builds a closet, so signed out it asks to sign in first. */
  const addPieces = () => st.requireAccount('start your closet', () => open({ type: 'add' }));

  const navLink = (n: { path: string; label: string; icon: string }, count?: number) => {
    const active = pathname === n.path;
    return (
      <Link key={n.path} href={st.href(n.path)} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
        <Icon name={n.icon} />
        <span>{n.label}</span>
        {count ? <span className="count">{count}</span> : null}
      </Link>
    );
  };

  return (
    <UICtx.Provider value={{ open, close }}>
      <div className="app">
        <aside className="side">
          <Link href={st.href('/')} className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
            rotation<span>.</span>
          </Link>
          <div className="logo-sub">Style what you own. Shop what&apos;s missing.</div>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => navLink(n, n.path === '/closet' ? st.items.length : undefined))}
            <div className="nav-label">You</div>
            {navLink({ path: '/insights', label: 'Closet report', icon: 'insights' })}
            {navLink({ path: '/settings', label: 'Settings', icon: 'settings' })}
            {navLink({ path: '/about', label: 'How it works', icon: 'info' })}
          </nav>
          <div className="side-foot">
            <div className="sync-status">
              <span className={`pulse ${saved.dot}`} />
              <span>
                <b>{saved.title}</b>
                <br />
                {saved.note}
              </span>
            </div>
            <button className="btn primary" onClick={addPieces}>
              <Icon name="plus" />
              Add pieces
            </button>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button className="icon-btn" onClick={() => open({ type: 'list' })} aria-label={`Shopping list, ${st.list.length} items`}>
              <Icon name="bag" />
              {st.list.length ? <span className="bag-count">{st.list.length}</span> : null}
            </button>
          </div>
          {st.demo && (
            <div className="demo-banner">
              <span>
                <b>You&apos;re exploring Jordan&apos;s demo closet.</b> Changes here aren&apos;t saved.
              </span>
              {/* A full page load leaves demo mode. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/">Start your own closet →</a>
            </div>
          )}
          {/* Pages read on-device data, so they render once it has loaded in the browser. */}
          {st.ready ? children : null}
        </main>
      </div>

      {overlay?.type === 'add' && <AddItemDialog onClose={close} />}
      {overlay?.type === 'item' && <ItemDrawer id={overlay.id} onClose={close} />}
      {overlay?.type === 'compare' && <CompareDrawer id={overlay.id} onClose={close} />}
      {overlay?.type === 'list' && <ListDrawer onClose={close} />}
      {st.signInAsk && <SignInDialog />}

      <div className={`toast ${st.toastMsg ? 'show' : ''}`} role="status" aria-live="polite">
        <Icon name="check" />
        <span>{st.toastMsg}</span>
      </div>
    </UICtx.Provider>
  );
}
