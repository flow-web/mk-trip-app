-- ─── Strava Integration ───────────────────────────────────────────────────────

-- ─── strava_tokens : OAuth tokens per user ───────────────────────────────────
create table public.strava_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  athlete_id    bigint unique not null,
  access_token  text not null,
  refresh_token text not null,
  expires_at    bigint not null,
  scope         text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_strava_tokens_updated_at before update on public.strava_tokens
  for each row execute function public.set_updated_at();

-- ─── strava_activities : imported activities, optionally linked to a trip ─────
create table public.strava_activities (
  id              bigint primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  trip_id         uuid references public.trips(id) on delete set null,
  name            text not null,
  sport_type      text not null,
  distance        real not null,
  moving_time     int not null,
  elapsed_time    int not null,
  total_elevation real,
  start_date      timestamptz not null,
  start_latlng    double precision[],
  end_latlng      double precision[],
  average_speed   real,
  max_speed       real,
  polyline        text,
  trace           geometry(LineString, 4326),
  streams_json    jsonb,
  created_at      timestamptz not null default now()
);
create index idx_strava_activities_user on public.strava_activities(user_id);
create index idx_strava_activities_trip on public.strava_activities(trip_id) where trip_id is not null;
create index idx_strava_activities_date on public.strava_activities(start_date);
create index idx_strava_activities_trace on public.strava_activities using gist (trace) where trace is not null;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.strava_tokens enable row level security;
alter table public.strava_activities enable row level security;

create policy "strava_tokens_own" on public.strava_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "strava_activities_own" on public.strava_activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "strava_activities_trip_read" on public.strava_activities
  for select using (trip_id is not null and public.is_trip_member(trip_id));

-- ─── RPC : auto-link activity to matching trip ────────────────────────────────
create or replace function public.strava_auto_link_trip(p_user_id uuid, p_start_date timestamptz)
returns uuid language sql stable security definer as $$
  select t.id from public.trips t
  join public.trip_members tm on tm.trip_id = t.id
  where tm.user_id = p_user_id
    and p_start_date::date between t.start_date and t.end_date
  order by t.start_date
  limit 1;
$$;
