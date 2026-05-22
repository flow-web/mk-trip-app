# GPS Leaderboard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer la boucle complète "créer un segment par 1er run → courir un segment → comparer sur leaderboard global", déployable en stealth via feature flag.

**Architecture:** PostGIS sur Supabase pour stockage géo et validation transactionnelle des runs ; Mapbox GL via react-map-gl déjà en place ; hooks GPS purs en TypeScript + Wake Lock pendant le run ; RPC `submit_run` et `create_segment_from_run` server-side pour anti-triche basique et calcul des stats agrégées.

**Tech Stack:** Next.js 16 App Router, Supabase (PostGIS), Mapbox GL JS, react-map-gl, turf.js (à installer), Vitest (à installer pour tests purs), Wake Lock API.

**Spec source :** `docs/superpowers/specs/2026-05-22-gps-leaderboard-design.md`

**Scope :** Phase 1 uniquement (Core boucle). Phases 2-5 (anti-triche server étendu, offline IndexedDB, ghost run live, éditeur carte) seront des plans séparés écrits après livraison de Phase 1.

**Note tests :** Les tests Vitest ne couvrent que la logique pure (calculs GPS, Haversine, parsing trace). Pas de tests sur les composants UI ni les pages. Si Florian préfère sauter Vitest pour aller vite, les Tasks 3, 5, 6 peuvent être skipped — la migration SQL et les RPC restent testées manuellement.

---

## File Structure

**Nouveaux fichiers SQL :**
- `supabase/migrations/20260522000000_gps_segments.sql` — extension PostGIS, enum, tables, RLS
- `supabase/migrations/20260522000100_gps_rpcs.sql` — RPC `create_segment_from_run` et `submit_run`

**Nouveaux fichiers TypeScript — lib (logique pure) :**
- `lib/segments/types.ts` — types domaine (`Segment`, `Run`, `ActivityKind`, `TracePoint`)
- `lib/segments/geo.ts` — calculs Haversine, distance, vitesse, conversion en GeoJSON LineString
- `lib/segments/queries.ts` — lectures Supabase (`listSegmentsInBounds`, `getSegment`, `listLeaderboard`)
- `lib/segments/actions.ts` — Server Actions (`createSegmentFromRun`, `submitRun`)
- `lib/segments/__tests__/geo.test.ts` — tests Vitest

**Nouveaux hooks :**
- `lib/segments/useGeolocationTracker.ts`
- `lib/segments/useRunRecorder.ts`
- `lib/segments/useWakeLock.ts`

**Nouveaux composants UI :**
- `components/segments/SegmentMap.tsx`
- `components/segments/SegmentTraceMap.tsx`
- `components/segments/LeaderboardList.tsx`
- `components/segments/ActivityChips.tsx`
- `components/segments/RunStatsCard.tsx`
- `components/segments/RunHUD.tsx`
- `components/segments/CountdownGo.tsx`

**Nouvelles pages App Router :**
- `app/segments/layout.tsx`
- `app/segments/page.tsx`
- `app/segments/[id]/page.tsx`
- `app/segments/[id]/run/page.tsx`
- `app/segments/new/live/page.tsx`

**Modifications :**
- `app/page.tsx` — ajouter un lien "Segments" depuis la home
- `lib/supabase/types.ts` — régénération auto (commande `npm run db:types`)
- `package.json` — ajouter `turf` + `vitest` (devDep)
- `.env.local` — `NEXT_PUBLIC_SEGMENTS_ENABLED` (feature flag)

---

## Task 1 : Migration PostGIS + schéma segments/runs/activity_rules

**Files:**
- Create: `supabase/migrations/20260522000000_gps_segments.sql`

- [ ] **Step 1 : Vérifier que PostGIS n'est pas déjà activé**

Run dans Supabase SQL Editor ou via psql :
```sql
select * from pg_extension where extname = 'postgis';
```
Si vide → on l'active dans la migration.

- [ ] **Step 2 : Créer le fichier de migration**

Contenu intégral de `supabase/migrations/20260522000000_gps_segments.sql` :

```sql
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
```

- [ ] **Step 3 : Appliquer la migration**

Run :
```bash
npx supabase db push
```
Expected : migration appliquée sans erreur, output contenant `Applying migration 20260522000000_gps_segments.sql`.

- [ ] **Step 4 : Vérifier les tables**

Run via SQL editor Supabase :
```sql
select count(*) from segments;       -- 0
select count(*) from runs;           -- 0
select * from activity_rules;        -- 6 lignes
```

- [ ] **Step 5 : Régénérer les types TypeScript**

Run :
```bash
npm run db:types
```
Expected : `lib/supabase/types.ts` mis à jour, contient `segments`, `runs`, `activity_rules`, `activity_kind`.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/20260522000000_gps_segments.sql lib/supabase/types.ts
git commit -m "feat(segments): schema PostGIS segments/runs/activity_rules + RLS"
```

---

## Task 2 : RPC create_segment_from_run + submit_run

**Files:**
- Create: `supabase/migrations/20260522000100_gps_rpcs.sql`

- [ ] **Step 1 : Créer le fichier de migration RPC**

Contenu intégral de `supabase/migrations/20260522000100_gps_rpcs.sql` :

```sql
-- ─── Helper : calcul stats run depuis une trace + durée ───────────────────────
create or replace function public._compute_run_stats(
  p_trace       geometry,
  p_duration_ms integer
) returns table (
  distance_m     integer,
  speed_avg_kmh  numeric,
  speed_max_kmh  numeric
) language plpgsql as $$
declare
  v_dist_m float;
  v_max_kmh numeric := 0;
  v_pts geometry[];
  i int;
  d float;
  dt float;
