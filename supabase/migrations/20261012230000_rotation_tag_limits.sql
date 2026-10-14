-- Rotation: limits on Claude photo tagging (decision 027).
--
-- Each tag is a Claude request billed to the server's Anthropic account, so on the public site tagging needs a
-- sign-in and is counted here. Approved accounts (Denise and the people she adds) have no daily limit; everyone else
-- gets a few tags a day, and all of them together share a daily cap so the bill has a ceiling.
--
-- Both tables are closed to the browser: no grants, no policies. Signed-in people only reach them through the two
-- functions below, which run as their owner and only ever read or add the caller's own uses.

-- Accounts with no daily limit, by sign-in email (lower case). Add one with:
--   insert into rotation.tag_approved (email, note) values ('someone@example.com', 'why');
create table rotation.tag_approved (
  email text primary key check (email = lower(email)),
  note text,
  added_at timestamptz not null default now()
);

-- One row per tag, kept for counting.
create table rotation.tag_uses (
  user_id uuid not null references auth.users (id) on delete cascade,
  approved boolean not null,
  used_at timestamptz not null default now()
);

create index tag_uses_user_idx on rotation.tag_uses (user_id, used_at);
create index tag_uses_limited_idx on rotation.tag_uses (used_at) where not approved;

alter table rotation.tag_approved enable row level security;
alter table rotation.tag_uses enable row level security;
revoke all on rotation.tag_approved, rotation.tag_uses from public, anon, authenticated;
grant select, insert, update, delete on rotation.tag_approved, rotation.tag_uses to service_role;

-- The limits, in one place. Counted over the last 24 hours.
create function rotation.tag_limits()
returns jsonb
language sql
immutable
set search_path = ''
as $$ select jsonb_build_object('per_person', 10, 'everyone', 150) $$;

-- Where the caller stands: approved or not, tags used in the last 24 hours, and the limit.
create function rotation.tag_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_approved boolean;
  used int;
begin
  if uid is null then
    return jsonb_build_object('signed_in', false);
  end if;
  select exists (select 1 from rotation.tag_approved a where a.email = lower(auth.jwt() ->> 'email')) into is_approved;
  select count(*) from rotation.tag_uses u where u.user_id = uid and u.used_at > now() - interval '24 hours' into used;
  return jsonb_build_object(
    'signed_in', true,
    'approved', is_approved,
    'used', used,
    'limit', case when is_approved then null else (rotation.tag_limits() ->> 'per_person')::int end
  );
end;
$$;

-- Takes one tag for the caller if they have one left, and says why not otherwise.
-- Returns { allowed, approved, left } or { allowed: false, reason: 'signed-out' | 'person' | 'everyone' }.
create function rotation.claim_tag()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  limits jsonb := rotation.tag_limits();
  is_approved boolean;
  used int;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'signed-out');
  end if;

  -- One claim at a time, so two quick requests can't both take the last tag.
  perform pg_advisory_xact_lock(hashtext('rotation.claim_tag'));

  select exists (select 1 from rotation.tag_approved a where a.email = lower(auth.jwt() ->> 'email')) into is_approved;
  if is_approved then
    insert into rotation.tag_uses (user_id, approved) values (uid, true);
    return jsonb_build_object('allowed', true, 'approved', true);
  end if;

  select count(*) from rotation.tag_uses u where u.user_id = uid and u.used_at > now() - interval '24 hours' into used;
  if used >= (limits ->> 'per_person')::int then
    return jsonb_build_object('allowed', false, 'reason', 'person', 'limit', (limits ->> 'per_person')::int);
  end if;

  if (select count(*) from rotation.tag_uses u where not u.approved and u.used_at > now() - interval '24 hours')
     >= (limits ->> 'everyone')::int then
    return jsonb_build_object('allowed', false, 'reason', 'everyone');
  end if;

  insert into rotation.tag_uses (user_id, approved) values (uid, false);
  return jsonb_build_object('allowed', true, 'approved', false, 'left', (limits ->> 'per_person')::int - used - 1);
end;
$$;

revoke execute on function rotation.tag_limits(), rotation.tag_status(), rotation.claim_tag() from public, anon;
grant execute on function rotation.tag_status(), rotation.claim_tag() to authenticated;
grant execute on function rotation.tag_limits() to authenticated, service_role;
