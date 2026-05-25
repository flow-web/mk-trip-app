# GPS Leaderboard — Design

**Date :** 2026-05-22
**Auteur :** Florian (brainstorm avec Claude)
**Status :** Validé pour planification

## Résumé

Module global de tracking GPS et de leaderboards sur des segments A→B publics. Inspiration : Strava (segments persistants, leaderboards) + Forza (course directe entre amis). Le module est greffé sur le projet MK Trip existant mais vit hors du modèle "voyage" : les segments sont publics et globaux, accessibles à tous les utilisateurs authentifiés via une route racine `/segments`.

## Objectifs

- Permettre à un utilisateur de **créer** un segment géographique typé par activité (skate, run, vélo, voiture, marche).
- Permettre à n'importe quel utilisateur authentifié de **courir** un segment existant et d'enregistrer un run chronométré.
- Afficher un **leaderboard global** par segment, classé par durée (record en haut).
- Donner une **boucle motivante complète** : créer → refaire → comparer → partager.

## Non-objectifs (explicitement hors scope)

- Segments scopés au voyage (la précédente itération du projet a un module `trips` ; les segments en sont indépendants).
- Modération automatique avancée (signalements user-vs-user, ban).
- Capteurs externes (cardio-fréquencemètre, cadence vélo).
- Intégration tierce (Strava import/export).
- Background geolocation natif (impossible en PWA, contrainte assumée).
- Détection auto de segments depuis traces libres (V2+).
- Tracking de l'altitude / dénivelé (V2 — précision GPS PWA trop variable).

## Avertissement de scope

Le brainstorm a sélectionné 7 features (cœur + offline + ghost + anti-triche). C'est environ **6–8 semaines de boulot**. Le spec couvre l'ensemble pour vision long terme, mais l'implémentation **doit être découpée en phases** dans le plan associé. Découpage proposé :

1. **Phase 1 — Core boucle** (1–2 sem) : enregistrement run live, création par 1er run, page segment, leaderboard simple.
2. **Phase 2 — Anti-triche basique** (3–4 j) : validation RPC, à faire avant ouverture publique.
3. **Phase 3 — Offline** (1 sem) : IndexedDB + sync.
4. **Phase 4 — Ghost run live** (3–4 j) : preload + render record.
5. **Phase 5 — Éditeur carte** (3–5 j) : création segment théorique tracée.

## Décisions de conception

| # | Décision | Choix |
|---|---|---|
| 1 | Modèle segment | Segment fixe persistant + run libre (les deux) |
| 2 | Portée segment | Global et public (pas scopé au voyage) |
| 3 | Leaderboard | Global (tous les users MK Trip) |
| 4 | Activité | Segment typé (1 segment = 1 activité = 1 leaderboard) |
| 5 | Géométrie segment | Deux modes : 1er run en live **et** traçage carte |
| 6 | Carte | Mapbox GL JS |
| 7 | Navigation | Section globale dédiée `/segments` |
| 8 | Stockage géo | PostGIS sur Supabase |
| 9 | Validation | RPC Postgres (pas Edge Function) |
| 10 | Run à l'envers | Rejeté MVP ; créer un segment retour distinct |

## Architecture

### Stack ajoutée

- Extension Postgres : **PostGIS** (activation via `create extension postgis;` en migration).
- Frontend : **Mapbox GL JS** (token côté client, restriction de domaine via console Mapbox).
- Géo client : **turf.js** pour pré-validation Hausdorff temps réel pendant le run.
- Offline : **Dexie.js** (~30 KB) en wrapper IndexedDB.
- API runtime carte : **Wake Lock API** (`navigator.wakeLock.request('screen')`) pendant un run pour éviter la suspension écran.

### Modèle de données