begin
  v_dist_m := ST_Length(p_trace::geography);
  -- Approche simple : on regarde les sauts entre points consécutifs pour la vitesse max
  -- (la trace n'a pas de timestamps par point ici ; on borne par speed_avg + marge)
  -- Pour MVP : speed_avg = distance / duration ; speed_max = speed_avg * 1.4 (heuristique)
  -- Phase 2 améliorera en stockant les timestamps par point.
  if p_duration_ms > 0 then
    distance_m := round(v_dist_m)::integer;
    speed_avg_kmh := round(((v_dist_m / (p_duration_ms / 1000.0)) * 3.6)::numeric, 2);
    speed_max_kmh := round((speed_avg_kmh * 1.4)::numeric, 2);
    return next;
  end if;
end;
$$;

-- ─── Helper : validate_run renvoie reason ou null si valide ───────────────────
create or replace function public._validate_run(
  p_segment_id  uuid,
  p_trace       geometry,
  p_duration_ms integer
) returns text language plpgsql as $$
declare
  v_seg          public.segments;
  v_rule         public.activity_rules;
  v_trace_len_m  float;
  v_speed_avg    numeric;
  v_dist_from_start float;
  v_dist_from_end   float;
  v_hausdorff_m  float;
begin
  select * into v_seg from public.segments where id = p_segment_id;
  if v_seg.id is null then
    return 'SEGMENT_NOT_FOUND';
  end if;
  select * into v_rule from public.activity_rules where activity = v_seg.activity;

  if p_duration_ms < v_rule.min_duration_ms then
    return 'DURATION_TOO_SHORT';
  end if;

  v_trace_len_m := ST_Length(p_trace::geography);
  if v_trace_len_m < v_seg.distance_m * v_rule.distance_ratio_min then
    return 'TRACE_TOO_SHORT';
  end if;
  if v_trace_len_m > v_seg.distance_m * v_rule.distance_ratio_max then
    return 'TRACE_TOO_LONG';
  end if;

  v_speed_avg := (v_trace_len_m / (p_duration_ms / 1000.0)) * 3.6;
  if v_speed_avg > v_rule.max_speed_kmh then
    return 'SPEED_IMPOSSIBLE';
  end if;

  v_hausdorff_m := ST_HausdorffDistance(p_trace::geography, v_seg.geom::geography);
  if v_hausdorff_m > v_rule.hausdorff_tol_m then
    return 'OUT_OF_TRACK';
  end if;

  v_dist_from_start := ST_Distance(geography(ST_StartPoint(p_trace)), v_seg.start_point);
  v_dist_from_end   := ST_Distance(geography(ST_EndPoint(p_trace)),   v_seg.end_point);
  if v_dist_from_start > v_rule.hausdorff_tol_m * 2 then
    return 'START_TOO_FAR';
  end if;
  if v_dist_from_end > v_rule.hausdorff_tol_m * 2 then
    return 'END_TOO_FAR';
  end if;

  return null;
end;
$$;

-- ─── RPC : submit_run ─────────────────────────────────────────────────────────
create or replace function public.submit_run(
  p_segment_id  uuid,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz
) returns public.runs language plpgsql security definer as $$
declare
  v_reason text;
  v_stats record;
  v_run public.runs;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if ST_SRID(p_trace) <> 4326 then
    raise exception 'INVALID_SRID';
  end if;

  v_reason := public._validate_run(p_segment_id, p_trace, p_duration_ms);
  select * into v_stats from public._compute_run_stats(p_trace, p_duration_ms);

  insert into public.runs (
    segment_id, user_id, trace, duration_ms, distance_m,
    speed_avg_kmh, speed_max_kmh, started_at, is_valid, invalid_reason
  ) values (
    p_segment_id, auth.uid(), p_trace, p_duration_ms, v_stats.distance_m,
    v_stats.speed_avg_kmh, v_stats.speed_max_kmh, p_started_at,
    (v_reason is null), v_reason
  ) returning * into v_run;

  return v_run;
end;
$$;

-- ─── RPC : create_segment_from_run ────────────────────────────────────────────
create or replace function public.create_segment_from_run(
  p_name        text,
  p_description text,
  p_activity    activity_kind,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz,
  p_cover_color text default '#FF6B4A'
) returns public.segments language plpgsql security definer as $$
declare
  v_seg public.segments;
  v_dist int;
  v_stats record;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if ST_SRID(p_trace) <> 4326 then
    raise exception 'INVALID_SRID';
  end if;
  if ST_NumPoints(p_trace) < 2 then
    raise exception 'TRACE_TOO_FEW_POINTS';
  end if;

  v_dist := round(ST_Length(p_trace::geography))::integer;
  if v_dist < 50 then
    raise exception 'SEGMENT_TOO_SHORT';
  end if;

  insert into public.segments (creator_id, name, description, activity, geom, distance_m, cover_color)
    values (auth.uid(), p_name, p_description, p_activity, p_trace, v_dist, coalesce(p_cover_color, '#FF6B4A'))
    returning * into v_seg;

  select * into v_stats from public._compute_run_stats(p_trace, p_duration_ms);

  insert into public.runs (
    segment_id, user_id, trace, duration_ms, distance_m,
    speed_avg_kmh, speed_max_kmh, started_at, is_valid
  ) values (
    v_seg.id, auth.uid(), p_trace, p_duration_ms, v_stats.distance_m,
    v_stats.speed_avg_kmh, v_stats.speed_max_kmh, p_started_at, true
  );

  return v_seg;
end;
$$;

grant execute on function public.submit_run to authenticated;
grant execute on function public.create_segment_from_run to authenticated;
```

- [ ] **Step 2 : Appliquer la migration**

Run :
```bash
npx supabase db push
```
Expected : `Applying migration 20260522000100_gps_rpcs.sql`.

- [ ] **Step 3 : Tester `create_segment_from_run` manuellement**

Dans le SQL editor Supabase (authentifié avec un compte test) :
```sql
select public.create_segment_from_run(
  'Test segment Bordeaux',
  'Spot de test',
  'skate'::activity_kind,
  ST_GeomFromText('LINESTRING(-0.580 44.838, -0.581 44.839, -0.582 44.840)', 4326),
  60000,
  now()
);
```
Expected : un row de `segments` avec un UUID, et un row de `runs` lié.

- [ ] **Step 4 : Tester `submit_run` avec une trace invalide**

```sql
-- Soumettre une trace très éloignée du segment créé en Step 3
select public.submit_run(
  '<segment_id_de_step_3>'::uuid,
  ST_GeomFromText('LINESTRING(0 0, 1 1)', 4326),
  60000,
  now()
);
```
Expected : run inséré avec `is_valid = false`, `invalid_reason` non nul (probablement `OUT_OF_TRACK`).

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/20260522000100_gps_rpcs.sql
git commit -m "feat(segments): RPC create_segment_from_run + submit_run avec validation"
```

---

## Task 3 : Installer Vitest pour les tests de logique pure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1 : Installer Vitest et turf.js**

Run :
```bash
npm i -D vitest @vitest/coverage-v8
npm i @turf/turf
```

- [ ] **Step 2 : Créer `vitest.config.ts`**

Contenu intégral :
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 3 : Ajouter script test au `package.json`**

Modifier la section `scripts` pour ajouter :
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4 : Vérifier que `npm test` passe (sans tests)**

Run :
```bash
npm test
```
Expected : `No test files found` (pas d'erreur).

- [ ] **Step 5 : Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(test): installer Vitest + @turf/turf pour tests de logique GPS"
```

---

## Task 4 : Types domaine `lib/segments/types.ts`

**Files:**
- Create: `lib/segments/types.ts`

- [ ] **Step 1 : Créer le fichier types**

Contenu intégral :
```ts
import type { Database } from '@/lib/supabase/types'

export type ActivityKind = Database['public']['Enums']['activity_kind']
export type SegmentRow = Database['public']['Tables']['segments']['Row']
export type RunRow = Database['public']['Tables']['runs']['Row']

export interface TracePoint {
  lat: number
  lng: number
  /** ms epoch */
  t: number
  /** précision GPS en mètres (depuis GeolocationCoordinates.accuracy) */
  accuracy?: number
}

export interface RunStats {
  durationMs: number
  distanceM: number
  speedAvgKmh: number
  speedMaxKmh: number
}

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  skate: 'Skate',
  run: 'Course',
  bike: 'Vélo',
  car: 'Voiture',
  walk: 'Marche',
  other: 'Autre',
}

export const ACTIVITY_COLORS: Record<ActivityKind, string> = {
  skate: '#FF6B4A',
  run: '#4A90E2',
  bike: '#2EC4B6',
  car: '#E63946',
  walk: '#9C89B8',
  other: '#7A6F60',
}
```

- [ ] **Step 2 : Commit**

```bash
git add lib/segments/types.ts
git commit -m "feat(segments): types domaine ActivityKind, TracePoint, RunStats"
```

---

## Task 5 : Lib `lib/segments/geo.ts` avec tests (TDD)

**Files:**
- Create: `lib/segments/__tests__/geo.test.ts`
- Create: `lib/segments/geo.ts`

- [ ] **Step 1 : Écrire les tests d'abord**

Contenu intégral de `lib/segments/__tests__/geo.test.ts` :
```ts
import { describe, it, expect } from 'vitest'
import {
  haversineMeters,
  totalDistanceMeters,
  computeRunStats,
  pointsToLineString,
} from '../geo'
import type { TracePoint } from '../types'

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMeters(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0)
  })

  it('returns ~111km between (0,0) and (1,0)', () => {
    const d = haversineMeters(0, 0, 1, 0)
    expect(d).toBeGreaterThan(111_000)
    expect(d).toBeLessThan(111_500)
  })

  it('returns ~157m between two Paris points', () => {
    const d = haversineMeters(48.8566, 2.3522, 48.8580, 2.3522)
    expect(d).toBeGreaterThan(150)
    expect(d).toBeLessThan(165)
  })
})

