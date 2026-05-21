-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type trip_type as enum ('city_break', 'road_trip', 'sport', 'hike', 'beach', 'other');
create type member_role as enum ('owner', 'editor', 'viewer');
create type spot_category as enum ('food', 'culture', 'nightlife', 'nature', 'accommodation', 'activity', 'sport');
create type expense_category as enum ('food', 'transport', 'hotel', 'activity', 'drink', 'shopping', 'other');
create type split_mode as enum ('equal', 'custom');
create type checklist_category as enum ('clothing', 'gear', 'docs', 'other');
create type guide_kind as enum ('danger', 'warning', 'info', 'weather', 'emergency', 'food');

-- ─── Helper trigger : set updated_at ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Helper : génération de join_code ─────────────────────────────────────────
create or replace function public.generate_join_code()
returns text language plpgsql as $$
declare
  candidate text;
  exists_count int;
begin
  loop
    candidate := 'MKT-' || upper(substring(md5(random()::text) from 1 for 4));
    select count(*) into exists_count from public.trips where join_code = candidate;
    exit when exists_count = 0;
  end loop;
  return candidate;
end;
$$;

-- ─── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── trips ────────────────────────────────────────────────────────────────────
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  trip_type trip_type not null default 'other',
  currency text not null default 'EUR',
  total_budget numeric(12,2),
  cover_color text not null default '#FF6B4A',
  join_code text not null unique default public.generate_join_code(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_trips_owner on public.trips(owner_id);
create trigger trg_trips_updated_at before update on public.trips
  for each row execute function public.set_updated_at();

-- ─── trip_members ─────────────────────────────────────────────────────────────
create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index idx_trip_members_user on public.trip_members(user_id);

-- Trigger : owner automatiquement ajouté comme membre owner
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict do nothing;
  return new;
end;
$$;
create trigger trg_trips_add_owner after insert on public.trips
  for each row execute function public.add_owner_as_member();

-- ─── Helper : is_trip_member ──────────────────────────────────────────────────
create or replace function public.is_trip_member(t uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = t and user_id = auth.uid()
  )
$$;

-- ─── days ─────────────────────────────────────────────────────────────────────
create table public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number int not null,
  date date,
  label text,
  theme text,
  zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_number)
);
create index idx_days_trip on public.days(trip_id);
create trigger trg_days_updated_at before update on public.days
  for each row execute function public.set_updated_at();

-- ─── activities ───────────────────────────────────────────────────────────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days(id) on delete cascade,
  time time,
  title text not null,
  subtitle text,
  category spot_category not null default 'activity',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_activities_day on public.activities(day_id);
create trigger trg_activities_updated_at before update on public.activities
  for each row execute function public.set_updated_at();