```sql
-- Activation extension
create extension if not exists postgis;

-- Enum activités supportées
create type activity_kind as enum ('skate','run','bike','car','walk','other');

-- Segment public, typé par activité
create table segments (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references profiles(id) on delete set null,
  name          text not null,
  description   text,
  activity      activity_kind not null,
  geom          geometry(LineString, 4326) not null,
  start_point   geography(Point, 4326) generated always as
                (geography(ST_StartPoint(geom))) stored,
  end_point     geography(Point, 4326) generated always as
                (geography(ST_EndPoint(geom))) stored,
  distance_m    integer not null,           -- ST_Length pré-calculé
  cover_color   text default '#FF6B4A',
  created_at    timestamptz default now()
);
create index idx_segments_geom on segments using gist (geom);
create index idx_segments_activity on segments (activity);

-- Run : tentative d'un utilisateur sur un segment
create table runs (
  id              uuid primary key default gen_random_uuid(),
  segment_id      uuid not null references segments(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  trace           geometry(LineString, 4326) not null,
  duration_ms     integer not null,
  distance_m      integer not null,
  speed_avg_kmh   numeric(5,2),
  speed_max_kmh   numeric(5,2),
  started_at      timestamptz not null,
  is_valid        boolean default true,
  invalid_reason  text,
  created_at      timestamptz default now()
);
create index idx_runs_segment_user on runs (segment_id, user_id, duration_ms);

-- Règles d'activité éditables (tolérance Hausdorff, vitesse max)
create table activity_rules (
  activity            activity_kind primary key,
  hausdorff_tol_m     integer not null,
  max_speed_kmh       integer not null,
  min_duration_ms     integer not null default 5000,
  distance_ratio_min  numeric(3,2) not null default 0.80,
  distance_ratio_max  numeric(3,2) not null default 1.50
);
insert into activity_rules values
  ('walk',  25, 12,  5000, 0.80, 1.50),
  ('run',   25, 30,  5000, 0.80, 1.50),
  ('skate', 25, 50,  5000, 0.80, 1.50),
  ('bike',  30, 80,  5000, 0.80, 1.50),
  ('car',   40, 250, 5000, 0.80, 1.50),
  ('other', 30, 100, 5000, 0.80, 1.50);
```

**RLS :**

```sql
alter table segments      enable row level security;
alter table runs          enable row level security;
alter table activity_rules enable row level security;

-- Segments : lecture publique, write par créateur
create policy "segments_select_all" on segments for select using (true);
create policy "segments_insert_auth" on segments for insert
  with check (auth.uid() = creator_id);
create policy "segments_update_creator" on segments for update
  using (auth.uid() = creator_id);
create policy "segments_delete_creator" on segments for delete
  using (auth.uid() = creator_id);

-- Runs : lecture publique (leaderboard), write par owner
create policy "runs_select_all" on runs for select using (true);
create policy "runs_insert_self" on runs for insert
  with check (auth.uid() = user_id);
create policy "runs_update_self" on runs for update
  using (auth.uid() = user_id);
create policy "runs_delete_self" on runs for delete
  using (auth.uid() = user_id);

-- activity_rules : lecture publique, write admin only (pas de policy insert/update)
create policy "rules_select_all" on activity_rules for select using (true);
```

**RPC principales (sécurisées server-side) :**

```sql
-- Soumet un run : valide la trace, calcule stats, insère.
-- Retourne le run inséré avec is_valid + invalid_reason.
create function submit_run(
  p_segment_id  uuid,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz
) returns runs security definer ...

-- Crée un segment depuis un premier run.
-- Insère segment + run en transaction.
create function create_segment_from_run(
  p_name        text,
  p_description text,
  p_activity    activity_kind,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz,
  p_cover_color text default '#FF6B4A'
) returns segments security definer ...
```

### Découpage frontend

Routes (Next.js App Router) :

```
app/segments/
├─ page.tsx                  # Liste + carte mondiale (Flow A)
├─ layout.tsx                # Provider Mapbox + nav segments
├─ [id]/
│   ├─ page.tsx              # Détail segment + leaderboard (Flow B)
│   └─ run/page.tsx          # Écran live run (Flow D) — client-only
└─ new/
    ├─ live/page.tsx         # Création par 1er run (Flow C1)
    └─ draw/page.tsx         # Création tracée carte (Flow C2, V2)
```

Composants (`components/segments/`) :