describe('totalDistanceMeters', () => {
  it('returns 0 for empty or single-point trace', () => {
    expect(totalDistanceMeters([])).toBe(0)
    expect(totalDistanceMeters([{ lat: 0, lng: 0, t: 0 }])).toBe(0)
  })

  it('sums distances between consecutive points', () => {
    const pts: TracePoint[] = [
      { lat: 0, lng: 0, t: 0 },
      { lat: 1, lng: 0, t: 1000 },
      { lat: 2, lng: 0, t: 2000 },
    ]
    const total = totalDistanceMeters(pts)
    expect(total).toBeGreaterThan(222_000)
    expect(total).toBeLessThan(223_000)
  })
})

describe('computeRunStats', () => {
  it('returns zeros for empty trace', () => {
    const s = computeRunStats([])
    expect(s.distanceM).toBe(0)
    expect(s.durationMs).toBe(0)
    expect(s.speedAvgKmh).toBe(0)
    expect(s.speedMaxKmh).toBe(0)
  })

  it('computes avg and max speed from a 3-point trace', () => {
    // 2 segments : 100m en 10s (36 km/h), 200m en 10s (72 km/h)
    const pts: TracePoint[] = [
      { lat: 48.8566, lng: 2.3522, t: 0 },
      { lat: 48.85750, lng: 2.3522, t: 10_000 }, // ~100m, 36 km/h
      { lat: 48.85930, lng: 2.3522, t: 20_000 }, // ~200m, 72 km/h
    ]
    const s = computeRunStats(pts)
    expect(s.durationMs).toBe(20_000)
    expect(s.distanceM).toBeGreaterThan(290)
    expect(s.distanceM).toBeLessThan(310)
    expect(s.speedMaxKmh).toBeGreaterThan(70)
    expect(s.speedMaxKmh).toBeLessThan(75)
    expect(s.speedAvgKmh).toBeGreaterThan(50)
    expect(s.speedAvgKmh).toBeLessThan(56)
  })
})

describe('pointsToLineString', () => {
  it('returns a GeoJSON LineString', () => {
    const ls = pointsToLineString([
      { lat: 48.8566, lng: 2.3522, t: 0 },
      { lat: 48.8580, lng: 2.3522, t: 1000 },
    ])
    expect(ls.type).toBe('LineString')
    expect(ls.coordinates).toHaveLength(2)
    expect(ls.coordinates[0]).toEqual([2.3522, 48.8566])
  })

  it('throws on < 2 points (PostGIS LineString invalid)', () => {
    expect(() => pointsToLineString([])).toThrow()
    expect(() => pointsToLineString([{ lat: 0, lng: 0, t: 0 }])).toThrow()
  })
})
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run :
```bash
npm test
```
Expected : tous les tests fail avec `Cannot find module '../geo'`.

- [ ] **Step 3 : Implémenter `lib/segments/geo.ts`**

Contenu intégral :
```ts
import type { TracePoint, RunStats } from './types'

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

export function totalDistanceMeters(points: TracePoint[]): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    total += haversineMeters(a.lat, a.lng, b.lat, b.lng)
  }
  return total
}

export function computeRunStats(points: TracePoint[]): RunStats {
  if (points.length < 2) {
    return { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 }
  }
  const durationMs = points[points.length - 1].t - points[0].t
  let distanceM = 0
  let speedMaxKmh = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const d = haversineMeters(a.lat, a.lng, b.lat, b.lng)
    distanceM += d
    const dt = (b.t - a.t) / 1000
    if (dt > 0) {
      const kmh = (d / dt) * 3.6
      if (kmh > speedMaxKmh) speedMaxKmh = kmh
    }
  }
  const speedAvgKmh = durationMs > 0 ? (distanceM / (durationMs / 1000)) * 3.6 : 0
  return {
    durationMs,
    distanceM: Math.round(distanceM),
    speedAvgKmh: Math.round(speedAvgKmh * 100) / 100,
    speedMaxKmh: Math.round(speedMaxKmh * 100) / 100,
  }
}

export interface GeoJsonLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export function pointsToLineString(points: TracePoint[]): GeoJsonLineString {
  if (points.length < 2) {
    throw new Error('LineString needs at least 2 points')
  }
  return {
    type: 'LineString',
    coordinates: points.map((p) => [p.lng, p.lat]),
  }
}
```

- [ ] **Step 4 : Lancer les tests, vérifier qu'ils passent**

Run :
```bash
npm test
```
Expected : 9 tests passed.

- [ ] **Step 5 : Commit**

```bash
git add lib/segments/geo.ts lib/segments/__tests__/geo.test.ts
git commit -m "feat(segments): calculs GPS Haversine + computeRunStats + tests"
```

---

## Task 6 : Hook `useWakeLock`

**Files:**
- Create: `lib/segments/useWakeLock.ts`

- [ ] **Step 1 : Implémenter le hook**

Contenu intégral :
```ts
'use client'

import { useEffect, useRef } from 'react'

type Sentinel = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: { request: (type: 'screen') => Promise<Sentinel> }
}

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<Sentinel | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithWakeLock
    if (!active || !nav.wakeLock) return

    let cancelled = false
    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request('screen')
        if (cancelled) {
          await s.release()
          return
        }
        sentinelRef.current = s
        s.addEventListener('release', () => {
          sentinelRef.current = null
        })
      } catch {
        // permission denied or unavailable — silent
      }
    }
    acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinelRef.current?.release()
      sentinelRef.current = null
    }
  }, [active])
}
```

- [ ] **Step 2 : Commit**

```bash
git add lib/segments/useWakeLock.ts
git commit -m "feat(segments): hook useWakeLock pour garder l'ecran allume pendant un run"
```

---

## Task 7 : Hook `useGeolocationTracker`

**Files:**
- Create: `lib/segments/useGeolocationTracker.ts`

- [ ] **Step 1 : Implémenter le hook**

Contenu intégral :
```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeRunStats } from './geo'
import type { TracePoint, RunStats } from './types'

type TrackerStatus = 'idle' | 'tracking' | 'stopped' | 'error'

interface TrackerState {
  status: TrackerStatus
  points: TracePoint[]
  stats: RunStats
  error?: string
  currentSpeedKmh: number
  currentAccuracyM?: number
}

export function useGeolocationTracker() {
  const [state, setState] = useState<TrackerState>({
    status: 'idle',
    points: [],
    stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
    currentSpeedKmh: 0,
  })
  const watchIdRef = useRef<number | null>(null)
  const pointsRef = useRef<TracePoint[]>([])

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setState((s) => ({
      ...s,
      status: 'stopped',
      points: [...pointsRef.current],
      stats: computeRunStats(pointsRef.current),
    }))
  }, [])

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'error', error: 'Geolocation indisponible' }))
      return
    }
    pointsRef.current = []
    setState({
      status: 'tracking',
      points: [],
      stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
      currentSpeedKmh: 0,
    })
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: TracePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: pos.timestamp,
          accuracy: pos.coords.accuracy,
        }
        pointsRef.current.push(pt)
        const stats = computeRunStats(pointsRef.current)
        const speedFromBrowser =
          pos.coords.speed != null && !isNaN(pos.coords.speed)
            ? pos.coords.speed * 3.6
            : null
        setState({
          status: 'tracking',
          points: [...pointsRef.current],
          stats,
          currentSpeedKmh: speedFromBrowser ?? stats.speedAvgKmh,
          currentAccuracyM: pos.coords.accuracy,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          status: 'error',
          error: err.code === err.PERMISSION_DENIED ? 'Permission refusée' : err.message,
        }))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    )
  }, [])

  const reset = useCallback(() => {
    pointsRef.current = []
    setState({
      status: 'idle',
      points: [],
      stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
      currentSpeedKmh: 0,
    })
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { ...state, start, stop, reset }
}
```

