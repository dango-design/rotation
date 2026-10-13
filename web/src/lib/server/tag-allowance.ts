/* Who may use Claude photo tagging (decision 027). Each tag is billed to the server's Anthropic account, so on a
   build with accounts, tagging needs a sign-in and takes one tag from the person's allowance in the database
   (`rotation.claim_tag`, see supabase/migrations). Approved accounts have no daily limit; everyone else gets a few a
   day. A build without accounts (local development) has no allowance to check. */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const allowanceOn = Boolean(SUPABASE_URL && SUPABASE_KEY);

export type Claim =
  | { allowed: true; approved: boolean; left?: number }
  | { allowed: false; status: number; error: string };

interface Answer {
  allowed: boolean;
  approved?: boolean;
  left?: number;
  reason?: 'signed-out' | 'person' | 'everyone';
  limit?: number;
}

/** What the database's answer means for the request. */
export function readClaim(answer: Answer | null): Claim {
  if (answer?.allowed) return { allowed: true, approved: !!answer.approved, left: answer.left };
  switch (answer?.reason) {
    case 'person':
      return { allowed: false, status: 429, error: `You've used your ${answer.limit} photo tags for today. Fill in the details yourself, or try again tomorrow.` };
    case 'everyone':
      return { allowed: false, status: 429, error: 'Photo tagging is busy today. Fill in the details yourself, or try again tomorrow.' };
    default:
      return { allowed: false, status: 401, error: 'Sign in to have Claude tag your photos.' };
  }
}

/** Takes one tag for whoever the request's sign-in token belongs to. */
export async function claimTag(request: Request): Promise<Claim> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return readClaim(null);
  const sb = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // An expired or forged token is refused by the database before the function runs.
  const { data, error } = await sb.schema('rotation').rpc('claim_tag');
  if (error) return readClaim(null);
  return readClaim(data as Answer);
}
