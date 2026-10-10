-- Rotation: accounts that back up and sync a closet (decision 013).
--
-- The Supabase project is shared with other apps, so everything Rotation owns lives in the
-- `rotation` schema and the `rotation-photos` bucket. Nothing here touches another app's tables,
-- buckets or the project's auth settings.
--
-- The closet is still reasoned about on the device. The server keeps each record (a piece, an
-- outfit, a planned day, a wear, the settings, the shopping list) as a JSON document, so a change
-- to the app's record shapes never needs a database migration.

create schema if not exists rotation;

-- Signed-in people only. `anon` gets nothing.
grant usage on schema rotation to authenticated, service_role;

create table rotation.records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('item', 'outfit', 'plan', 'wear', 'settings', 'list')),
  id text not null check (length(id) between 1 and 100),
  -- The record as the app stores it. Null once it's deleted.
  data jsonb,
  deleted boolean not null default false,
  -- When the change was made on the device. Of two edits to one record, the newer one is kept.
  updated_at timestamptz not null,
  -- When the server accepted the change. Devices ask for everything after the last one they saw.
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, kind, id),
  constraint records_data_present check (deleted or data is not null),
  constraint records_data_size check (data is null or pg_column_size(data) < 512 * 1024)
);

create index records_user_synced_idx on rotation.records (user_id, synced_at);

alter table rotation.records enable row level security;

create policy "Read own records" on rotation.records
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Add own records" on rotation.records
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Change own records" on rotation.records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policy: a deleted record stays as a tombstone so other devices learn about it.
-- Deleting the account removes every row (on delete cascade).
grant select, insert, update on rotation.records to authenticated;
grant select, insert, update, delete on rotation.records to service_role;

-- Keeps the newer edit when two devices change the same record, and stamps when the server took it.
-- A late, older edit leaves the row as it was but still moves synced_at, so the device that sent it
-- pulls the newer version back down on its next sync.
create function rotation.stamp_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A device with its clock far ahead shouldn't win every edit for months.
  new.updated_at := least(new.updated_at, clock_timestamp() + interval '5 minutes');
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    new := old;
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

revoke execute on function rotation.stamp_record() from public, anon, authenticated;

create trigger records_stamp
  before insert or update on rotation.records
  for each row execute function rotation.stamp_record();

-- Photos: one private folder per account, named by the account's id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rotation-photos',
  'rotation-photos',
  false,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

create policy "rotation photos: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'rotation-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "rotation photos: add own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'rotation-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "rotation photos: replace own" on storage.objects
  for update to authenticated
  using (bucket_id = 'rotation-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'rotation-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "rotation photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rotation-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
