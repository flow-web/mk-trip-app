-- supabase/migrations/20260520_refonte_hero.sql
-- Adds hero_image_url + hero_image_uploaded to trips, plus a public Storage bucket
-- (trip-covers) with RLS so trip members can write their own covers.

alter table public.trips
  add column hero_image_url text,
  add column hero_image_uploaded boolean default false;

-- Storage bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('trip-covers', 'trip-covers', true)
on conflict (id) do nothing;

-- Members can insert/update/delete covers under their trip folder
create policy "trip_covers_member_write" on storage.objects
  for insert with check (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_member_update" on storage.objects
  for update using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_member_delete" on storage.objects
  for delete using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_public_read" on storage.objects
  for select using (bucket_id = 'trip-covers');