-- ─── activity_completions ─────────────────────────────────────────────────────
create table public.activity_completions (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

-- ─── spots ────────────────────────────────────────────────────────────────────
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  description text,
  category spot_category not null default 'activity',
  zone text,
  lat numeric(9,6),
  lng numeric(9,6),
  price text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_spots_trip on public.spots(trip_id);
create trigger trg_spots_updated_at before update on public.spots
  for each row execute function public.set_updated_at();

-- ─── expenses ─────────────────────────────────────────────────────────────────
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete restrict,
  amount bigint not null check (amount >= 0),
  currency text not null default 'EUR',
  category expense_category not null default 'other',
  note text,
  spent_at timestamptz not null default now(),
  split_mode split_mode not null default 'equal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_expenses_trip on public.expenses(trip_id);
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ─── expense_splits ───────────────────────────────────────────────────────────
create table public.expense_splits (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  share numeric(12,4) not null default 1,
  primary key (expense_id, user_id)
);

-- ─── checklist_items ──────────────────────────────────────────────────────────
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  category checklist_category not null default 'other',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_checklist_items_trip on public.checklist_items(trip_id);
create trigger trg_checklist_items_updated_at before update on public.checklist_items
  for each row execute function public.set_updated_at();

-- ─── checklist_completions ────────────────────────────────────────────────────
create table public.checklist_completions (
  item_id uuid not null references public.checklist_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

-- ─── guide_cards ──────────────────────────────────────────────────────────────
create table public.guide_cards (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind guide_kind not null default 'info',
  title text not null,
  body text,
  icon_name text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_guide_cards_trip on public.guide_cards(trip_id);
create trigger trg_guide_cards_updated_at before update on public.guide_cards
  for each row execute function public.set_updated_at();

-- ─── RPCs ─────────────────────────────────────────────────────────────────────
create or replace function public.join_trip_by_code(code text)
returns uuid language plpgsql security definer as $$
declare
  v_trip_id uuid;
begin
  select id into v_trip_id from public.trips where join_code = code;
  if v_trip_id is null then
    raise exception 'TRIP_NOT_FOUND';
  end if;
  insert into public.trip_members (trip_id, user_id, role)
    values (v_trip_id, auth.uid(), 'editor')
    on conflict (trip_id, user_id) do nothing;
  return v_trip_id;
end;
$$;

create or replace function public.regenerate_join_code(trip uuid)
returns text language plpgsql security definer as $$
declare
  v_owner uuid;
  v_new text;
begin
  select owner_id into v_owner from public.trips where id = trip;
  if v_owner is null then
    raise exception 'TRIP_NOT_FOUND';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'NOT_OWNER';
  end if;
  v_new := public.generate_join_code();
  update public.trips set join_code = v_new where id = trip;
  return v_new;
end;
$$;

-- ─── RLS : activation ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.days enable row level security;
alter table public.activities enable row level security;
alter table public.activity_completions enable row level security;
alter table public.spots enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_completions enable row level security;
alter table public.guide_cards enable row level security;

-- ─── RLS : profiles ───────────────────────────────────────────────────────────
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_self" on public.profiles for delete using (auth.uid() = id);

-- ─── RLS : trips ──────────────────────────────────────────────────────────────
create policy "trips_select_member" on public.trips for select using (public.is_trip_member(id));
create policy "trips_insert_owner" on public.trips for insert with check (auth.uid() = owner_id);
create policy "trips_update_editor" on public.trips for update using (
  exists (
    select 1 from public.trip_members
    where trip_id = id and user_id = auth.uid() and role in ('owner','editor')
  )
);
create policy "trips_delete_owner" on public.trips for delete using (
  exists (
    select 1 from public.trip_members
    where trip_id = id and user_id = auth.uid() and role = 'owner'
  )
);

-- ─── RLS : trip_members ───────────────────────────────────────────────────────
create policy "tm_select_member" on public.trip_members for select using (public.is_trip_member(trip_id));
-- Pas de policy INSERT côté client : passage obligatoire par join_trip_by_code (security definer)
create policy "tm_update_owner" on public.trip_members for update using (
  exists (select 1 from public.trip_members m where m.trip_id = trip_members.trip_id and m.user_id = auth.uid() and m.role = 'owner')
);
create policy "tm_delete_self_or_owner" on public.trip_members for delete using (
  user_id = auth.uid()
  or exists (select 1 from public.trip_members m where m.trip_id = trip_members.trip_id and m.user_id = auth.uid() and m.role = 'owner')
);

-- ─── RLS : tables enfants de trips (read/write via is_trip_member) ────────────
create policy "days_all" on public.days for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "activities_all" on public.activities for all
  using (public.is_trip_member((select trip_id from public.days where id = day_id)))
  with check (public.is_trip_member((select trip_id from public.days where id = day_id)));
create policy "spots_all" on public.spots for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "expenses_all" on public.expenses for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "expense_splits_all" on public.expense_splits for all
  using (public.is_trip_member((select trip_id from public.expenses where id = expense_id)))
  with check (public.is_trip_member((select trip_id from public.expenses where id = expense_id)));
create policy "checklist_items_all" on public.checklist_items for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "guide_cards_all" on public.guide_cards for all
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

-- ─── RLS : completions (self only) ────────────────────────────────────────────
create policy "activity_completions_self" on public.activity_completions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "checklist_completions_self" on public.checklist_completions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
