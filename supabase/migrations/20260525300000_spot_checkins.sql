-- ─── spot_checkins ─────────────────────────────────────────────────────────────
create table public.spot_checkins (
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.spot_checkins enable row level security;

create policy "spot_checkins_select_member" on public.spot_checkins
  for select using (exists (
    select 1 from public.spots s
    join public.trips t on t.id = s.trip_id
    where s.id = spot_id and public.is_trip_member(t.id)
  ));

create policy "spot_checkins_insert_self" on public.spot_checkins
  for insert with check (auth.uid() = user_id);

create policy "spot_checkins_delete_self" on public.spot_checkins
  for delete using (auth.uid() = user_id);
