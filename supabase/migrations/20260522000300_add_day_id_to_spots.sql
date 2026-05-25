-- Ajoute day_id (nullable) sur spots pour permettre de filtrer la carte par jour.
-- Nullable car un spot peut exister sans être rattaché à un jour spécifique (mode "Tous").

alter table public.spots
  add column day_id uuid references public.days(id) on delete set null;

create index idx_spots_day on public.spots(day_id);

comment on column public.spots.day_id is
  'Optional link to a specific day. When set, the spot appears in the day filter; when null, only visible in "Tous" view.';
