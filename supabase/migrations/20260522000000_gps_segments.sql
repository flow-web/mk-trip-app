-- ─── Extension PostGIS ────────────────────────────────────────────────────────
create extension if not exists postgis;

-- ─── Enum activité ────────────────────────────────────────────────────────────
create type activity_kind as enum ('skate','run','bike','car','walk','other');

-- ─── segments ─────────────────────────────────────────────────────────────────
create table public.segments (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid references public.profiles(id) on delete set null,
  name          text not null,
  description   text,
  activity      activity_kind not null,
  geom          geometry(LineString, 4326) not null,
  start_point   geography(Point, 4326) generated always as
                (geography(ST_StartPoint(geom))) stored,
  end_point     geography(Point, 4326) generated always as
                (geography(ST_EndPoint(geom))) stored,
  distance_m    integer not null,
  cover_color   text not null default '#FF6B4A',
  created_at    timestamptz not null default now()
);
create index idx_segments_geom on public.segments using gist (geom);
create index idx_segments_activity on public.segments (activity);
create index idx_segments_start_geog on public.segments using gist (start_point);

-- ─── runs ─────────────────────────────────────────────────────────────────────
create table public.runs (
  id              uuid primary key default gen_random_uuid(),
  segment_id      uuid not null references public.segments(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  trace           geometry(LineString, 4326) not null,
  duration_ms     integer not null check (duration_ms > 0),
  distance_m      integer not null check (distance_m >= 0),
  speed_avg_kmh   numeric(5,2),
  speed_max_kmh   numeric(5,2),
  started_at      timestamptz not null,
  is_valid        boolean not null default true,
  invalid_reason  text,
  created_at      timestamptz not null default now()
);
create index idx_runs_segment_user on public.runs (segment_id, user_id, duration_ms);
create index idx_runs_leaderboard on public.runs (segment_id, duration_ms) where is_valid = true;

-- ─── activity_rules ───────────────────────────────────────────────────────────
create table public.activity_rules (
  activity            activity_kind primary key,
  hausdorff_tol_m     integer not null,
  max_speed_kmh       integer not null,
  min_duration_ms     integer not null default 5000,
  distance_ratio_min  numeric(3,2) not null default 0.80,
  distance_ratio_max  numeric(3,2) not null default 1.50
);
insert into public.activity_rules values
  ('walk',  25, 12,  5000, 0.80, 1.50),
  ('run',   25, 30,  5000, 0.80, 1.50),
  ('skate', 25, 50,  5000, 0.80, 1.50),
  ('bike',  30, 80,  5000, 0.80, 1.50),
  ('car',   40, 250, 5000, 0.80, 1.50),
  ('other', 30, 100, 5000, 0.80, 1.50);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.segments enable row level security;
alter table public.runs enable row level security;
alter table public.activity_rules enable row level security;

create policy "segments_select_all" on public.segments for select using (true);
create policy "segments_insert_auth" on public.segments for insert
  with check (auth.uid() = creator_id);
create policy "segments_update_creator" on public.segments for update
  using (auth.uid() = creator_id);
create policy "segments_delete_creator" on public.segments for delete
  using (auth.uid() = creator_id);

create policy "runs_select_all" on public.runs for select using (true);
create policy "runs_insert_self" on public.runs for insert
  with check (auth.uid() = user_id);
create policy "runs_update_self" on public.runs for update
  using (auth.uid() = user_id);
create policy "runs_delete_self" on public.runs for delete
  using (auth.uid() = user_id);

create policy "rules_select_all" on public.activity_rules for select using (true);
