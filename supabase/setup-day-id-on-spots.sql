-- ─── Setup: day_id sur spots (sous-projet A · Map Shell v2) ──────────────────
-- À exécuter dans Supabase Dashboard → SQL Editor :
-- https://supabase.com/dashboard/project/bprcrsqeaqudbwumztoy/sql/new
--
-- Équivalent direct de la migration locale :
-- supabase/migrations/20260522000300_add_day_id_to_spots.sql
-- (Migration créée localement mais non poussée — CLI loggé sur autres comptes.)
--
-- Effet : permet au filtre par jour de la carte de fonctionner sur les vrais
-- voyages (pas seulement le mode démo qui stocke tout en Dexie/IndexedDB local).
--
-- Safe à exécuter : ALTER TABLE ADD COLUMN nullable = pas de lock long,
-- pas de réécriture de table, idempotent via "if not exists" sur l'index.

alter table public.spots
  add column if not exists day_id uuid references public.days(id) on delete set null;

create index if not exists idx_spots_day on public.spots(day_id);

comment on column public.spots.day_id is
  'Optional link to a specific day. When set, the spot appears in the day filter; when null, only visible in "Tous" view.';

-- Vérification (à run après) :
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_name = 'spots' and table_schema = 'public' and column_name = 'day_id';
-- Expected : day_id | uuid | YES