- `<SegmentMap />` — Mapbox GL, props `segments[]`, `selected?`, `onSelect`.
- `<SegmentTraceMap />` — focalisé sur un segment + trace live + ghost.
- `<LeaderboardList />` — liste paginée des runs d'un segment.
- `<ActivityChips />` — filtre activité.
- `<RunStatsCard />` — affichage stats compact.
- `<RunHUD />` — overlay plein écran pendant un run (chrono, distance, vitesse, mini-map).
- `<CountdownGo />` — écran 3-2-1.

Hooks (`lib/segments/`) :

- `useGeolocationTracker()` — `watchPosition`, buffer points, expose `{ points, distance, speed, isTracking, start, stop, reset }`. Indépendant du domaine "segment".
- `useRunRecorder(segmentId)` — utilise `useGeolocationTracker` + détecte fin auto (proximité end_point) + calcule stats finales.
- `useSegmentMatcher(segment, trace)` — turf.js Hausdorff distance pour feedback live "tu sors du trajet".

Data layer :

- `lib/segments/queries.ts` — lectures Supabase (`listSegmentsInBounds`, `getSegment`, `listLeaderboard`).
- `lib/segments/actions.ts` — Server Actions Next.js pour mutations (`createSegmentFromRun`, `submitRun`).

## Parcours utilisateur

### Flow A — Découvrir (`/segments`)

Carte Mapbox plein écran avec pins (couleur par activité). Drawer en bas avec liste des segments dans la viewport, triée par popularité (nb runs). Chips de filtre activité en haut. Tap → `/segments/[id]`.

### Flow B — Page segment (`/segments/[id]`)

Hero avec carte + polyline + nom + activité + distance + créateur. Section leaderboard (top 20 runs). CTA principal "Lancer ce segment" → écran live. Si user = créateur : boutons "Modifier" et "Supprimer". URL publique partageable, lecture sans authentification, course nécessite login.

### Flow C — Créer un segment

**C1 — Par 1er run** (`/segments/new/live`) : écran "Tap pour démarrer" → tracking GPS → "Tap pour terminer" → écran récap (nom, activité, couleur) → insert via `create_segment_from_run`.

**C2 — Par traçage carte** (`/segments/new/draw`, V2) : outil "click pour ajouter point" sur Mapbox, undo, terminer → choix activité + nom → insert segment sans run associé.

### Flow D — Courir (`/segments/[id]/run`)

1. Compte à rebours "3-2-1 Go" (`<CountdownGo />`).
2. Pendant le run (`<RunHUD />`) : chrono live, distance parcourue, vitesse instantanée, mini-map (trace live + polyline segment ; ghost record en Phase 4).
3. Fin auto quand passage à <20m du `end_point`. Bouton "Stop" manuel disponible.
4. Pré-validation client live : `useSegmentMatcher` calcule la distance à la polyline ; au-delà du seuil pendant > 3 s, HUD vire au rouge "Hors trajet". L'utilisateur peut corriger sans perdre le run.
5. Soumission via RPC `submit_run` → écran récap (durée, distance, vitesses, position leaderboard, comparaison record).
6. Si trace invalide : run conservé localement, modal "Trace invalide, soumettre quand même ?".

### Flow E — Profil (`/me/runs`, V2)

Liste des runs personnels avec lien vers chaque segment.

### Navigation globale

Nouvel onglet "Segments" dans la bottom nav PWA, à côté des onglets `trips`, `map`, etc.

## Validation et anti-triche

Le RPC `submit_run` calcule tout côté serveur, transactionnel avec l'insert. Un run est marqué `is_valid=false` (avec `invalid_reason`) si l'un de ces checks échoue :

| Check | Règle |
|---|---|
| Suit le segment | `ST_HausdorffDistance(trace, segment.geom) < hausdorff_tol_m` (table `activity_rules`) |
| Distance plausible | `ST_Length(trace)` entre `distance_ratio_min` et `distance_ratio_max` × `segment.distance_m` |
| Vitesse max | dérivée de la trace ≤ `max_speed_kmh` |
| Pas de teleport | saut entre deux points consécutifs ≤ `max_speed_kmh × Δt × 1.5` (filtre signal GPS qui décroche puis revient ; seuil dynamique pour rester valide à 250 km/h en mode car comme à 5 km/h en walk) |
| Durée minimale | `duration_ms > min_duration_ms` |
| Direction | trace passe près de `start_point` au début **et** `end_point` à la fin |

