-- ─── messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_messages_trip_created on public.messages(trip_id, created_at);
create trigger trg_messages_updated_at before update on public.messages
  for each row execute function public.set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.messages enable row level security;

create policy "messages_select_member" on public.messages
  for select using (public.is_trip_member(trip_id));

create policy "messages_insert_member" on public.messages
  for insert with check (
    auth.uid() = user_id
    and public.is_trip_member(trip_id)
  );

create policy "messages_delete_self" on public.messages
  for delete using (auth.uid() = user_id);

-- Pas d'UPDATE : un message envoyé n'est pas modifiable (MVP).

-- ─── Realtime : activer la publication pour messages ──────────────────────────
alter publication supabase_realtime add table public.messages;