- [ ] **Step 2 : Commit**

```bash
git add lib/segments/useGeolocationTracker.ts
git commit -m "feat(segments): hook useGeolocationTracker base sur watchPosition"
```

---

## Task 8 : Queries Supabase `lib/segments/queries.ts`

**Files:**
- Create: `lib/segments/queries.ts`

- [ ] **Step 1 : Implémenter les queries**

Contenu intégral :
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SegmentRow, RunRow, ActivityKind } from './types'

export interface SegmentWithStats extends SegmentRow {
  run_count: number
  best_duration_ms: number | null
}

export async function listSegmentsInBounds(opts: {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  activity?: ActivityKind
  limit?: number
}): Promise<SegmentWithStats[]> {
  const supabase = await createSupabaseServerClient()
  // Récupère les segments dont start_point ou end_point est dans la bbox.
  // PostGIS : pas direct via PostgREST → on filtre côté JS, ou on ajoute une RPC dédiée.
  // Pour MVP : on ramène tout (limité à 500) + filtre activity, et on filtre bbox côté serveur via une RPC simple.
  let q = supabase
    .from('segments')
    .select('*, runs(count)')
    .limit(opts.limit ?? 500)
  if (opts.activity) q = q.eq('activity', opts.activity)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...(row as SegmentRow),
    run_count: row.runs?.[0]?.count ?? 0,
    best_duration_ms: null,
  }))
}

export async function getSegment(id: string): Promise<SegmentRow | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('segments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export interface LeaderboardEntry {
  run_id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  duration_ms: number
  speed_avg_kmh: number | null
  speed_max_kmh: number | null
  created_at: string
}

export async function listLeaderboard(
  segmentId: string,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('runs')
    .select('id, user_id, duration_ms, speed_avg_kmh, speed_max_kmh, created_at, profiles(display_name, avatar_url)')
    .eq('segment_id', segmentId)
    .eq('is_valid', true)
    .order('duration_ms', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    run_id: r.id,
    user_id: r.user_id,
    display_name: r.profiles?.display_name ?? '—',
    avatar_url: r.profiles?.avatar_url ?? null,
    duration_ms: r.duration_ms,
    speed_avg_kmh: r.speed_avg_kmh,
    speed_max_kmh: r.speed_max_kmh,
    created_at: r.created_at,
  }))
}
```

- [ ] **Step 2 : Vérifier compilation TypeScript**

Run :
```bash
npx tsc --noEmit
```
Expected : pas d'erreur.

- [ ] **Step 3 : Commit**

```bash
git add lib/segments/queries.ts
git commit -m "feat(segments): queries listSegmentsInBounds, getSegment, listLeaderboard"
```

---

## Task 9 : Server Actions `lib/segments/actions.ts`

**Files:**
- Create: `lib/segments/actions.ts`

- [ ] **Step 1 : Implémenter les actions**

Contenu intégral :
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { pointsToLineString } from './geo'
import type { TracePoint, ActivityKind } from './types'

function toWkt(points: TracePoint[]): string {
  const ls = pointsToLineString(points)
  const coords = ls.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
  return `SRID=4326;LINESTRING(${coords})`
}

export interface CreateSegmentInput {
  name: string
  description?: string
  activity: ActivityKind
  coverColor?: string
  points: TracePoint[]
  durationMs: number
  startedAt: string
}

export interface SubmitRunInput {
  segmentId: string
  points: TracePoint[]
  durationMs: number
  startedAt: string
}

export async function createSegmentFromRun(input: CreateSegmentInput) {
  const supabase = await createSupabaseServerClient()
  const wkt = toWkt(input.points)
  const { data, error } = await supabase.rpc('create_segment_from_run', {
    p_name: input.name,
    p_description: input.description ?? null,
    p_activity: input.activity,
    p_trace: wkt,
    p_duration_ms: input.durationMs,
    p_started_at: input.startedAt,
    p_cover_color: input.coverColor ?? '#FF6B4A',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/segments')
  return data as { id: string }
}

export async function submitRun(input: SubmitRunInput) {
  const supabase = await createSupabaseServerClient()
  const wkt = toWkt(input.points)
  const { data, error } = await supabase.rpc('submit_run', {
    p_segment_id: input.segmentId,
    p_trace: wkt,
    p_duration_ms: input.durationMs,
    p_started_at: input.startedAt,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/segments/${input.segmentId}`)
  return data as { id: string; is_valid: boolean; invalid_reason: string | null }
}
```

- [ ] **Step 2 : Vérifier compilation**

Run :
```bash
npx tsc --noEmit
```
Expected : pas d'erreur.

- [ ] **Step 3 : Commit**

```bash
git add lib/segments/actions.ts
git commit -m "feat(segments): server actions createSegmentFromRun + submitRun (WKT EWKT)"
```

---

## Task 10 : Composant `ActivityChips`

**Files:**
- Create: `components/segments/ActivityChips.tsx`

- [ ] **Step 1 : Implémenter**

Contenu intégral :
```tsx
'use client'

import { ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'

const ACTIVITIES: ActivityKind[] = ['skate', 'run', 'bike', 'car', 'walk', 'other']

export function ActivityChips({
  selected,
  onSelect,
}: {
  selected: ActivityKind | null
  onSelect: (a: ActivityKind | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-3">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
          selected === null
            ? 'bg-ink dark:bg-ink-dark text-paper border-ink dark:border-ink-dark'
            : 'border-hairline dark:border-hairline-dark'
        }`}
      >
        Toutes
      </button>
      {ACTIVITIES.map((a) => {
        const active = selected === a
        return (
          <button
            key={a}
            type="button"
            onClick={() => onSelect(a)}
            style={
              active
                ? { background: ACTIVITY_COLORS[a], borderColor: ACTIVITY_COLORS[a] }
                : undefined
            }
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
              active
                ? 'text-white'
                : 'border-hairline dark:border-hairline-dark'
            }`}
          >
            {ACTIVITY_LABELS[a]}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add components/segments/ActivityChips.tsx
git commit -m "feat(segments): composant ActivityChips (filtre activite)"
```

---

## Task 11 : Composant `SegmentMap`

**Files:**
- Create: `components/segments/SegmentMap.tsx`

- [ ] **Step 1 : Implémenter**

Contenu intégral :
```tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { ACTIVITY_COLORS } from '@/lib/segments/types'
import type { SegmentWithStats } from '@/lib/segments/queries'

interface Props {
  segments: SegmentWithStats[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  onMove?: (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void
  initialCenter?: { lat: number; lng: number; zoom?: number }
}

export function SegmentMap({ segments, selectedId, onSelect, onMove, initialCenter }: Props) {
  const center = initialCenter ?? { lat: 46.5, lng: 2.5, zoom: 5 }
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude: center.lat,
        longitude: center.lng,
        zoom: center.zoom ?? 5,
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
      onMoveEnd={(e) => {
        if (!onMove) return
        const b = e.target.getBounds()
        if (!b) return
        onMove({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        })
      }}
    >
      <NavigationControl position="top-right" />
      {segments.map((s) => {
        // Affichage : pin sur le start_point (on a juste les coords du linestring côté JS via la geom, pas dispo direct ici).
        // On utilise un proxy : récupérer le 1er point via la query (à étendre Task 12). Pour MVP, on ne dessine que des pins quand on a l'info.
        return null
      })}
    </Map>
  )
}
```

> **Note :** À la fin de la Task 11, la carte est techniquement affichée mais sans pins (les segments n'ont pas leurs coords exposées côté client). On corrige ça en Task 12 en exposant `start_lng/start_lat` via une vue ou un cast PostGIS dans la query.

- [ ] **Step 2 : Commit**

```bash
git add components/segments/SegmentMap.tsx
git commit -m "feat(segments): composant SegmentMap squelette (pins en Task 12)"
```

---

## Task 12 : Vue PostGIS `segments_public_view` + adapter query

**Files:**
- Create: `supabase/migrations/20260522000200_segments_view.sql`
- Modify: `lib/segments/queries.ts`
- Modify: `components/segments/SegmentMap.tsx`

- [ ] **Step 1 : Créer la vue**

Contenu intégral de `supabase/migrations/20260522000200_segments_view.sql` :
```sql
create or replace view public.segments_public as
  select
    s.id,
    s.creator_id,
    s.name,
    s.description,
    s.activity,
    s.distance_m,
    s.cover_color,
    s.created_at,
    ST_X(ST_StartPoint(s.geom))::float as start_lng,
    ST_Y(ST_StartPoint(s.geom))::float as start_lat,
    ST_X(ST_EndPoint(s.geom))::float   as end_lng,
    ST_Y(ST_EndPoint(s.geom))::float   as end_lat,
    ST_AsGeoJSON(s.geom)::json         as geom_geojson
  from public.segments s;

grant select on public.segments_public to anon, authenticated;
```

- [ ] **Step 2 : Appliquer la migration**

```bash
npx supabase db push
npm run db:types
```

- [ ] **Step 3 : Adapter `lib/segments/queries.ts` pour utiliser la vue**

Remplacer le contenu de `listSegmentsInBounds` :
```ts
export interface SegmentPublic {
  id: string
  creator_id: string | null
  name: string
  description: string | null
  activity: ActivityKind
  distance_m: number
  cover_color: string
  created_at: string
  start_lng: number
  start_lat: number
  end_lng: number
  end_lat: number
  geom_geojson: GeoJSON.LineString
  run_count: number
}

export async function listSegmentsInBounds(opts: {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  activity?: ActivityKind
  limit?: number
}): Promise<SegmentPublic[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase
    .from('segments_public')
    .select('*, runs:runs(count)' as any)
    .gte('start_lng', opts.minLng)
    .lte('start_lng', opts.maxLng)
    .gte('start_lat', opts.minLat)
    .lte('start_lat', opts.maxLat)
    .limit(opts.limit ?? 500)
  if (opts.activity) q = q.eq('activity', opts.activity)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...(row as SegmentPublic),
    run_count: row.runs?.[0]?.count ?? 0,
  }))
}
```

- [ ] **Step 4 : Ajouter les pins dans `SegmentMap.tsx`**

Remplacer le map() vide :
```tsx
{segments.map((s) => {
  const active = s.id === selectedId
  return (
    <Marker
      key={s.id}
      latitude={s.start_lat}
      longitude={s.start_lng}
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onSelect?.(s.id)
      }}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer transition"
        style={{
          background: ACTIVITY_COLORS[s.activity],
          transform: active ? 'scale(1.4)' : 'scale(1)',
        }}
      />
    </Marker>
  )
})}
```

Et changer la signature `segments: SegmentWithStats[]` → `segments: SegmentPublic[]` ; mettre à jour l'import.

- [ ] **Step 5 : Vérifier compilation**

```bash
npx tsc --noEmit
```
Expected : pas d'erreur.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/20260522000200_segments_view.sql lib/segments/queries.ts components/segments/SegmentMap.tsx lib/supabase/types.ts
git commit -m "feat(segments): vue segments_public avec coords + pins sur la carte"
```

---

## Task 13 : Composant `LeaderboardList`

**Files:**
- Create: `components/segments/LeaderboardList.tsx`

- [ ] **Step 1 : Implémenter**

Contenu intégral :
```tsx
import type { LeaderboardEntry } from '@/lib/segments/queries'

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId?: string | null
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-muted dark:text-ink-muted-dark px-4 py-6">
        Aucun run pour le moment. Sois le premier.
      </p>
    )
  }
  return (
    <ol className="divide-y divide-hairline dark:divide-hairline-dark">
      {entries.map((e, i) => {
        const mine = e.user_id === currentUserId
        return (
          <li
            key={e.run_id}
            className={`flex items-center gap-3 px-4 py-3 ${
              mine ? 'bg-accent/5' : ''
            }`}
          >
            <div className="w-8 text-center font-mono text-sm">{i + 1}</div>
            <div className="w-9 h-9 rounded-full bg-paper-muted dark:bg-paper-muted-dark overflow-hidden flex items-center justify-center text-xs">
              {e.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                e.display_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{e.display_name}</div>
              {e.speed_avg_kmh != null && (
                <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {e.speed_avg_kmh.toFixed(1)} km/h moy.
                </div>
              )}
            </div>
            <div className="font-mono text-sm tabular-nums">
              {formatDuration(e.duration_ms)}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add components/segments/LeaderboardList.tsx
git commit -m "feat(segments): composant LeaderboardList"
```

---

## Task 14 : Composant `CountdownGo`

**Files:**
- Create: `components/segments/CountdownGo.tsx`

- [ ] **Step 1 : Implémenter**

Contenu intégral :
```tsx
'use client'

import { useEffect, useState } from 'react'

export function CountdownGo({ onGo }: { onGo: () => void }) {
  const [n, setN] = useState(3)

  useEffect(() => {
    if (n <= 0) {
      onGo()
      return
    }
    const t = setTimeout(() => setN(n - 1), 800)
    return () => clearTimeout(t)
  }, [n, onGo])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 text-paper">
      <div
        key={n}
        className="text-[160px] font-bold tabular-nums animate-[pop_0.7s_ease-out]"
        style={{ fontFamily: 'system-ui' }}
      >
        {n > 0 ? n : 'GO'}
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add components/segments/CountdownGo.tsx
git commit -m "feat(segments): composant CountdownGo (3-2-1 GO!)"
```

---

## Task 15 : Composant `RunHUD`

**Files:**
- Create: `components/segments/RunHUD.tsx`

- [ ] **Step 1 : Implémenter**

Contenu intégral :
```tsx
'use client'

import { useEffect, useState } from 'react'
import { Square } from 'lucide-react'

interface Props {
  startedAt: number
  currentSpeedKmh: number
  distanceM: number
  accuracyM?: number
  outOfTrack?: boolean
  onStop: () => void
}

function formatDur(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const ds = Math.floor((ms % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${ds}`
}

