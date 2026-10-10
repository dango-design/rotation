/* Accounts (decision 013). Building a closet and saving need one (decision 014); a build without these
   settings keeps the closet on the device with no sign-in. Signing in uses a code sent by email, with no
   password. The account's data lives in the shared Supabase project's `rotation` schema and
   `rotation-photos` bucket (see supabase/README.md).

   Only the publishable key reaches the browser. Every row and photo is locked to its owner by
   row-level security, so the key alone reads nothing. */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Outgoing, Remote, Row } from './sync';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** This build can sign people in, so saving needs an account. Off when the Supabase settings are missing, as in Storybook. */
export const accountsOn = Boolean(SUPABASE_URL && SUPABASE_KEY);

let client: SupabaseClient | null = null;

export function supabase() {
  if (!accountsOn) return null;
  client ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    // PKCE, so a sign-in link (if the project's email sends one) only works in the browser that asked for it.
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export interface Account {
  id: string;
  email: string;
}

export const toAccount = (u: User | null | undefined): Account | null => (u ? { id: u.id, email: u.email ?? '' } : null);

/** Emails a sign-in code. Makes the account if the address is new. */
export async function sendCode(email: string) {
  const { error } = await supabase()!.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/settings` },
  });
  if (error) throw error;
}

export async function verifyCode(email: string, code: string) {
  const { data, error } = await supabase()!.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
  return toAccount(data.user);
}

/** Signs out in this browser only; the person's other devices stay signed in. */
export async function signOut() {
  await supabase()?.auth.signOut({ scope: 'local' });
}

const BUCKET = 'rotation-photos';
const COLUMNS = 'kind,id,data,deleted,updated_at,synced_at';

/** The account's side of a sync. */
export function remoteFor(sb: SupabaseClient, userId: string): Remote & { wipe(): Promise<void> } {
  const records = () => sb.schema('rotation').from('records');
  const photos = () => sb.storage.from(BUCKET);
  const path = (id: string) => `${userId}/${id}`;

  return {
    async push(rows: Outgoing[]) {
      const { error } = await records().upsert(
        rows.map((r) => ({ ...r, user_id: userId })),
        { onConflict: 'user_id,kind,id' },
      );
      if (error) throw error;
    },

    async pull(since, limit) {
      let q = records().select(COLUMNS).eq('user_id', userId).order('synced_at').limit(limit);
      if (since) q = q.gt('synced_at', since);
      const { data, error } = await q;
      if (error) throw error;
      return data as Row[];
    },

    async upload(id, blob) {
      const { error } = await photos().upload(path(id), blob, { contentType: blob.type || 'image/png', upsert: false });
      if (error && !('code' in error && error.code === 'ResourceAlreadyExists') && !/exists|duplicate/i.test(error.message)) throw error;
    },

    async download(id) {
      const { data, error } = await photos().download(path(id));
      return error ? null : data;
    },

    async remove(ids) {
      const { error } = await photos().remove(ids.map(path));
      if (error) throw error;
    },

    /** Deletes the whole closet from the account: every record becomes a deletion other devices will pull, and every photo goes. */
    async wipe() {
      const { error } = await records()
        .update({ deleted: true, data: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('deleted', false);
      if (error) throw error;
      for (;;) {
        const { data, error: listError } = await photos().list(userId, { limit: 1000 });
        if (listError) throw listError;
        if (!data.length) break;
        const { error: removeError } = await photos().remove(data.map((f) => path(f.name)));
        if (removeError) throw removeError;
        if (data.length < 1000) break;
      }
    },
  };
}