Les runs invalides restent stockés (audit), exclus du leaderboard via `WHERE is_valid=true` dans `listLeaderboard`.

**V2 anti-triche** (hors MVP) : détection patterns suspects (3 records consécutifs à -20 % = flag), signalement user, vitesse moyenne cohérente avec activité déclarée. Aucune refonte de schéma requise.

## Mode offline

Architecture en 3 couches :

1. **Buffer mémoire** pendant le run (`useGeolocationTracker`). Si l'onglet se ferme par accident, le run en cours est perdu (limite assumée — pas de persistance per-point).
2. **IndexedDB pour runs terminés** : si soumission Supabase échoue (offline), le run est stocké via Dexie avec `pending_sync`. Queue gérée par le service worker existant (`app/sw.ts`).
3. **Sync automatique** : event `online` + polling déclenche la queue. Chaque run pending → `submit_run` → suppression IDB si OK.

Schéma Dexie :

```ts
db.pendingRuns:     { id, segmentId, trace, duration_ms, started_at, attempts }
db.pendingSegments: { id, name, activity, geom, firstRun }
db.cachedSegments:  { id, geom, name, activity, lastFetched }
```

**Limites offline assumées :**

- Pas d'affichage du leaderboard global offline (lecture seule cache de ce qui a été vu).
- Pour courir un segment offline, il faut l'avoir ouvert au moins une fois (cache via Service Worker).
- Création de segment par 1er run offline OK (segment + run insérés en transaction au retour).

## Gestion des permissions et de la batterie

- Refus de permission GPS → écran d'aide avec instructions par navigateur (iOS Safari, Android Chrome, desktop), CTA "Réessayer". Pas de fallback faux-GPS.
- `watchPosition({ enableHighAccuracy: true, maximumAge: 0, timeout: 5000 })`. Conso batterie élevée acceptée pendant un run (< 30 min typique).
- Wake Lock API au démarrage du run pour empêcher l'écran de s'éteindre.
- Message au démarrage : "Ne change pas d'app pendant le run" — la suspension PWA en arrière-plan interrompt le tracking.

## Tests

- **Unit (Vitest)** : `useGeolocationTracker` (mock `navigator.geolocation`), calculs stats, pré-validation Hausdorff client.
- **Intégration RPC (pgTAP ou Vitest contre Supabase local)** : `submit_run` avec fixtures de traces (valide, hors trajet, teleport, à l'envers, vitesse aberrante).
- **E2E manuel** sur téléphone réel pour les flows GPS — pas d'E2E automatisé (coût/valeur faible).

## Rollout

- Feature flag `segments_enabled` (env var Vercel) pour MVP → ship en stealth, activable pour Florian d'abord.
- Migration PostGIS séparée des migrations table (à appliquer en premier).
- Pas de breaking change sur le schéma existant : ajout uniquement, pas de modification des tables `trips`, `spots`, etc.
- Restriction du token Mapbox par domaine en production.

## Risques

| Risque | Mitigation |
|---|---|
| Précision GPS PWA variable iOS Safari | Tolérance Hausdorff généreuse (25 m par défaut), affichage de la précision GPS dans HUD |
| Pas de background geolocation en PWA | Wake Lock + message UX explicite au démarrage |
| Token Mapbox exposé client | Restriction de domaine dans la console Mapbox |
| Scope global → fraude leaderboard | RPC `submit_run` server-side, anti-triche V2 si besoin |
| Coût Mapbox au-delà de 50k loads/mois | Surveillance ; fallback MapLibre + tiles OpenFreeMap possible sans refonte (même API) |

## Liens

- Schéma existant : `supabase/migrations/20260520000000_initial.sql`
- Service worker : `app/sw.ts`
- Page map existante : `app/trips/[tripId]/map/page.tsx`
- Memory roadmap : `project_roadmap_wanderlog_features.md`