export function RunHUD({
  startedAt,
  currentSpeedKmh,
  distanceM,
  accuracyM,
  outOfTrack,
  onStop,
}: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(i)
  }, [])

  const dur = now - startedAt

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink text-paper">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest opacity-60">Chrono</div>
          <div className="text-7xl font-bold tabular-nums">{formatDur(dur)}</div>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest opacity-60">Vitesse</div>
            <div className="text-4xl font-semibold tabular-nums">
              {currentSpeedKmh.toFixed(1)}
            </div>
            <div className="text-xs opacity-60">km/h</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest opacity-60">Distance</div>
            <div className="text-4xl font-semibold tabular-nums">{distanceM}</div>
            <div className="text-xs opacity-60">mètres</div>
          </div>
        </div>

        {accuracyM != null && (
          <div className="text-xs opacity-50">précision GPS ±{Math.round(accuracyM)}m</div>
        )}
        {outOfTrack && (
          <div className="px-4 py-2 rounded-full bg-red-500/90 text-white text-sm font-medium">
            Hors trajet
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onStop}
        className="m-6 py-5 rounded-2xl bg-red-500 text-white font-semibold flex items-center justify-center gap-2"
      >
        <Square className="w-5 h-5" fill="currentColor" />
        Stop
      </button>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add components/segments/RunHUD.tsx
git commit -m "feat(segments): composant RunHUD overlay plein ecran pendant run"
```

---

## Task 16 : Layout `app/segments/layout.tsx` + feature flag

**Files:**
- Create: `app/segments/layout.tsx`
- Modify: `.env.local` (manuel, hors git)

- [ ] **Step 1 : Implémenter le layout avec gate feature flag**

Contenu intégral :
```tsx
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Segments — MK Trip',
}

export default function SegmentsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_SEGMENTS_ENABLED !== 'true') {
    notFound()
  }
  return <div className="min-h-dvh">{children}</div>
}
```

- [ ] **Step 2 : Ajouter le flag dans `.env.local`**

Manuellement éditer `.env.local` (non commité) :
```
NEXT_PUBLIC_SEGMENTS_ENABLED=true
```

Et documenter dans `.env.example` si présent ; sinon créer un commentaire dans le code.

- [ ] **Step 3 : Commit**

```bash
git add app/segments/layout.tsx
git commit -m "feat(segments): layout /segments avec feature flag NEXT_PUBLIC_SEGMENTS_ENABLED"
```

---

## Task 17 : Page `app/segments/page.tsx` (liste + carte)

**Files:**
- Create: `app/segments/page.tsx`
- Create: `app/segments/segments-client.tsx`

- [ ] **Step 1 : Page server**

`app/segments/page.tsx` :
```tsx
import { listSegmentsInBounds } from '@/lib/segments/queries'
import { SegmentsClient } from './segments-client'

