-- ─── polls ─────────────────────────────────────────────────────────────────────
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  question text not null check (char_length(question) > 0 and char_length(question) <= 200),
  created_by uuid not null references public.profiles(id) on delete cascade,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_polls_trip on public.polls(trip_id);
create trigger trg_polls_updated_at before update on public.polls
  for each row execute function public.set_updated_at();

-- ─── poll_options ──────────────────────────────────────────────────────────────
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(label) > 0 and char_length(label) <= 100),
  position int not null default 0
);

create index idx_poll_options_poll on public.poll_options(poll_id);

-- ─── poll_votes ────────────────────────────────────────────────────────────────
create table public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create policy "polls_select_member" on public.polls
  for select using (public.is_trip_member(trip_id));
create policy "polls_insert_member" on public.polls
  for insert with check (auth.uid() = created_by and public.is_trip_member(trip_id));

create policy "poll_options_select" on public.poll_options
  for select using (exists (
    select 1 from public.polls p where p.id = poll_id and public.is_trip_member(p.trip_id)
  ));
create policy "poll_options_insert" on public.poll_options
  for insert with check (exists (
    select 1 from public.polls p where p.id = poll_id and p.created_by = auth.uid()
  ));

create policy "poll_votes_select" on public.poll_votes
  for select using (exists (
    select 1 from public.polls p where p.id = poll_id and public.is_trip_member(p.trip_id)
  ));
create policy "poll_votes_insert" on public.poll_votes
  for insert with check (auth.uid() = user_id);
create policy "poll_votes_update" on public.poll_votes
  for update using (auth.uid() = user_id);

alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.poll_votes;