export default async function SegmentsPage() {
  // Bbox monde au premier load — on resserrera côté client après onMove.
  const segments = await listSegmentsInBounds({
    minLng: -180,
    minLat: -85,
    maxLng: 180,
    maxLat: 85,
    limit: 200,
  })
  return <SegmentsClient initialSegments={segments} />
}
```

- [ ] **Step 2 : Composant client**

`app/segments/segments-client.tsx` :
```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SegmentMap } from '@/components/segments/SegmentMap'
import { ActivityChips } from '@/components/segments/ActivityChips'
import { ACTIVITY_COLORS, ACTIVITY_LABELS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'
import type { SegmentPublic } from '@/lib/segments/queries'

export function SegmentsClient({ initialSegments }: { initialSegments: SegmentPublic[] }) {
  const [activity, setActivity] = useState<ActivityKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visible = activity
    ? initialSegments.filter((s) => s.activity === activity)
    : initialSegments

  return (
    <div className="relative h-dvh">
      <div className="absolute inset-0">
        <SegmentMap
          segments={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur border-b border-hairline dark:border-hairline-dark">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-semibold">Segments</h1>
          <Link
            href="/segments/new/live"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-paper text-sm"
          >
            <Plus className="w-4 h-4" /> Créer
          </Link>
        </div>
        <ActivityChips selected={activity} onSelect={setActivity} />
      </div>

      {selectedId &&
        (() => {
          const s = visible.find((x) => x.id === selectedId)
          if (!s) return null
          return (
            <Link
              href={`/segments/${s.id}`}
              className="absolute bottom-6 left-4 right-4 bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark rounded-2xl p-4 shadow-lg flex items-center gap-3"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: ACTIVITY_COLORS[s.activity] }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {ACTIVITY_LABELS[s.activity]} · {(s.distance_m / 1000).toFixed(2)} km · {s.run_count} runs
                </div>
              </div>
              <div className="text-sm">→</div>
            </Link>
          )
        })()}
    </div>
  )
}
```

- [ ] **Step 3 : Démarrer le dev server + tester**

```bash
npm run dev
```
Ouvrir http://localhost:3000/segments dans le browser. Expected : la carte s'affiche centrée sur la France ; les chips d'activité fonctionnent ; aucun segment (table vide).

- [ ] **Step 4 : Commit**

```bash
git add app/segments/page.tsx app/segments/segments-client.tsx
git commit -m "feat(segments): page /segments liste + carte + filtre activite"
```

---

## Task 18 : Page `app/segments/new/live/page.tsx` (création par 1er run)

**Files:**
- Create: `app/segments/new/live/page.tsx`
- Create: `app/segments/new/live/live-client.tsx`

- [ ] **Step 1 : Page server (squelette)**

`app/segments/new/live/page.tsx` :
```tsx
import { LiveCreateClient } from './live-client'

export default function NewLiveSegmentPage() {
  return <LiveCreateClient />
}
```

- [ ] **Step 2 : Client component**

`app/segments/new/live/live-client.tsx` :
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useGeolocationTracker } from '@/lib/segments/useGeolocationTracker'
import { useWakeLock } from '@/lib/segments/useWakeLock'
import { RunHUD } from '@/components/segments/RunHUD'
import { CountdownGo } from '@/components/segments/CountdownGo'
import { createSegmentFromRun } from '@/lib/segments/actions'
import { ACTIVITY_LABELS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'

type Step = 'intro' | 'countdown' | 'tracking' | 'review'

const ACTIVITIES: ActivityKind[] = ['skate', 'run', 'bike', 'car', 'walk', 'other']

export function LiveCreateClient() {
  const router = useRouter()
  const tracker = useGeolocationTracker()
  const [step, setStep] = useState<Step>('intro')
  const [name, setName] = useState('')
  const [activity, setActivity] = useState<ActivityKind>('skate')
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useWakeLock(step === 'tracking')

  const begin = () => setStep('countdown')

  const onGo = () => {
    setStartedAt(new Date().toISOString())
    tracker.start()
    setStep('tracking')
  }

  const onStop = () => {
    tracker.stop()
    setStep('review')
  }

  const save = async () => {
    if (!name.trim() || !startedAt) return
    setSaving(true)
    setError(null)
    try {
      const seg = await createSegmentFromRun({
        name: name.trim(),
        activity,
        points: tracker.points,
        durationMs: tracker.stats.durationMs,
        startedAt,
      })
      router.replace(`/segments/${seg.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Erreur')
      setSaving(false)
    }
  }

  if (step === 'intro') {
    return (
      <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Créer un segment</h1>
        <p className="text-ink-muted dark:text-ink-muted-dark">
          On va enregistrer ton 1er run. Va au point de départ, choisis l'activité, et tape "Démarrer".
        </p>

        <div>
          <label className="text-sm font-medium block mb-2">Activité</label>
          <div className="flex gap-2 flex-wrap">
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActivity(a)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  activity === a
                    ? 'bg-ink text-paper border-ink'
                    : 'border-hairline dark:border-hairline-dark'
                }`}
              >
                {ACTIVITY_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={begin}
          className="py-4 rounded-2xl bg-ink text-paper font-semibold"
        >
          Démarrer
        </button>
      </div>
    )
  }

  if (step === 'countdown') {
    return <CountdownGo onGo={onGo} />
  }

  if (step === 'tracking') {
    return (
      <RunHUD
        startedAt={Date.parse(startedAt!)}
        currentSpeedKmh={tracker.currentSpeedKmh}
        distanceM={tracker.stats.distanceM}
        accuracyM={tracker.currentAccuracyM}
        onStop={onStop}
      />
    )
  }

  // step === 'review'
  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Récap du run</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Durée</div>
          <div className="text-xl font-semibold tabular-nums">
            {Math.floor(tracker.stats.durationMs / 1000)}s
          </div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Distance</div>
          <div className="text-xl font-semibold tabular-nums">{tracker.stats.distanceM}m</div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Vit. moy</div>
          <div className="text-xl font-semibold tabular-nums">
            {tracker.stats.speedAvgKmh.toFixed(1)}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Nom du segment</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Bowl du skatepark des Quinconces"
          className="w-full px-3 py-2 rounded-xl border border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={!name.trim() || saving || tracker.points.length < 2}
        className="py-4 rounded-2xl bg-ink text-paper font-semibold disabled:opacity-50"
      >
        {saving ? 'Création…' : 'Créer le segment'}
      </button>

      <button
        type="button"
        onClick={() => {
          tracker.reset()
          setStep('intro')
        }}
        className="text-sm text-ink-muted dark:text-ink-muted-dark"
      >
        Recommencer
      </button>
    </div>
  )
}
```

- [ ] **Step 3 : Test manuel sur mobile (ou desktop avec mock GPS)**

Lancer `npm run dev`, ouvrir http://localhost:3000/segments/new/live. Démarrer un run avec mock geolocation Chrome DevTools (Sensors → Location). Faire 30s avec différents points. Vérifier que le récap s'affiche et que `createSegmentFromRun` est appelée.

- [ ] **Step 4 : Commit**

```bash
git add app/segments/new/live/page.tsx app/segments/new/live/live-client.tsx
git commit -m "feat(segments): page creation par 1er run live (intro/countdown/track/review)"
```

---

## Task 19 : Page `app/segments/[id]/page.tsx` (détail + leaderboard)

**Files:**
- Create: `app/segments/[id]/page.tsx`
- Create: `components/segments/SegmentTraceMap.tsx`

- [ ] **Step 1 : Composant SegmentTraceMap**

`components/segments/SegmentTraceMap.tsx` :
```tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, Source, Layer, NavigationControl } from 'react-map-gl'
import type { ActivityKind } from '@/lib/segments/types'
import { ACTIVITY_COLORS } from '@/lib/segments/types'

interface Props {
  geom: GeoJSON.LineString
  activity: ActivityKind
  liveTrace?: GeoJSON.LineString | null
}

function bboxOf(geom: GeoJSON.LineString) {
  let minLng = 180,
    minLat = 90,
    maxLng = -180,
    maxLat = -90
  for (const [lng, lat] of geom.coordinates) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }
  return { minLng, minLat, maxLng, maxLat }
}

export function SegmentTraceMap({ geom, activity, liveTrace }: Props) {
  const b = bboxOf(geom)
  const cx = (b.minLng + b.maxLng) / 2
  const cy = (b.minLat + b.maxLat) / 2
  const color = ACTIVITY_COLORS[activity]

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: cy, longitude: cx, zoom: 14 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      <Source id="seg" type="geojson" data={{ type: 'Feature', geometry: geom, properties: {} }}>
        <Layer
          id="seg-line"
          type="line"
          paint={{ 'line-color': color, 'line-width': 5, 'line-opacity': 0.85 }}
        />
      </Source>
      {liveTrace && liveTrace.coordinates.length >= 2 && (
        <Source id="live" type="geojson" data={{ type: 'Feature', geometry: liveTrace, properties: {} }}>
          <Layer
            id="live-line"
            type="line"
            paint={{ 'line-color': '#1C1A17', 'line-width': 4, 'line-dasharray': [2, 1] }}
          />
        </Source>
      )}
    </Map>
  )
}
```

- [ ] **Step 2 : Page server**

`app/segments/[id]/page.tsx` :
```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { listLeaderboard } from '@/lib/segments/queries'
import { SegmentTraceMap } from '@/components/segments/SegmentTraceMap'
import { LeaderboardList } from '@/components/segments/LeaderboardList'
import { ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/lib/segments/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SegmentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: seg } = await supabase
    .from('segments_public')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!seg) notFound()

  const leaderboard = await listLeaderboard(id, 20)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="pb-24">
      <div className="h-[300px] relative">
        <SegmentTraceMap geom={seg.geom_geojson} activity={seg.activity} />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: ACTIVITY_COLORS[seg.activity] }}
          />
          <span className="text-xs uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
            {ACTIVITY_LABELS[seg.activity]}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{seg.name}</h1>
        <div className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
          {(seg.distance_m / 1000).toFixed(2)} km
        </div>

        {user && (
          <Link
            href={`/segments/${seg.id}/run`}
            className="block w-full text-center py-4 mt-6 rounded-2xl bg-ink text-paper font-semibold"
          >
            Lancer ce segment
          </Link>
        )}
        {!user && (
          <Link
            href="/auth/welcome"
            className="block w-full text-center py-4 mt-6 rounded-2xl border border-hairline dark:border-hairline-dark"
          >
            Se connecter pour courir
          </Link>
        )}
      </div>

      <div className="mt-4">
        <h2 className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
          Leaderboard
        </h2>
        <LeaderboardList entries={leaderboard} currentUserId={user?.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Test manuel**

Démarrer dev server, ouvrir `/segments/<id-d-un-segment-créé-en-task-18>`. Vérifier carte avec polyline + leaderboard avec 1 entrée (le créateur).

- [ ] **Step 4 : Commit**

```bash
git add app/segments/[id]/page.tsx components/segments/SegmentTraceMap.tsx
git commit -m "feat(segments): page detail segment avec trace + leaderboard"
```

---

## Task 20 : Page `app/segments/[id]/run/page.tsx` (écran live de course)

**Files:**
- Create: `app/segments/[id]/run/page.tsx`
- Create: `app/segments/[id]/run/run-client.tsx`

- [ ] **Step 1 : Page server**

`app/segments/[id]/run/page.tsx` :
```tsx
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RunClient } from './run-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RunSegmentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/welcome')

  const { data: seg } = await supabase
    .from('segments_public')
    .select('id, name, activity, geom_geojson, end_lat, end_lng')
    .eq('id', id)
    .maybeSingle()
  if (!seg) notFound()

  return <RunClient segment={seg} />
}
```

- [ ] **Step 2 : Client component**

`app/segments/[id]/run/run-client.tsx` :
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useGeolocationTracker } from '@/lib/segments/useGeolocationTracker'
import { useWakeLock } from '@/lib/segments/useWakeLock'
import { CountdownGo } from '@/components/segments/CountdownGo'
import { RunHUD } from '@/components/segments/RunHUD'
import { submitRun } from '@/lib/segments/actions'
import { haversineMeters, pointsToLineString } from '@/lib/segments/geo'
import type { ActivityKind } from '@/lib/segments/types'

type Step = 'intro' | 'countdown' | 'tracking' | 'submitting' | 'done'

interface Segment {
  id: string
  name: string
  activity: ActivityKind
  geom_geojson: GeoJSON.LineString
  end_lat: number
  end_lng: number
}

export function RunClient({ segment }: { segment: Segment }) {
  const router = useRouter()
  const tracker = useGeolocationTracker()
  const [step, setStep] = useState<Step>('intro')
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [result, setResult] = useState<{ is_valid: boolean; invalid_reason: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useWakeLock(step === 'tracking')

  const onGo = () => {
    setStartedAt(new Date().toISOString())
    tracker.start()
    setStep('tracking')
  }

  // Détection auto fin : dernier point à < 20m du end_point
  useEffect(() => {
    if (step !== 'tracking') return
    const last = tracker.points[tracker.points.length - 1]
    if (!last) return
    const d = haversineMeters(last.lat, last.lng, segment.end_lat, segment.end_lng)
    if (d < 20) {
      tracker.stop()
      setStep('submitting')
    }
  }, [tracker.points, step, segment.end_lat, segment.end_lng, tracker])

  const onManualStop = () => {
    tracker.stop()
    setStep('submitting')
  }

  // Soumission auto quand on entre en 'submitting'
  useEffect(() => {
    if (step !== 'submitting' || !startedAt) return
    if (tracker.points.length < 2) {
      setError('Trace trop courte')
      setStep('done')
      return
    }
    ;(async () => {
      try {
        const r = await submitRun({
          segmentId: segment.id,
          points: tracker.points,
          durationMs: tracker.stats.durationMs,
          startedAt,
        })
        setResult({ is_valid: r.is_valid, invalid_reason: r.invalid_reason })
        setStep('done')
      } catch (e: any) {
        setError(e.message ?? 'Erreur')
        setStep('done')
      }
    })()
  }, [step, startedAt, tracker.points, tracker.stats.durationMs, segment.id])

  if (step === 'intro') {
    return (
      <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{segment.name}</h1>
        <p className="text-ink-muted dark:text-ink-muted-dark">
          Va au point de départ du segment. Quand tu es prêt, tape "Démarrer". Le chrono s'arrête automatiquement à l'arrivée.
        </p>
        <button
          type="button"
          onClick={() => setStep('countdown')}
          className="py-4 rounded-2xl bg-ink text-paper font-semibold"
        >
          Démarrer
        </button>
      </div>
    )
  }

  if (step === 'countdown') return <CountdownGo onGo={onGo} />

  if (step === 'tracking') {
    return (
      <RunHUD
        startedAt={Date.parse(startedAt!)}
        currentSpeedKmh={tracker.currentSpeedKmh}
        distanceM={tracker.stats.distanceM}
        accuracyM={tracker.currentAccuracyM}
        onStop={onManualStop}
      />
    )
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p>Validation du run…</p>
      </div>
    )
  }

  // done
  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {result?.is_valid ? 'Run validé !' : 'Run non comptabilisé'}
      </h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Durée</div>
          <div className="text-xl font-semibold tabular-nums">
            {Math.floor(tracker.stats.durationMs / 1000)}s
          </div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Distance</div>
          <div className="text-xl font-semibold tabular-nums">{tracker.stats.distanceM}m</div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Vit. moy</div>
          <div className="text-xl font-semibold tabular-nums">
            {tracker.stats.speedAvgKmh.toFixed(1)}
          </div>
        </div>
      </div>

      {result?.invalid_reason && (
        <p className="text-sm text-red-500">Raison : {result.invalid_reason}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => router.push(`/segments/${segment.id}`)}
        className="py-4 rounded-2xl bg-ink text-paper font-semibold"
      >
        Voir le leaderboard
      </button>
    </div>
  )
}
```

- [ ] **Step 3 : Test E2E manuel**

1. Créer un segment court via `/segments/new/live` (mock GPS Chrome).
2. Sur la page du segment, cliquer "Lancer ce segment".
3. Mock GPS sur même trajet → vérifier que le run est validé.
4. Mock GPS sur trajet aberrant → vérifier `invalid_reason = OUT_OF_TRACK`.

- [ ] **Step 4 : Commit**

```bash
git add app/segments/[id]/run/page.tsx app/segments/[id]/run/run-client.tsx
git commit -m "feat(segments): ecran live run avec auto-stop a l'arrivee + soumission"
```

---

## Task 21 : Lien depuis la home `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1 : Lire le fichier actuel**

```bash
# (utiliser l'outil Read sur app/page.tsx)
```

- [ ] **Step 2 : Ajouter une card "Segments" à côté des autres modules**

Insérer un bloc Link similaire aux autres modules de la home, conditionné par `process.env.NEXT_PUBLIC_SEGMENTS_ENABLED === 'true'` côté client (ou systématiquement, le layout segments protège déjà l'accès). Exemple :

```tsx
{process.env.NEXT_PUBLIC_SEGMENTS_ENABLED === 'true' && (
  <Link
    href="/segments"
    className="block rounded-2xl bg-accent text-paper p-5"
  >
    <div className="text-xs uppercase tracking-wider opacity-80">Nouveau</div>
    <div className="text-xl font-bold mt-1">Segments GPS</div>
    <div className="text-sm opacity-90 mt-1">
      Crée et bats des records sur des parcours.
    </div>
  </Link>
)}
```

(Adapter au style exact des autres cards de la home — Florian choisit l'emplacement final.)

- [ ] **Step 3 : Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): lien vers /segments derriere feature flag"
```

---

## Task 22 : Verification finale + smoke test

- [ ] **Step 1 : Lint + typecheck**

```bash
npm run lint
npx tsc --noEmit
npm test
```
Expected : zéro erreur, tests passent.

- [ ] **Step 2 : Build production**

```bash
npm run build
```
Expected : build OK, aucune erreur Turbopack.

- [ ] **Step 3 : Smoke test E2E mobile**

Sur un téléphone réel (Android Chrome ou iOS Safari) :
1. Ouvrir l'URL Vercel preview.
2. Login.
3. `/segments` s'affiche, carte OK.
4. `/segments/new/live` → marcher 100m → "Stop" → nommer → créer.
5. Sur la page du segment, leaderboard montre 1 run.
6. `/segments/<id>/run` → refaire le parcours → leaderboard montre 2 runs, classement OK.

- [ ] **Step 4 : Mettre à jour la mémoire**

Ajouter une entrée dans `MEMORY.md` :
```
- [Phase 1 GPS Leaderboard livrée](project_segments_phase1_done.md) — module /segments en stealth derrière NEXT_PUBLIC_SEGMENTS_ENABLED, PostGIS activé, 22 tasks
```

Et écrire `project_segments_phase1_done.md` documentant les phases 2-5 restantes.

- [ ] **Step 5 : Commit final**

```bash
git add docs/superpowers/notes/* .claude/projects/.../memory/* 2>/dev/null || true
git commit -m "chore(segments): phase 1 livree — boucle creer/courir/leaderboard complete"
```

---

## Self-Review

Spec coverage check :
- ✅ Modèle data segments + runs + activity_rules (Task 1)
- ✅ RPC submit_run + create_segment_from_run avec validation (Task 2)
- ✅ Mode 1er run live (Tasks 18)
- ⏭️ Mode tracé sur carte (Phase 5)
- ✅ Page segment + leaderboard (Task 19)
- ✅ Écran live run + chrono + détection fin auto (Task 20)
- ✅ Pré-validation client (computeRunStats Task 5 ; intégration partielle — la pré-validation Hausdorff live est repoussée Phase 4 car liée au ghost)
- ✅ Wake Lock (Task 6)
- ⏭️ Ghost run (Phase 4)
- ⏭️ Offline (Phase 3)
- ✅ Feature flag (Task 16)
- ✅ Navigation depuis la home (Task 21)

Placeholders check : aucun "TBD" / "TODO" trouvé. Le step 1 de Task 21 dit "(utiliser l'outil Read)" — c'est une instruction d'outil agentique, pas un placeholder de plan.

Type consistency check : `SegmentPublic` introduit en Task 12 utilisé partout après. `TracePoint`, `RunStats`, `ActivityKind` cohérents Task 4 → 22. RPC names `create_segment_from_run` et `submit_run` identiques côté SQL (Task 2) et TS (Task 9).
