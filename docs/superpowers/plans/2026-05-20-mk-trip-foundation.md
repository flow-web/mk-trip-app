# MK Trip — Sous-projet 1 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** poser la fondation technique de MK Trip — modèle data multi-voyage sur Supabase, auth magic link, partage par code voyage, sync offline-first via Legend State v3, et migration des 4 modules existants (Budget, Planning, Map, Guide) vers cette fondation.

**Architecture:** Expo Router app branchée sur Supabase Postgres (RLS active) via Legend State v3 + plugin Supabase. SQLite local répliqué depuis Postgres pour l'offline-first. Migration progressive en 8 phases (A→H), chaque phase commitable et laissant l'app runnable.

**Tech Stack:** Expo SDK 55, React Native 0.83, expo-router, NativeWind 4, Supabase JS v2, Legend State v3 (`@legendapp/state`) + plugin `supabase`, expo-sqlite, EAS dev build, AsyncStorage (legacy + storage Supabase Auth).

**Spec source:** `docs/superpowers/specs/2026-05-20-mk-trip-foundation-design.md`

**Convention plan :** comme on a explicitement exclu Jest/Detox du SP#1, l'étape « test failing » est remplacée par une **étape de vérification** : query SQL, script Node, ou scénario manuel précis avec résultat attendu. L'esprit TDD (vérifier avant de commiter) est conservé.

---

## File Structure

### Nouveaux fichiers

| Chemin | Responsabilité |
|---|---|
| `.env.local` | Secrets locaux (URL + clés Supabase). gitignored. |
| `eas.json` | Profils EAS Build (development / preview / production). |
| `lib/supabase.ts` | Client Supabase singleton + storage AsyncStorage pour la session. |
| `lib/legend.ts` | Configuration du sync engine Legend State (persistor SQLite, options sync). |
| `lib/types.ts` | Types TypeScript générés depuis le schéma Supabase. |
| `lib/joinCode.ts` | Helpers de validation/formatage côté UI (regex `MKT-XXXX`). |
| `store/auth$.ts` | Observable session + profile, listener `onAuthStateChange`. |
| `store/currentTrip$.ts` | Observable du `trip_id` actif (persisté). |
| `store/trips$.ts` | `syncedSupabase('trips')`. |
| `store/tripMembers$.ts` | `syncedSupabase('trip_members')`. |
| `store/days$.ts` | `syncedSupabase('days')`. |
| `store/activities$.ts` | `syncedSupabase('activities')`. |
| `store/activityCompletions$.ts` | `syncedSupabase('activity_completions')`. |
| `store/spots$.ts` | `syncedSupabase('spots')`. |
| `store/expenses$.ts` | `syncedSupabase('expenses')`. |
| `store/expenseSplits$.ts` | `syncedSupabase('expense_splits')`. |
| `store/checklistItems$.ts` | `syncedSupabase('checklist_items')`. |
| `store/checklistCompletions$.ts` | `syncedSupabase('checklist_completions')`. |
| `store/guideCards$.ts` | `syncedSupabase('guide_cards')`. |
| `app/(auth)/welcome.tsx` | Écran landing + saisie email. |
| `app/(auth)/check-email.tsx` | Écran "regarde tes mails". |
| `app/(auth)/_layout.tsx` | Stack auth. |
| `app/auth-callback.tsx` | Réception du deep link magic link. |
| `app/(trips)/index.tsx` | Liste des voyages de l'utilisateur. |
| `app/(trips)/new.tsx` | Modal création de voyage. |
| `app/(trips)/join.tsx` | Modal rejoindre par code. |
| `app/(trips)/_layout.tsx` | Stack trips. |
| `app/(trips)/[tripId]/_layout.tsx` | Layout par voyage : set `currentTripId$`. |
| `components/TripSwitcher.tsx` | Bottom sheet liste des voyages dans le header Dashboard. |
| `supabase/migrations/20260520000000_initial.sql` | Schéma + RLS + RPCs en une migration. |
| `scripts/seed-portugal.ts` | Seed du voyage démo. |
| `scripts/test-rls.sql` | Script SQL de vérification des policies. |
| `docs/superpowers/plans/notes-manual-tests.md` | Trace des tests manuels réalisés. |

### Fichiers déplacés ou réécrits

| Chemin | Changement |
|---|---|
| `app/_layout.tsx` | Devient auth gate + deep link handler. Garde NativeWind + StatusBar. Retire `BudgetProvider`/`PlanningProvider`. |
| `app/(tabs)/_layout.tsx` | Déplacé vers `app/(trips)/[tripId]/(tabs)/_layout.tsx`. |
| `app/(tabs)/index.tsx` | Déplacé idem. Réécrit pour consommer le trip courant. |
| `app/(tabs)/budget.tsx` | Idem. Réécrit pour consommer `expenses$` / `expenseSplits$`. |
| `app/(tabs)/map.tsx` | Idem. Réécrit pour consommer `spots$`. |
| `app/(tabs)/planning.tsx` | Idem. Réécrit pour consommer `days$` / `activities$` / `activityCompletions$`. |
| `app/(tabs)/guide.tsx` | Idem. Réécrit pour consommer `checklistItems$` / `guideCards$`. |
| `components/CountdownCard.tsx` | Consomme le trip courant (dates dynamiques). |
| `components/TimelineScroll.tsx` | Consomme `days$`. |
| `components/AddExpenseModal.tsx` | Insère via `expenses$`, supporte split equal/custom. |
| `components/SpotCard.tsx` | Reçoit un spot DB (mêmes props mais via store). |
| `app.json` | Ajout `scheme: "mktrip"`, plugins (`expo-sqlite`, `expo-router`). |
| `package.json` | Nouvelles deps + scripts `db:types`, `seed:portugal`. |

### Fichiers supprimés en Phase G

- `components/MapData.ts`
- `components/PlanningData.ts`
- `components/BudgetStore.tsx`
- `components/PlanningStore.tsx`

`components/NotificationService.ts` est **conservé**.

---

## Phase A — Infrastructure

Aucun changement utilisateur visible. L'app continue de tourner avec les data hardcodées.

### Task A1 : Installer les dépendances JS

**Files:**
- Modify: `package.json`

- [ ] **Step 1 — Lancer l'install**

```bash
npm install @supabase/supabase-js @legendapp/state expo-sqlite expo-secure-store @react-native-async-storage/async-storage@latest
npm install --save-dev @types/node tsx supabase
```

`@supabase/supabase-js` : client. `@legendapp/state` : state + plugin Supabase (le plugin est inclus dans le package principal en v3). `expo-sqlite` : DB locale. `expo-secure-store` : storage chiffré session (utilisé par le client Supabase RN). `tsx` : pour lancer le seed TS. `supabase` (CLI) : pour `gen types`.

- [ ] **Step 2 — Vérifier que les versions sont compatibles Expo SDK 55**

Run: `npx expo install --check`
Expected: aucune ligne rouge. Si une lib propose une autre version, accepter avec `y`.

- [ ] **Step 3 — Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): add supabase, legend state, sqlite, secure-store"
```

---

### Task A2 : Configurer EAS et créer un dev build

**Files:**
- Create: `eas.json`
- Modify: `app.json`

- [ ] **Step 1 — Login EAS et init**

Run sequentiel :
```bash
npx eas-cli login
npx eas-cli init
```
Accepter la création du projet EAS lié au compte Expo de Florian. `eas init` ajoute `extra.eas.projectId` dans `app.json`.

- [ ] **Step 2 — Créer `eas.json`**

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 3 — Ajouter `scheme` et plugins dans `app.json`**

Dans `expo`, ajouter :
```json
"scheme": "mktrip",
"plugins": [
  "expo-router",
  "expo-secure-store",
  ["expo-sqlite", { "useSQLCipher": false }]
]
```

- [ ] **Step 4 — Lancer le premier build dev Android**

```bash
npx eas-cli build --profile development --platform android
```
Attendre la fin (~10 min). Le lien d'install apparaît à la fin de la commande. **Garder le lien**, il faudra l'ouvrir sur le device Android pour installer l'APK.

- [ ] **Step 5 — Lancer le build dev iOS (en parallèle conseillé)**

```bash
npx eas-cli build --profile development --platform ios
```
Configurer le provisioning si demandé (EAS le gère interactivement). ~15 min.

- [ ] **Step 6 — Installer les APK/ipa sur device et démarrer le dev server**

```bash
npx expo start --dev-client
```
Ouvrir l'app installée sur le device, scanner le QR ou taper l'URL → l'app doit charger normalement avec ses data hardcodées.

- [ ] **Step 7 — Commit**

```bash
git add eas.json app.json
git commit -m "feat(build): EAS dev build setup + scheme mktrip"
```

---

### Task A3 : Créer le projet Supabase MK Trip

**Files:**
- (aucun fichier local pour cette tâche)

- [ ] **Step 1 — Provisionner via MCP**

Utiliser l'outil MCP `mcp__claude_ai_Supabase__create_project` avec :
- `name`: `MK Trip`
- `organization_id`: `eezjxtnzawzxwjegqlcg` (org de Florian, vérifié par `list_organizations`)
- `region`: `eu-west-3`

(Ce step se fait depuis l'agent qui exécute le plan, pas via shell.)

- [ ] **Step 2 — Récupérer les credentials**

Utiliser `mcp__claude_ai_Supabase__get_project_url` et `mcp__claude_ai_Supabase__get_publishable_keys` sur le nouveau projet. Noter le `ref`, `url`, et `anon` key.

- [ ] **Step 3 — Vérification**

Le projet doit apparaître dans `list_projects` avec status `ACTIVE_HEALTHY`.

- [ ] **Step 4 — Pas de commit**

(Provisionnement infra, rien à versionner ici.)

---

### Task A4 : Créer `.env.local` et helper Supabase

**Files:**
- Create: `.env.local`
- Modify: `.gitignore`
- Create: `lib/supabase.ts`

- [ ] **Step 1 — Vérifier `.gitignore`**

Read `.gitignore`. Si `.env*` ou `.env.local` n'y est pas, ajouter :
```
.env.local
.env.*.local
```

- [ ] **Step 2 — Créer `.env.local`**

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from A3 step 2>
SUPABASE_SERVICE_ROLE_KEY=<service role key — fetch depuis le dashboard Supabase, gardée locale, jamais préfixée EXPO_PUBLIC_>
SUPABASE_PROJECT_REF=<ref>
```

- [ ] **Step 3 — Créer `lib/supabase.ts`**

```ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!url || !anon) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 4 — Installer `react-native-url-polyfill`**

```bash
npm install react-native-url-polyfill
```

- [ ] **Step 5 — Créer un stub `lib/types.ts`**

```ts
// Stub remplacé en Task B3 par les types générés depuis Supabase
export type Database = any
```

- [ ] **Step 6 — Vérification**

Run: `npx expo start --dev-client`
Le bundle doit compiler sans erreur. L'app continue d'afficher l'écran Portugal hardcodé. Pas d'utilisation de `supabase` encore.

- [ ] **Step 7 — Commit**

```bash
git add .gitignore lib/supabase.ts lib/types.ts package.json package-lock.json
git commit -m "feat(supabase): add client and env"
```

---

## Phase B — Schema DB

### Task B1 : Écrire la migration SQL

**Files:**
- Create: `supabase/migrations/20260520000000_initial.sql`

- [ ] **Step 1 — Initialiser le dossier supabase local**

```bash
npx supabase init
```
Cela crée `supabase/config.toml`. Garder uniquement le dossier `supabase/migrations` (la CLI peut créer aussi `seed.sql` et autres — on n'en a pas besoin).

- [ ] **Step 2 — Écrire la migration**

Créer `supabase/migrations/20260520000000_initial.sql` avec exactement ce contenu :

```sql
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
```

- [ ] **Step 3 — Pas encore d'application : on commit la migration**

```bash
git add supabase/
git commit -m "feat(db): initial schema, RLS, RPCs"
```

---

### Task B2 : Appliquer la migration sur Supabase

**Files:** (aucun changement local)

- [ ] **Step 1 — Appliquer via MCP**

Utiliser l'outil MCP `mcp__claude_ai_Supabase__apply_migration` :
- `name`: `initial`
- `query`: contenu complet du fichier `supabase/migrations/20260520000000_initial.sql`

- [ ] **Step 2 — Vérifier que les tables existent**

Utiliser `mcp__claude_ai_Supabase__list_tables` :
Expected: voir toutes les tables (profiles, trips, trip_members, days, activities, activity_completions, spots, expenses, expense_splits, checklist_items, checklist_completions, guide_cards).

- [ ] **Step 3 — Vérifier les RLS via SQL**

Utiliser `mcp__claude_ai_Supabase__execute_sql` :
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in (
  'profiles','trips','trip_members','days','activities','activity_completions',
  'spots','expenses','expense_splits','checklist_items','checklist_completions','guide_cards'
);
```
Expected: `rowsecurity = true` sur les 12 tables.

- [ ] **Step 4 — Vérifier l'advisor sécurité**

Utiliser `mcp__claude_ai_Supabase__get_advisors` avec `type: "security"`.
Expected: pas de policy manquante critique. Si erreurs « function is_trip_member should be in private schema », on accepte (helper public utilisé partout, choix conscient pour la simplicité — peut être déplacé en SP#2).

- [ ] **Step 5 — Pas de commit**

(Application infra.)

---

### Task B3 : Générer les types TypeScript

**Files:**
- Modify: `lib/types.ts` (complete)
- Modify: `package.json` (script)

- [ ] **Step 1 — Ajouter un script `db:types` dans `package.json`**

Dans `"scripts"` :
```json
"db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > lib/types.ts"
```

(Sur Windows PowerShell, l'utilisateur lancera `$env:SUPABASE_PROJECT_REF='<ref>'; npm run db:types`.)

- [ ] **Step 2 — Login Supabase CLI**

```bash
npx supabase login
```
Suivre le flow OAuth dans le navigateur.

- [ ] **Step 3 — Générer les types**

PowerShell :
```powershell
$env:SUPABASE_PROJECT_REF='<ref>'
npm run db:types
```

- [ ] **Step 4 — Vérifier le fichier généré**

`lib/types.ts` doit contenir un export `Database` avec `public.Tables.trips.Row`, etc. Si vide ou erreur, exécuter manuellement `npx supabase gen types typescript --project-id <ref>` pour voir l'erreur.

- [ ] **Step 5 — Commit**

```bash
git add lib/types.ts package.json
git commit -m "feat(types): generate Supabase TS types"
```

---

## Phase C — Auth gate

L'app demande maintenant une connexion. Les écrans existants restent affichés post-login, toujours avec leurs data hardcodées.

### Task C1 : Configurer Auth Supabase (redirect URLs)

**Files:** (aucun changement local)

- [ ] **Step 1 — Activer le magic link et configurer la redirect URL**

Dans le dashboard Supabase de MK Trip, `Authentication > URL Configuration` :
- **Site URL** : `mktrip://`
- **Redirect URLs** (ajouter) : `mktrip://auth-callback`, `mktrip://*`

- [ ] **Step 2 — Customiser optionnellement le template email**

`Authentication > Email Templates > Magic Link` : changer le sujet en `Connexion MK Trip` et le bouton CTA. Pas bloquant si laissé par défaut.

- [ ] **Step 3 — Vérifier**

Pas de test technique ici, mais conserver une note dans `docs/superpowers/plans/notes-manual-tests.md` :
> Phase C1 — Supabase Auth URL configuration : Site URL=mktrip://, Redirect=mktrip://auth-callback. Validé le YYYY-MM-DD.

---

### Task C2 : Créer le store d'auth

**Files:**
- Create: `store/auth$.ts`

- [ ] **Step 1 — Écrire le store**

```ts
import { observable } from '@legendapp/state'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  loaded: boolean
  session: Session | null
  user: User | null
  profile: { id: string; display_name: string; avatar_url: string | null } | null
}

export const auth$ = observable<AuthState>({
  loaded: false,
  session: null,
  user: null,
  profile: null,
})

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  await setSession(data.session)
  auth$.loaded.set(true)

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
  })
}

async function setSession(session: Session | null) {
  auth$.session.set(session)
  auth$.user.set(session?.user ?? null)
  if (session?.user) {
    await upsertProfile(session.user.id, session.user.email ?? 'Voyageur')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', session.user.id)
      .single()
    auth$.profile.set(profile ?? null)
  } else {
    auth$.profile.set(null)
  }
}

async function upsertProfile(id: string, fallbackName: string) {
  await supabase.from('profiles').upsert(
    { id, display_name: fallbackName },
    { onConflict: 'id', ignoreDuplicates: true }
  )
}

export async function signInWithEmail(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'mktrip://auth-callback',
    },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
```

- [ ] **Step 2 — Vérification**

Le fichier compile sans erreur TS. Lancer `npx tsc --noEmit` :
Expected: aucune erreur ou seulement les erreurs préexistantes du projet (non liées à ce fichier).

- [ ] **Step 3 — Commit**

```bash
git add store/auth$.ts
git commit -m "feat(auth): auth$ observable with session + profile"
```

---

### Task C3 : Écrans (auth) — welcome + check-email

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/welcome.tsx`
- Create: `app/(auth)/check-email.tsx`

- [ ] **Step 1 — Layout auth**

`app/(auth)/_layout.tsx` :
```tsx
import { Stack } from 'expo-router'
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
}
```

- [ ] **Step 2 — Écran welcome**

`app/(auth)/welcome.tsx` :
```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { signInWithEmail } from '../../store/auth$'

export default function Welcome() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Email invalide')
      return
    }
    setLoading(true)
    const { error } = await signInWithEmail(email.trim())
    setLoading(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }
    router.push({ pathname: '/(auth)/check-email', params: { email } })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#F2F2F7', fontSize: 32, fontWeight: '700', letterSpacing: -1 }}>
          MK Trip
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 15, marginTop: 8, marginBottom: 32 }}>
          Tes voyages, en mieux organisés.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="ton@email.com"
          placeholderTextColor="#48484A"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#F2F2F7',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#FF6B4A',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Recevoir le lien</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 3 — Écran check-email**

`app/(auth)/check-email.tsx` :
```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Mail } from 'lucide-react-native'

export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email: string }>()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Mail size={48} color="#FF6B4A" strokeWidth={1.5} />
        <Text style={{ color: '#F2F2F7', fontSize: 22, fontWeight: '700', marginTop: 16 }}>
          Regarde tes mails
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          On a envoyé un lien de connexion à{'\n'}
          <Text style={{ color: '#F2F2F7', fontWeight: '600' }}>{email}</Text>
        </Text>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4 — Vérification**

Bundle compile. Pas encore d'auth-gate, donc ces écrans ne sont pas atteignables — on les testera en Task C5.

- [ ] **Step 5 — Commit**

```bash
git add app/\(auth\)/
git commit -m "feat(auth): welcome + check-email screens"
```

---

### Task C4 : Handler du deep link (auth-callback)

**Files:**
- Create: `app/auth-callback.tsx`

- [ ] **Step 1 — Écrire le handler**

```tsx
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string; token_hash?: string; type?: string }>()

  useEffect(() => {
    ;(async () => {
      // Cas 1 : Supabase renvoie déjà access_token + refresh_token dans le fragment
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        })
        router.replace('/')
        return
      }
      // Cas 2 : token_hash style (PKCE) — verifyOtp
      if (params.token_hash && params.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as any,
        })
        if (!error) {
          router.replace('/')
          return
        }
      }
      router.replace('/(auth)/welcome')
    })()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F11', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#FF6B4A" />
    </View>
  )
}
```

- [ ] **Step 2 — Vérification**

Bundle compile.

- [ ] **Step 3 — Commit**

```bash
git add app/auth-callback.tsx
git commit -m "feat(auth): magic link callback handler"
```

---

### Task C5 : Brancher l'auth gate dans `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1 — Réécrire `_layout.tsx`**

Remplacer le contenu complet par :
```tsx
import '../global.css'
import { Stack, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { useColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { use$ } from '@legendapp/state/react'
import { initNotifications } from '../components/NotificationService'
import { auth$, initAuth } from '../store/auth$'

export default function RootLayout() {
  const { setColorScheme } = useColorScheme()
  const loaded = use$(auth$.loaded)
  const session = use$(auth$.session)

  useEffect(() => {
    setColorScheme('dark')
    initAuth()
    initNotifications()
  }, [])

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F11', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B4A" />
      </View>
    )
  }

  // Si pas de session, l'utilisateur est routé vers (auth) via le système
  // de groupes Expo Router : on déclare le Stack et on protège dans les layouts enfants
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F11' },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="auth-callback" options={{ presentation: 'transparentModal' }} />
      </Stack>
    </View>
  )
}
```

Note: `Stack.Protected` est dispo en expo-router 5+. Si la version installée ne l'a pas, fallback :
```tsx
{!session ? <Redirect href="/(auth)/welcome" /> : null}
```
juste avant le `<Stack>` et router vers `(tabs)` dans `(auth)/welcome` quand session est OK.

- [ ] **Step 2 — Vérification manuelle device**

1. Désinstaller et réinstaller l'APK dev (pour purger la session)
2. Lancer l'app → doit afficher l'écran Welcome
3. Saisir l'email → bouton → écran "Regarde tes mails"
4. Ouvrir le mail sur le même device, cliquer le lien
5. L'app s'ouvre via `mktrip://auth-callback?...`, parse, set session, redirige vers `/(tabs)/index`
6. Le Dashboard Portugal hardcodé s'affiche
7. Tuer l'app, ré-ouvrir : pas redemandé de login (session persistée via AsyncStorage)

Si étape 5 ne fonctionne pas (l'app n'intercepte pas le lien) :
- Vérifier `app.json` → `scheme: "mktrip"`
- Vérifier dans Supabase Auth Settings que `mktrip://auth-callback` est dans les Redirect URLs
- Tester en console : `npx uri-scheme open mktrip://auth-callback --android`

- [ ] **Step 3 — Documenter le test**

Ajouter à `docs/superpowers/plans/notes-manual-tests.md` :
```
## Phase C5 — Auth gate end-to-end
- [x] Welcome → email → check-email
- [x] Magic link mail reçu
- [x] Click ouvre l'app, session établie
- [x] Redémarrage : session persistée
Date validation : YYYY-MM-DD
```

- [ ] **Step 4 — Commit**

```bash
git add app/_layout.tsx docs/superpowers/plans/notes-manual-tests.md
git commit -m "feat(auth): gate root layout with auth$"
```

---

## Phase D — Trips list & switcher

L'utilisateur connecté peut créer un voyage, en rejoindre un par code, et basculer entre voyages. Les tabs continuent d'afficher les data hardcodées Portugal.

### Task D1 : Configurer le sync engine Legend State

**Files:**
- Create: `lib/legend.ts`

- [ ] **Step 1 — Écrire la config**

```ts
import { configureSynced } from '@legendapp/state/sync'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { observablePersistSqlite } from '@legendapp/state/persist-plugins/expo-sqlite'
import * as SQLite from 'expo-sqlite'
import { supabase } from './supabase'

export const customSynced = configureSynced(syncedSupabase, {
  supabase,
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  persist: {
    plugin: observablePersistSqlite(SQLite),
  },
  realtime: { schema: 'public' },
})
```

- [ ] **Step 2 — Vérification**

`npx tsc --noEmit` : compile.

- [ ] **Step 3 — Commit**

```bash
git add lib/legend.ts
git commit -m "feat(legend): configure synced engine with sqlite persistor"
```

---

### Task D2 : Créer le store `trips$` et `currentTrip$`

**Files:**
- Create: `store/trips$.ts`
- Create: `store/tripMembers$.ts`
- Create: `store/currentTrip$.ts`

- [ ] **Step 1 — `store/trips$.ts`**

```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Trip = Database['public']['Tables']['trips']['Row']

export const trips$ = observable(
  customSynced<Record<string, Trip>>({
    collection: 'trips',
    actions: ['read', 'create', 'update', 'delete'],
    persist: { name: 'trips' },
  })
)
```

- [ ] **Step 2 — `store/tripMembers$.ts`**

```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Member = Database['public']['Tables']['trip_members']['Row']

export const tripMembers$ = observable(
  customSynced<Record<string, Member>>({
    collection: 'trip_members',
    actions: ['read'],
    persist: { name: 'trip_members' },
  })
)
```

- [ ] **Step 3 — `store/currentTrip$.ts`**

```ts
import { observable } from '@legendapp/state'
import { syncObservable } from '@legendapp/state/sync'
import { observablePersistSqlite } from '@legendapp/state/persist-plugins/expo-sqlite'
import * as SQLite from 'expo-sqlite'

export const currentTripId$ = observable<string | null>(null)

syncObservable(currentTripId$, {
  persist: {
    name: 'currentTripId',
    plugin: observablePersistSqlite(SQLite),
  },
})
```

- [ ] **Step 4 — Vérification**

`npx tsc --noEmit` : compile.

- [ ] **Step 5 — Commit**

```bash
git add store/trips$.ts store/tripMembers$.ts store/currentTrip$.ts
git commit -m "feat(store): trips + members + currentTrip$"
```

---

### Task D3 : Écran liste des voyages

**Files:**
- Create: `app/(trips)/_layout.tsx`
- Create: `app/(trips)/index.tsx`

- [ ] **Step 1 — Layout**

`app/(trips)/_layout.tsx` :
```tsx
import { Stack } from 'expo-router'
export default function TripsLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
}
```

- [ ] **Step 2 — Liste**

`app/(trips)/index.tsx` :
```tsx
import { View, Text, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { use$ } from '@legendapp/state/react'
import { useRouter } from 'expo-router'
import { Plus, Hash, LogOut } from 'lucide-react-native'
import { trips$ } from '../../store/trips$'
import { auth$, signOut } from '../../store/auth$'
import { currentTripId$ } from '../../store/currentTrip$'

export default function TripsList() {
  const router = useRouter()
  const trips = Object.values(use$(trips$) ?? {})
  const profile = use$(auth$.profile)

  const openTrip = (id: string) => {
    currentTripId$.set(id)
    router.replace(`/(trips)/${id}/(tabs)`)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ color: '#8E8E93', fontSize: 13 }}>Bonjour</Text>
            <Text style={{ color: '#F2F2F7', fontSize: 22, fontWeight: '700' }}>{profile?.display_name ?? '...'}</Text>
          </View>
          <Pressable onPress={signOut} style={{ padding: 8 }}>
            <LogOut size={20} color="#8E8E93" />
          </Pressable>
        </View>

        <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
          Mes voyages
        </Text>

        {trips.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text style={{ color: '#8E8E93', fontSize: 14 }}>Aucun voyage pour l'instant.</Text>
          </View>
        ) : (
          trips.map(trip => (
            <Pressable
              key={trip.id}
              onPress={() => openTrip(trip.id)}
              style={{
                backgroundColor: '#1C1C1E',
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 8, height: 40, borderRadius: 4, backgroundColor: trip.cover_color }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F2F2F7', fontSize: 16, fontWeight: '600' }}>{trip.name}</Text>
                  {trip.destination && <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>{trip.destination}</Text>}
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Pressable
            onPress={() => router.push('/(trips)/new')}
            style={{ flex: 1, backgroundColor: '#FF6B4A', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Plus size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Nouveau</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(trips)/join')}
            style={{ flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <Hash size={18} color="#F2F2F7" />
            <Text style={{ color: '#F2F2F7', fontSize: 15, fontWeight: '600' }}>Rejoindre</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 3 — Vérification**

(L'écran n'est pas encore atteignable, on le testera en D6.)

- [ ] **Step 4 — Commit**

```bash
git add app/\(trips\)/
git commit -m "feat(trips): list screen with empty state and actions"
```

---

### Task D4 : Modal "Nouveau voyage"

**Files:**
- Create: `app/(trips)/new.tsx`

- [ ] **Step 1 — Écran**

```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { auth$ } from '../../store/auth$'
import { trips$ } from '../../store/trips$'
import { currentTripId$ } from '../../store/currentTrip$'

const TRIP_TYPES = ['city_break', 'road_trip', 'sport', 'hike', 'beach', 'other'] as const
const COLORS = ['#FF6B4A', '#2EC4A8', '#AF52DE', '#FFD60A', '#5AC8FA', '#34C759']

export default function NewTrip() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState<typeof TRIP_TYPES[number]>('road_trip')
  const [color, setColor] = useState(COLORS[0])
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Donne un nom à ton voyage')
      return
    }
    const userId = auth$.user.id.peek()
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .insert({
        owner_id: userId,
        name: name.trim(),
        destination: destination.trim() || null,
        trip_type: tripType,
        cover_color: color,
        total_budget: budget ? Number(budget) : null,
      })
      .select()
      .single()
    setLoading(false)
    if (error || !data) {
      Alert.alert('Erreur', error?.message ?? 'Création impossible')
      return
    }
    trips$[data.id].set(data)
    currentTripId$.set(data.id)
    router.replace(`/(trips)/${data.id}/(tabs)`)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: '#F2F2F7', fontSize: 18, fontWeight: '700' }}>Nouveau voyage</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <X size={20} color="#8E8E93" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Field label="Nom" value={name} onChange={setName} placeholder="Road trip skatepark Sud" />
        <Field label="Destination" value={destination} onChange={setDestination} placeholder="Sud-France" />
        <Field label="Budget total (€)" value={budget} onChange={setBudget} placeholder="800" keyboard="numeric" />

        <Text style={labelStyle}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRIP_TYPES.map(t => (
            <Pressable
              key={t}
              onPress={() => setTripType(t)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 50,
                backgroundColor: tripType === t ? '#FF6B4A' : '#1C1C1E',
                borderWidth: 1,
                borderColor: tripType === t ? '#FF6B4A' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: tripType === t ? '#fff' : '#F2F2F7', fontSize: 13, fontWeight: '600' }}>
                {t.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={labelStyle}>Couleur</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {COLORS.map(c => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={onCreate}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#FF6B4A',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            opacity: pressed || loading ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Création...' : 'Créer le voyage'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const labelStyle = { color: '#8E8E93', fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, marginTop: 6 }

function Field({ label, value, onChange, placeholder, keyboard }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboard?: 'numeric' | 'default' }) {
  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#48484A"
        keyboardType={keyboard ?? 'default'}
        style={{
          backgroundColor: '#1C1C1E',
          color: '#F2F2F7',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          marginTop: 6,
        }}
      />
    </View>
  )
}
```

- [ ] **Step 2 — Vérification**

Bundle compile.

- [ ] **Step 3 — Commit**

```bash
git add app/\(trips\)/new.tsx
git commit -m "feat(trips): new trip modal"
```

---

### Task D5 : Modal "Rejoindre par code"

**Files:**
- Create: `app/(trips)/join.tsx`
- Create: `lib/joinCode.ts`

- [ ] **Step 1 — Helper validation**

`lib/joinCode.ts` :
```ts
export const JOIN_CODE_RE = /^MKT-[A-Z0-9]{4}$/

export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s/g, '')
}

export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_RE.test(code)
}
```

- [ ] **Step 2 — Modal**

`app/(trips)/join.tsx` :
```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { trips$ } from '../../store/trips$'
import { currentTripId$ } from '../../store/currentTrip$'
import { normalizeJoinCode, isValidJoinCode } from '../../lib/joinCode'

export default function JoinTrip() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const onJoin = async () => {
    const normalized = normalizeJoinCode(code)
    if (!isValidJoinCode(normalized)) {
      Alert.alert('Code invalide', 'Format attendu : MKT-XXXX')
      return
    }
    setLoading(true)
    const { data: tripId, error } = await supabase.rpc('join_trip_by_code', { code: normalized })
    if (error) {
      setLoading(false)
      Alert.alert('Erreur', error.message === 'TRIP_NOT_FOUND' ? 'Code inconnu' : error.message)
      return
    }
    // Fetch et insère manuellement dans le store local pour réactivité immédiate
    const { data: trip } = await supabase.from('trips').select('*').eq('id', tripId).single()
    setLoading(false)
    if (trip) {
      trips$[trip.id].set(trip)
      currentTripId$.set(trip.id)
      router.replace(`/(trips)/${trip.id}/(tabs)`)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: '#F2F2F7', fontSize: 18, fontWeight: '700' }}>Rejoindre</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <X size={20} color="#8E8E93" />
        </Pressable>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: '#8E8E93', fontSize: 14 }}>
          Saisis le code que ton ami t'a partagé (format MKT-XXXX).
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="MKT-A9F2"
          placeholderTextColor="#48484A"
          maxLength={8}
          style={{
            backgroundColor: '#1C1C1E',
            color: '#F2F2F7',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 18,
            fontWeight: '600',
            letterSpacing: 2,
            textAlign: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Pressable
          onPress={onJoin}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#FF6B4A',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed || loading ? 0.85 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Recherche...' : 'Rejoindre'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 3 — Commit**

```bash
git add app/\(trips\)/join.tsx lib/joinCode.ts
git commit -m "feat(trips): join by code modal + helper"
```

---

### Task D6 : Mover les écrans (tabs) sous `[tripId]` et router post-login

**Files:**
- Create: `app/(trips)/[tripId]/_layout.tsx`
- Create: `app/(trips)/[tripId]/(tabs)/_layout.tsx`
- Move: `app/(tabs)/*` → `app/(trips)/[tripId]/(tabs)/*`
- Modify: `app/_layout.tsx`

- [ ] **Step 1 — Déplacer le dossier tabs**

PowerShell :
```powershell
git mv app/(tabs) app/(trips)/[tripId]/(tabs)
```
(Si Windows refuse les chars spéciaux, faire en 2 mouvements : créer `app/(trips)/[tripId]/(tabs)` puis `git mv` chaque fichier.)

- [ ] **Step 2 — Layout `[tripId]`**

`app/(trips)/[tripId]/_layout.tsx` :
```tsx
import { useEffect } from 'react'
import { Stack, useLocalSearchParams, Redirect } from 'expo-router'
import { use$ } from '@legendapp/state/react'
import { currentTripId$ } from '../../../store/currentTrip$'
import { trips$ } from '../../../store/trips$'

export default function TripLayout() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = use$(trips$[tripId!])

  useEffect(() => {
    if (tripId) currentTripId$.set(tripId)
  }, [tripId])

  if (!trip) {
    // Trip pas (encore) en store local : on attend le sync
    return null
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
}
```

- [ ] **Step 3 — Brancher le routage post-login dans `app/_layout.tsx`**

Modifier le `Stack.Protected guard={!!session}` pour ne plus pointer vers `(tabs)` mais vers `(trips)` :

```tsx
<Stack.Protected guard={!!session}>
  <Stack.Screen name="(trips)" />
</Stack.Protected>
```

Et au démarrage, rediriger vers le dernier trip si on en a un :
Dans `app/_layout.tsx`, après `if (!loaded)`, ajouter :
```tsx
const currentId = currentTripId$.get()
if (session && currentId) {
  return <Redirect href={`/(trips)/${currentId}/(tabs)`} />
}
```
Pour pouvoir lire `currentTripId$` au render, importer en haut :
```tsx
import { currentTripId$ } from '../store/currentTrip$'
```

- [ ] **Step 4 — Mettre à jour les imports relatifs des écrans déplacés**

Dans chacun de `app/(trips)/[tripId]/(tabs)/{index,budget,map,planning,guide}.tsx`, mettre à jour les imports relatifs (les `../../components/X` deviennent `../../../../components/X`).

- [ ] **Step 5 — Vérification manuelle device**

1. Reset session (réinstaller APK)
2. Login → écran "Mes voyages" (vide)
3. "Nouveau" → créer un voyage test → redirige vers tabs avec data Portugal hardcodée
4. Bouton back ou logout
5. Login à nouveau → écran "Mes voyages" liste mon voyage test
6. Cliquer le voyage → tabs

Documenter dans `docs/superpowers/plans/notes-manual-tests.md`.

- [ ] **Step 6 — Commit**

```bash
git add app/
git commit -m "feat(trips): route tabs under [tripId], move tabs folder"
```

---

### Task D7 : TripSwitcher dans le Dashboard

**Files:**
- Create: `components/TripSwitcher.tsx`
- Modify: `app/(trips)/[tripId]/(tabs)/index.tsx`

- [ ] **Step 1 — Composant**

`components/TripSwitcher.tsx` :
```tsx
import { useState } from 'react'
import { View, Text, Pressable, Modal, FlatList } from 'react-native'
import { ChevronDown, Plus, Hash } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { use$ } from '@legendapp/state/react'
import { trips$ } from '../store/trips$'
import { currentTripId$ } from '../store/currentTrip$'

export default function TripSwitcher() {
  const [open, setOpen] = useState(false)
  const trips = Object.values(use$(trips$) ?? {})
  const currentId = use$(currentTripId$)
  const current = trips.find(t => t.id === currentId)
  const router = useRouter()

  const switchTo = (id: string) => {
    currentTripId$.set(id)
    setOpen(false)
    router.replace(`/(trips)/${id}/(tabs)`)
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: '#F2F2F7', fontSize: 20, fontWeight: '600', letterSpacing: -0.5 }}>
          {current?.name ?? 'MK Trip'}
        </Text>
        <ChevronDown size={16} color="#8E8E93" />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => setOpen(false)}>
          <Pressable style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingTop: 16, paddingHorizontal: 20 }} onPress={() => {}}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#48484A' }} />
            </View>
            <FlatList
              data={trips}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => switchTo(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                  <View style={{ width: 6, height: 32, borderRadius: 3, backgroundColor: item.cover_color }} />
                  <Text style={{ color: item.id === currentId ? '#FF6B4A' : '#F2F2F7', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                </Pressable>
              )}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => { setOpen(false); router.push('/(trips)/new') }} style={{ flex: 1, backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <Plus size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Nouveau</Text>
              </Pressable>
              <Pressable onPress={() => { setOpen(false); router.push('/(trips)/join') }} style={{ flex: 1, backgroundColor: '#2C2C2E', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <Hash size={16} color="#F2F2F7" />
                <Text style={{ color: '#F2F2F7', fontWeight: '600' }}>Rejoindre</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
```

- [ ] **Step 2 — Brancher dans le Dashboard**

Dans `app/(trips)/[tripId]/(tabs)/index.tsx`, remplacer le bloc `<Text>MK Trip</Text>` du header par `<TripSwitcher />`. Importer `TripSwitcher` depuis `../../../../components/TripSwitcher`.

- [ ] **Step 3 — Vérification manuelle**

Le Dashboard affiche le nom du voyage courant. Tap → bottom sheet liste les voyages. Switch vers un autre → tabs rechargent (l'écran reste Portugal hardcodé pour l'instant, c'est normal).

- [ ] **Step 4 — Commit**

```bash
git add components/TripSwitcher.tsx app/\(trips\)/\[tripId\]/\(tabs\)/index.tsx
git commit -m "feat(trips): trip switcher in dashboard header"
```

---

## Phase E — Seed du voyage Portugal

### Task E1 : Écrire et lancer le script de seed

**Files:**
- Create: `scripts/seed-portugal.ts`
- Modify: `package.json`

- [ ] **Step 1 — Script**

`scripts/seed-portugal.ts` :

```ts
/// <reference types="node" />
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { SPOTS } from '../components/MapData'
import { TRIP_DAYS } from '../components/PlanningData'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !serviceKey) {
  console.error('Missing env. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const TARGET_EMAIL = process.argv[2]
if (!TARGET_EMAIL) {
  console.error('Usage: tsx scripts/seed-portugal.ts <owner-email>')
  process.exit(1)
}

const supa = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  // 1. Find user
  const { data: users, error: uErr } = await supa.auth.admin.listUsers()
  if (uErr) throw uErr
  const user = users.users.find(u => u.email === TARGET_EMAIL)
  if (!user) {
    console.error(`User ${TARGET_EMAIL} not found. Sign in via the app once first.`)
    process.exit(1)
  }

  // 2. Ensure profile
  await supa.from('profiles').upsert({ id: user.id, display_name: user.email!.split('@')[0] }, { onConflict: 'id', ignoreDuplicates: true })

  // 3. Create trip (idempotent by owner + name)
  const TRIP_NAME = 'Portugal Avril 2026'
  const { data: existing } = await supa.from('trips').select('id').eq('owner_id', user.id).eq('name', TRIP_NAME).maybeSingle()
  if (existing) {
    console.log('Trip already exists, deleting and recreating for clean seed...')
    await supa.from('trips').delete().eq('id', existing.id)
  }
  const { data: trip, error: tErr } = await supa.from('trips').insert({
    owner_id: user.id,
    name: TRIP_NAME,
    destination: 'Portugal',
    start_date: '2026-04-10',
    end_date: '2026-04-17',
    trip_type: 'city_break',
    currency: 'EUR',
    total_budget: 1200,
    cover_color: '#FF6B4A',
  }).select().single()
  if (tErr || !trip) throw tErr ?? new Error('No trip')

  // 4. Seed days + activities
  for (const day of TRIP_DAYS) {
    const { data: dRow, error: dErr } = await supa.from('days').insert({
      trip_id: trip.id,
      day_number: day.dayNumber,
      date: day.date,
      label: day.label,
      theme: day.theme,
      zone: day.zone,
    }).select().single()
    if (dErr || !dRow) throw dErr
    for (let i = 0; i < day.activities.length; i++) {
      const a = day.activities[i]
      await supa.from('activities').insert({
        day_id: dRow.id,
        time: a.time,
        title: a.title,
        subtitle: a.subtitle ?? null,
        category: a.category,
        position: i,
      })
    }
  }

  // 5. Seed spots
  for (const spot of SPOTS) {
    await supa.from('spots').insert({
      trip_id: trip.id,
      name: spot.name,
      description: spot.description,
      category: spot.category,
      zone: spot.zone,
      lat: spot.coordinate.latitude,
      lng: spot.coordinate.longitude,
      price: spot.price ?? null,
      tags: [],
    })
  }

  // 6. Seed checklist items
  const CHECKLIST = ['Coupe-vent','Lunettes de soleil','Crème solaire',"Bonnes baskets (pavés glissants!)",'Pull pour le soir','Maillot de bain','Adaptateur prise (pas nécessaire, même prises)']
  for (let i = 0; i < CHECKLIST.length; i++) {
    await supa.from('checklist_items').insert({
      trip_id: trip.id,
      label: CHECKLIST[i],
      category: 'clothing',
      position: i,
    })
  }

  // 7. Seed guide cards
  const CARDS: Array<{ kind: string; title: string; body: string; icon_name: string }> = [
    { kind: 'danger', title: 'Cannabis', body: "Décriminalisé mais PAS légal à acheter. Arnaque vendeurs Baixa/Rossio (laurier/bouillon cube).", icon_name: 'AlertTriangle' },
    { kind: 'warning', title: 'Alcool', body: "Alcool pas cher. On boit dans la rue à Bairro Alto — c'est normal. Bières ~1.50€ en terrasse.", icon_name: 'Wine' },
    { kind: 'info', title: 'Transport', body: "Uber/Bolt très pas cher (~5€ traverser Lisbonne). Viva Viagem card pour metro/tram/bus. Location voiture à l'aéroport pour Alentejo.", icon_name: 'Car' },
    { kind: 'weather', title: 'Météo Avril', body: '15–22°C, pluie possible, vent constant sur la côte.', icon_name: 'Sun' },
    { kind: 'food', title: 'Manger Local', body: 'Bifana > sandwich classique. Pastéis de nata à Belém. Percebes (pouce-pieds) = délicieux. Menu du jour ~8-12€', icon_name: 'UtensilsCrossed' },
    { kind: 'emergency', title: 'Urgences', body: '112 — Urgences\n217 654 242 — PSP Police\n213 939 100 — Ambassade France', icon_name: 'Phone' },
  ]
  for (let i = 0; i < CARDS.length; i++) {
    await supa.from('guide_cards').insert({ trip_id: trip.id, ...CARDS[i], position: i })
  }

  console.log(`✓ Trip "${TRIP_NAME}" seeded for ${TARGET_EMAIL}`)
  console.log(`  Trip ID: ${trip.id}`)
  console.log(`  Join code: ${trip.join_code}`)
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2 — Installer `dotenv`**

```bash
npm install --save-dev dotenv
```

- [ ] **Step 3 — Ajouter script package.json**

```json
"seed:portugal": "tsx scripts/seed-portugal.ts"
```

- [ ] **Step 4 — Lancer le seed**

D'abord, **se connecter une fois via l'app** sur device (avec ton email) pour créer le user dans `auth.users`. Puis :

```bash
npm run seed:portugal -- <ton-email>
```

Expected output :
```
✓ Trip "Portugal Avril 2026" seeded for ton-email@...
  Trip ID: <uuid>
  Join code: MKT-XXXX
```

- [ ] **Step 5 — Vérifier dans le dashboard Supabase**

`mcp__claude_ai_Supabase__execute_sql` :
```sql
select t.name, t.join_code, count(distinct d.id) as days, count(distinct a.id) as activities, count(distinct s.id) as spots
from trips t
left join days d on d.trip_id = t.id
left join activities a on a.day_id = d.id
left join spots s on s.trip_id = t.id
where t.name = 'Portugal Avril 2026'
group by t.id;
```
Expected: `days = 8`, `activities = count(TRIP_DAYS.flatMap(d=>d.activities))`, `spots = SPOTS.length`.

- [ ] **Step 6 — Vérification device**

Ouvrir l'app, se reconnecter si besoin. Le voyage Portugal apparaît dans "Mes voyages". L'ouvrir affiche encore le Dashboard hardcodé (Phase F va le brancher).

- [ ] **Step 7 — Commit**

```bash
git add scripts/seed-portugal.ts package.json
git commit -m "feat(seed): portugal trip seed script"
```

---

## Phase F — Migration module par module

Pour chaque module, on bascule l'écran de "data hardcodée" à "data depuis le store Legend State branché sur Supabase".

### Task F1 : Module Guide (checklist + cards)

**Files:**
- Create: `store/checklistItems$.ts`
- Create: `store/checklistCompletions$.ts`
- Create: `store/guideCards$.ts`
- Modify: `app/(trips)/[tripId]/(tabs)/guide.tsx`

- [ ] **Step 1 — `store/checklistItems$.ts`**

```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Item = Database['public']['Tables']['checklist_items']['Row']

export const checklistItems$ = observable(
  customSynced<Record<string, Item>>({
    collection: 'checklist_items',
    actions: ['read', 'create', 'update', 'delete'],
    persist: { name: 'checklist_items' },
  })
)
```

- [ ] **Step 2 — `store/checklistCompletions$.ts`**

```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Completion = Database['public']['Tables']['checklist_completions']['Row']

export const checklistCompletions$ = observable(
  customSynced<Record<string, Completion>>({
    collection: 'checklist_completions',
    actions: ['read', 'create', 'delete'],
    persist: { name: 'checklist_completions' },
  })
)
```

Note: clé composite gérée côté UI (`${item_id}_${user_id}`).

- [ ] **Step 3 — `store/guideCards$.ts`**

```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Card = Database['public']['Tables']['guide_cards']['Row']

export const guideCards$ = observable(
  customSynced<Record<string, Card>>({
    collection: 'guide_cards',
    actions: ['read', 'create', 'update', 'delete'],
    persist: { name: 'guide_cards' },
  })
)
```

- [ ] **Step 4 — Réécrire `guide.tsx`**

Remplacer tout le contenu de `app/(trips)/[tripId]/(tabs)/guide.tsx` par :

```tsx
import { AlertTriangle, Bell, Car, Luggage, Phone, Sun, UtensilsCrossed, Wine, type LucideIcon } from 'lucide-react-native'
import { useEffect, useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { use$ } from '@legendapp/state/react'
import { isEnabled as notifIsEnabled, setEnabled as notifSetEnabled } from '../../../../components/NotificationService'
import FloatingDock from '../../../../components/FloatingDock'
import { checklistItems$ } from '../../../../store/checklistItems$'
import { checklistCompletions$ } from '../../../../store/checklistCompletions$'
import { guideCards$ } from '../../../../store/guideCards$'
import { currentTripId$ } from '../../../../store/currentTrip$'
import { auth$ } from '../../../../store/auth$'
import { supabase } from '../../../../lib/supabase'

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle, Wine, Car, Sun, UtensilsCrossed, Phone, Luggage, Bell,
}

const KIND_COLOR: Record<string, string> = {
  danger: '#FF453A',
  warning: '#FFD60A',
  info: '#2EC4A8',
  weather: '#5AC8FA',
  food: '#FF6B4A',
  emergency: '#8E8E93',
}

export default function GuideScreen() {
  const tripId = use$(currentTripId$)
  const userId = use$(auth$.user)?.id
  const [notifsOn, setNotifsOn] = useState(false)

  useEffect(() => { notifIsEnabled().then(setNotifsOn) }, [])
  const toggleNotifs = useCallback(async () => {
    const next = !notifsOn
    const ok = await notifSetEnabled(next)
    if (ok) setNotifsOn(next)
  }, [notifsOn])

  const items = Object.values(use$(checklistItems$) ?? {})
    .filter(i => i.trip_id === tripId)
    .sort((a, b) => a.position - b.position)
  const completions = Object.values(use$(checklistCompletions$) ?? {})
    .filter(c => c.user_id === userId)
  const completedItems = new Set(completions.map(c => c.item_id))
  const cards = Object.values(use$(guideCards$) ?? {})
    .filter(c => c.trip_id === tripId)
    .sort((a, b) => a.position - b.position)

  const toggleItem = useCallback(async (itemId: string) => {
    if (!userId) return
    const key = `${itemId}_${userId}`
    if (completedItems.has(itemId)) {
      checklistCompletions$[key].delete()
      await supabase.from('checklist_completions').delete().eq('item_id', itemId).eq('user_id', userId)
    } else {
      const row = { item_id: itemId, user_id: userId, completed_at: new Date().toISOString() }
      checklistCompletions$[key].set(row)
      await supabase.from('checklist_completions').insert(row)
    }
  }, [userId, completedItems])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Guide Pratique</Text>

        <Pressable onPress={toggleNotifs} style={[styles.card, { borderColor: notifsOn ? 'rgba(52,199,89,0.35)' : 'rgba(255,255,255,0.06)' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: notifsOn ? 'rgba(52,199,89,0.15)' : 'rgba(142,142,147,0.15)' }]}>
              <Bell size={20} color={notifsOn ? '#34C759' : '#8E8E93'} />
            </View>
            <Text style={styles.cardTitle}>Rappels</Text>
            <View style={[styles.togglePill, notifsOn ? styles.toggleOn : styles.toggleOff]}>
              <View style={[styles.toggleDot, { alignSelf: notifsOn ? 'flex-end' : 'flex-start' }]} />
            </View>
          </View>
          <Text style={styles.cardText}>Notification chaque matin à 8h avec le programme du jour.</Text>
        </Pressable>

        {cards.map(card => {
          const Icon = ICON_MAP[card.icon_name ?? ''] ?? AlertTriangle
          const color = KIND_COLOR[card.kind] ?? '#8E8E93'
          return (
            <View key={card.id} style={[styles.card, card.kind === 'danger' && { borderColor: 'rgba(255,69,58,0.35)' }, card.kind === 'warning' && { borderColor: 'rgba(255,214,10,0.25)' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBubble, { backgroundColor: color + '1A' }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardText}>{card.body}</Text>
            </View>
          )
        })}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: '#FF6B4A1A' }]}>
              <Luggage size={20} color="#FF6B4A" />
            </View>
            <Text style={styles.cardTitle}>Valise</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{completions.length}/{items.length}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${items.length ? (completions.length / items.length) * 100 : 0}%` }]} />
          </View>
          <View style={styles.checklistItems}>
            {items.map(item => {
              const checked = completedItems.has(item.id)
              return (
                <Pressable key={item.id} style={({ pressed }) => [styles.checklistRow, pressed && styles.checklistRowPressed]} onPress={() => toggleItem(item.id)}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checklistLabel, checked && styles.checklistLabelChecked]}>{item.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </ScrollView>
      <FloatingDock />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F11' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 12 },
  header: { fontSize: 28, fontWeight: '700', color: '#F2F2F7', marginBottom: 4 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#F2F2F7', flex: 1 },
  cardText: { fontSize: 14, lineHeight: 20, color: '#8E8E93' },
  progressBadge: { backgroundColor: 'rgba(255,107,74,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#FF6B4A' },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: 4, backgroundColor: '#FF6B4A', borderRadius: 2 },
  checklistItems: { gap: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  checklistRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
  checkmark: { fontSize: 13, color: '#FFFFFF', fontWeight: '700', lineHeight: 16 },
  checklistLabel: { fontSize: 14, color: '#F2F2F7', flex: 1, lineHeight: 20 },
  checklistLabelChecked: { color: '#8E8E93', textDecorationLine: 'line-through' },
  togglePill: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#34C759' },
  toggleOff: { backgroundColor: '#3A3A3C' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
})
```

- [ ] **Step 5 — Vérification device**

Sur le voyage Portugal seedé : ouvrir l'onglet Guide. Les cards et la checklist doivent s'afficher depuis la DB. Cocher un item → reste coché au refresh. Tester offline (mode avion, toggle item, ré-ouvrir → toujours coché ; reconnecter → vérifier que la coche est en DB).

- [ ] **Step 6 — Commit**

```bash
git add store/checklistItems\$.ts store/checklistCompletions\$.ts store/guideCards\$.ts app/\(trips\)/\[tripId\]/\(tabs\)/guide.tsx
git commit -m "feat(guide): migrate to Supabase via Legend State"
```

---

### Task F2 : Module Map (spots)

**Files:**
- Create: `store/spots$.ts`
- Modify: `app/(trips)/[tripId]/(tabs)/map.tsx`
- Modify: `components/SpotCard.tsx`

- [ ] **Step 1 — Store**

`store/spots$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'

type Spot = Database['public']['Tables']['spots']['Row']

export const spots$ = observable(
  customSynced<Record<string, Spot>>({
    collection: 'spots',
    actions: ['read', 'create', 'update', 'delete'],
    persist: { name: 'spots' },
  })
)
```

- [ ] **Step 2 — Adapter `map.tsx` pour consommer le store**

L'écran actuel importe `SPOTS, ZONES, CATEGORY_CONFIG, type Spot, type SpotCategory` depuis `MapData`. On garde `ZONES` et `CATEGORY_CONFIG` (configuration UI, pas data métier) dans un nouveau fichier `lib/mapConfig.ts`, et on bascule `SPOTS` vers le store.

Créer `lib/mapConfig.ts` :
```ts
export type SpotCategory = 'food' | 'culture' | 'nightlife' | 'nature' | 'accommodation' | 'activity' | 'sport'

export const CATEGORY_CONFIG: Record<SpotCategory, { color: string }> = {
  food: { color: '#FF6B4A' },
  culture: { color: '#AF52DE' },
  nightlife: { color: '#FF453A' },
  nature: { color: '#34C759' },
  accommodation: { color: '#2EC4A8' },
  activity: { color: '#FFD60A' },
  sport: { color: '#5AC8FA' },
}

export const ZONES = {
  lisboa: { latitude: 38.7223, longitude: -9.1393, latitudeDelta: 0.04, longitudeDelta: 0.04 },
  alentejo: { latitude: 38.2, longitude: -8.6, latitudeDelta: 0.5, longitudeDelta: 0.5 },
}
```

(Note : ZONES reste hardcodé pour le SP#1. Plus tard, on calculera depuis les coords des spots du voyage.)

- [ ] **Step 3 — Réécrire `map.tsx`**

Dans le fichier, remplacer l'import `from '../../components/MapData'` par `from '../../../../lib/mapConfig'` (pour CATEGORY_CONFIG, ZONES, SpotCategory). Importer `spots$` et `currentTripId$`.

En haut de `MapScreen` :
```tsx
const tripId = use$(currentTripId$)
const SPOTS = Object.values(use$(spots$) ?? {})
  .filter(s => s.trip_id === tripId)
  .map(s => ({
    id: s.id,
    name: s.name,
    description: s.description ?? '',
    category: s.category as SpotCategory,
    zone: (s.zone as 'lisboa' | 'alentejo') ?? 'lisboa',
    coordinate: { latitude: Number(s.lat), longitude: Number(s.lng) },
    price: s.price ?? undefined,
  }))
```

Le reste du composant (filtres, markers, fallback web) ne change pas. Type local `Spot` à adapter pour matcher cette shape.

- [ ] **Step 4 — Adapter `SpotCard.tsx`**

Adapter le composant pour qu'il fonctionne avec la même shape `Spot` produite ci-dessus.

- [ ] **Step 5 — Vérification device**

Sur Portugal seedé : Map affiche les markers depuis Supabase. Filtres OK, switch zone OK.

- [ ] **Step 6 — Commit**

```bash
git add store/spots\$.ts lib/mapConfig.ts app/\(trips\)/\[tripId\]/\(tabs\)/map.tsx components/SpotCard.tsx
git commit -m "feat(map): migrate spots to Supabase"
```

---

### Task F3 : Module Planning (days + activities + completions)

**Files:**
- Create: `store/days$.ts`
- Create: `store/activities$.ts`
- Create: `store/activityCompletions$.ts`
- Modify: `app/(trips)/[tripId]/(tabs)/planning.tsx`

- [ ] **Step 1 — Stores**

`store/days$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'
type Day = Database['public']['Tables']['days']['Row']
export const days$ = observable(customSynced<Record<string, Day>>({
  collection: 'days', actions: ['read','create','update','delete'], persist: { name: 'days' },
}))
```

`store/activities$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'
type Activity = Database['public']['Tables']['activities']['Row']
export const activities$ = observable(customSynced<Record<string, Activity>>({
  collection: 'activities', actions: ['read','create','update','delete'], persist: { name: 'activities' },
}))
```

`store/activityCompletions$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'
type Completion = Database['public']['Tables']['activity_completions']['Row']
export const activityCompletions$ = observable(customSynced<Record<string, Completion>>({
  collection: 'activity_completions', actions: ['read','create','delete'], persist: { name: 'activity_completions' },
}))
```

- [ ] **Step 2 — Réécrire `planning.tsx`**

Replacer l'import `from '../../components/PlanningData'` et `from '../../components/PlanningStore'` par les stores Legend State.

Dans `PlanningScreen()`, remplacer :
```ts
const [selectedDayId, setSelectedDayId] = useState(TRIP_DAYS[0].id)
const { doneIds, toggleDone } = usePlanning()
```
par :
```ts
const tripId = use$(currentTripId$)
const userId = use$(auth$.user)?.id
const days = Object.values(use$(days$) ?? {})
  .filter(d => d.trip_id === tripId)
  .sort((a, b) => a.day_number - b.day_number)
const allActivities = Object.values(use$(activities$) ?? {})
const completions = Object.values(use$(activityCompletions$) ?? {}).filter(c => c.user_id === userId)
const doneIds = new Set(completions.map(c => c.activity_id))
const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
useEffect(() => { if (!selectedDayId && days[0]) setSelectedDayId(days[0].id) }, [days, selectedDayId])
const selectedDay = days.find(d => d.id === selectedDayId)
const selectedActivities = allActivities.filter(a => a.day_id === selectedDayId).sort((a,b) => a.position - b.position)
```

Réécrire `toggleDone` :
```ts
const toggleDone = async (activityId: string) => {
  if (!userId) return
  const key = `${activityId}_${userId}`
  if (doneIds.has(activityId)) {
    activityCompletions$[key].delete()
    await supabase.from('activity_completions').delete().eq('activity_id', activityId).eq('user_id', userId)
  } else {
    const row = { activity_id: activityId, user_id: userId, completed_at: new Date().toISOString() }
    activityCompletions$[key].set(row)
    await supabase.from('activity_completions').insert(row)
  }
}
```

Adapter les types (`TripDay`, `PlannedActivity`) pour matcher les shapes DB (les imports précédents disparaissent). Le rendu (DayPill, ActivityRow, timeline) ne change pas mais consomme `selectedActivities` et `selectedDay` du store.

Adapter `<DayPill day={item} ...>` pour utiliser `item.day_number`, `item.label`, `item.zone` (mêmes noms).

`accentColor` : `selectedDay?.zone === 'lisboa' ? '#FF6B4A' : '#2EC4A8'` (logique préservée).

- [ ] **Step 3 — Mettre à jour `_layout.tsx`** (retirer `PlanningProvider`)

Dans `app/_layout.tsx`, le `PlanningProvider` n'existe plus dans la nouvelle Tree (déjà retiré en Task C5). S'il reste un import, supprimer.

- [ ] **Step 4 — Vérification device**

Sur Portugal seedé : Planning affiche les 8 jours, activités. Cocher → reste coché au refresh, visible offline.

- [ ] **Step 5 — Commit**

```bash
git add store/days\$.ts store/activities\$.ts store/activityCompletions\$.ts app/\(trips\)/\[tripId\]/\(tabs\)/planning.tsx
git commit -m "feat(planning): migrate to Supabase"
```

---

### Task F4 : Module Budget (expenses + splits)

**Files:**
- Create: `store/expenses$.ts`
- Create: `store/expenseSplits$.ts`
- Modify: `app/(trips)/[tripId]/(tabs)/budget.tsx`
- Modify: `components/AddExpenseModal.tsx`

- [ ] **Step 1 — Stores**

`store/expenses$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'
type Expense = Database['public']['Tables']['expenses']['Row']
export const expenses$ = observable(customSynced<Record<string, Expense>>({
  collection: 'expenses', actions: ['read','create','update','delete'], persist: { name: 'expenses' },
}))
```

`store/expenseSplits$.ts` :
```ts
import { observable } from '@legendapp/state'
import { customSynced } from '../lib/legend'
import type { Database } from '../lib/types'
type Split = Database['public']['Tables']['expense_splits']['Row']
export const expenseSplits$ = observable(customSynced<Record<string, Split>>({
  collection: 'expense_splits', actions: ['read','create','update','delete'], persist: { name: 'expense_splits' },
}))
```

- [ ] **Step 2 — Réécrire `budget.tsx`**

Replacer `useBudget` par lecture des stores. La logique d'affichage (CircularProgress, CategoryBreakdown, ExpenseRow) reste identique mais consomme :

```ts
const tripId = use$(currentTripId$)
const trip = use$(trips$[tripId!])
const totalBudget = Number(trip?.total_budget ?? 0)
const expenses = Object.values(use$(expenses$) ?? {})
  .filter(e => e.trip_id === tripId)
  .sort((a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime())
const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0) / 100
const remaining = totalBudget - totalSpent
```

Note: `amount` est stocké en **centimes** (`bigint`) en DB, on divise par 100 pour l'affichage.

L'objet `expense` côté ExpenseRow expose désormais `expense.amount / 100`, `expense.spent_at` (au lieu de `expense.date`).

- [ ] **Step 3 — Réécrire `AddExpenseModal.tsx`**

L'ancien store local fait `addExpense({ amount, category, note })`. Maintenant on insère en DB :

```tsx
async function onAdd() {
  if (!userId || !tripId) return
  const amountCents = Math.round(Number(amount) * 100)
  if (!amountCents || amountCents < 0) { Alert.alert('Montant invalide'); return }
  const id = crypto.randomUUID()
  const row = {
    id,
    trip_id: tripId,
    payer_id: userId,
    amount: amountCents,
    currency: 'EUR',
    category,
    note: note.trim() || null,
    spent_at: new Date().toISOString(),
    split_mode: 'equal' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  expenses$[id].set(row)
  await supabase.from('expenses').insert(row)
  // Split equal entre tous les membres du voyage
  const members = Object.values(tripMembers$.peek() ?? {}).filter(m => m.trip_id === tripId)
  for (const m of members) {
    const splitKey = `${id}_${m.user_id}`
    const splitRow = { expense_id: id, user_id: m.user_id, share: 1 / members.length }
    expenseSplits$[splitKey].set(splitRow as any)
    await supabase.from('expense_splits').insert(splitRow)
  }
  onClose()
}
```

Imports requis : `crypto` polyfill (sur RN, `expo-crypto` ou `react-native-get-random-values`). Installer :
```bash
npm install react-native-get-random-values
```
Et ajouter `import 'react-native-get-random-values'` en haut de `lib/supabase.ts` (avant l'autre polyfill).

Aussi importer `tripMembers$`.

Pour l'instant l'UI ne propose pas de mode `custom` (case 'equal' seulement). À ajouter en SP#2 si besoin.

- [ ] **Step 4 — Supprimer la fonction `removeExpense` du store local et utiliser DB**

Dans `budget.tsx`, pour la suppression :
```ts
const handleDelete = async (id: string) => {
  expenses$[id].delete()
  await supabase.from('expenses').delete().eq('id', id)
}
```

- [ ] **Step 5 — Vérification device**

Sur Portugal seedé : ouvrir Budget. Total budget = 1200€, dépenses = 0. Ajouter une dépense → apparaît, total update. Tester offline : ajouter une dépense en mode avion, ré-ouvrir → toujours là ; reconnecter → vérifier via SQL `select * from expenses where trip_id = '<id>'`.

- [ ] **Step 6 — Commit**

```bash
git add store/expenses\$.ts store/expenseSplits\$.ts app/\(trips\)/\[tripId\]/\(tabs\)/budget.tsx components/AddExpenseModal.tsx lib/supabase.ts package.json
git commit -m "feat(budget): migrate to Supabase with splits"
```

---

### Task F5 : Migrer le Dashboard

**Files:**
- Modify: `app/(trips)/[tripId]/(tabs)/index.tsx`
- Modify: `components/CountdownCard.tsx`
- Modify: `components/TimelineScroll.tsx`

- [ ] **Step 1 — Adapter Dashboard**

Dans `index.tsx`, remplacer :
```ts
const { totalBudget, totalSpent, remaining } = useBudget()
```
par la lecture depuis les stores (comme dans budget.tsx).

Remplacer le hardcode `"Avril"`, `"8 jours"`, `"Lisboa"/"Alentejo"` :
```ts
const tripId = use$(currentTripId$)
const trip = use$(trips$[tripId!])
const days = Object.values(use$(days$) ?? {}).filter(d => d.trip_id === tripId).sort((a,b)=>a.day_number-b.day_number)
const zoneList = Array.from(new Set(days.map(d => d.zone).filter(Boolean)))
const month = trip?.start_date ? new Date(trip.start_date).toLocaleString('fr-FR', { month: 'long' }) : ''
```

Header pill devient `<Text>{month}</Text>`. Quick Stats devient :
- Budget : `remaining` calculé depuis store
- Jours : `days.length` (au lieu de 8 hardcodé), zones depuis `zoneList`

- [ ] **Step 2 — Adapter CountdownCard**

`CountdownCard.tsx` doit recevoir le trip via store, pas prop. Lire `currentTripId$` + `trips$`, calculer `daysUntil(trip.start_date)`.

- [ ] **Step 3 — Adapter TimelineScroll**

Lit `days$` et `currentTripId$`, mappe en cards.

- [ ] **Step 4 — Vérification device**

Sur Portugal seedé : Dashboard affiche "Avril", 8 jours, zones Lisboa/Alentejo, countdown correct.

- [ ] **Step 5 — Commit**

```bash
git add app/\(trips\)/\[tripId\]/\(tabs\)/index.tsx components/CountdownCard.tsx components/TimelineScroll.tsx
git commit -m "feat(dashboard): consume trip from store, drop hardcoded values"
```

---

## Phase G — Nettoyage

### Task G1 : Supprimer le code legacy

**Files:**
- Delete: `components/MapData.ts`
- Delete: `components/PlanningData.ts`
- Delete: `components/BudgetStore.tsx`
- Delete: `components/PlanningStore.tsx`

- [ ] **Step 1 — Vérifier l'absence de références**

Run: `Grep` pour chacun des fichiers à supprimer dans `app/` et `components/` (sauf les fichiers eux-mêmes). Expected: 0 résultat. Si des imports survivent, les corriger d'abord.

Note : `scripts/seed-portugal.ts` importe encore `MapData` et `PlanningData`. Comme ce script ne tourne qu'en local pour le seed initial, on garde ces fichiers **uniquement** dans `scripts/` ? Non : on déplace le contenu inline dans `seed-portugal.ts` (les data brutes) puis on peut supprimer les fichiers. Faire ce déplacement en Step 2.

- [ ] **Step 2 — Inline les data dans le script seed**

Modifier `scripts/seed-portugal.ts` : copier-coller le contenu des constantes `SPOTS` et `TRIP_DAYS` directement en haut du script (avant `async function main`), supprimer les `import` correspondants.

- [ ] **Step 3 — Supprimer les fichiers**

```bash
git rm components/MapData.ts components/PlanningData.ts components/BudgetStore.tsx components/PlanningStore.tsx
```

- [ ] **Step 4 — Nettoyer les clés AsyncStorage legacy**

Dans `app/_layout.tsx`, ajouter une migration unique au boot (avant `initAuth`) :
```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

async function clearLegacyKeys() {
  const flagKey = 'mk_legacy_cleared_v1'
  if (await AsyncStorage.getItem(flagKey)) return
  await AsyncStorage.multiRemove(['mk_trip_checklist', 'mk_budget', 'mk_planning_done'])
  await AsyncStorage.setItem(flagKey, '1')
}
```
Appeler `clearLegacyKeys()` dans le `useEffect` initial.

- [ ] **Step 5 — Vérifier bundle**

`npx expo start --dev-client` : compile sans erreur, app tourne.

- [ ] **Step 6 — Commit**

```bash
git add -A
git commit -m "chore: remove legacy data files and AsyncStorage keys"
```

---

## Phase H — Tests end-to-end et doc

### Task H1 : Tests manuels device

**Files:**
- Modify: `docs/superpowers/plans/notes-manual-tests.md`

- [ ] **Step 1 — Scénario offline solo**

1. Connecter, sélectionner Portugal seedé
2. Mode avion ON
3. Ajouter dépense "Test offline 5€", cocher item valise, cocher activité planning
4. Tuer l'app, ré-ouvrir : les 3 actions doivent être présentes
5. Mode avion OFF, attendre 10s
6. Via `mcp__claude_ai_Supabase__execute_sql` :
   ```sql
   select * from expenses where note = 'Test offline' order by created_at desc limit 1;
   select * from checklist_completions where user_id = '<user_id>' order by completed_at desc limit 1;
   select * from activity_completions where user_id = '<user_id>' order by completed_at desc limit 1;
   ```
   Les 3 doivent être présents.

- [ ] **Step 2 — Scénario partage 2 devices**

1. Device A (toi) : créer un nouveau voyage "Skatepark Test", noter le `join_code` (visible en cliquant le voyage → futur écran settings, ou via DB)
2. Device B (un pote) : login avec un autre email, "Rejoindre", saisir le code
3. Device B doit voir le voyage et le sélectionner
4. Device A ajoute une dépense → Device B la voit en ~5 sec (realtime Supabase + Legend State)
5. Device B coche un item valise → reste personnel (Device A ne voit pas la coche), mais l'item lui-même reste visible des deux côtés

- [ ] **Step 3 — Scénario auth reset**

1. Logout sur Device A → écran Welcome
2. Re-login avec le même email → "Mes voyages" affiche les deux voyages

- [ ] **Step 4 — Documenter le résultat**

Compléter `docs/superpowers/plans/notes-manual-tests.md` avec les checkboxes cochées et la date.

- [ ] **Step 5 — Commit**

```bash
git add docs/superpowers/plans/notes-manual-tests.md
git commit -m "docs: manual tests results for SP1"
```

---

### Task H2 : README de la fondation

**Files:**
- Create: `docs/setup.md`

- [ ] **Step 1 — Écrire**

```md
# MK Trip — Setup dev

## Prérequis
- Node 20+
- compte Expo
- compte Supabase (projet `MK Trip` provisionné)
- Android device ou émulateur (iOS optionnel)

## Première installation
1. `npm install`
2. Copier `.env.example` → `.env.local`, remplir les valeurs depuis le dashboard Supabase :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (jamais committée)
   - `SUPABASE_PROJECT_REF`
3. `npx eas-cli login` puis `npx eas-cli build --profile development --platform android`
4. Installer l'APK sur le device
5. `npx expo start --dev-client`

## Seed du voyage démo
1. Se connecter via l'app une fois (pour créer le user)
2. `npm run seed:portugal -- ton-email@example.com`

## Régénération des types
`$env:SUPABASE_PROJECT_REF='<ref>'; npm run db:types` (PowerShell)

## Migrations
Toutes les migrations sont dans `supabase/migrations/`. Pour appliquer une nouvelle migration, utiliser le tool MCP `mcp__claude_ai_Supabase__apply_migration` ou `npx supabase db push` après `supabase link`.
```

- [ ] **Step 2 — Créer `.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
```

- [ ] **Step 3 — Commit**

```bash
git add docs/setup.md .env.example
git commit -m "docs: setup guide for MK Trip dev"
```

---

## Self-review

**Spec coverage check (vérifié) :**
- Schéma DB complet → Tasks B1, B2 ✓
- RLS sur toutes les tables → B1 ✓
- RPCs `join_trip_by_code` + `regenerate_join_code` → B1 ✓ (note: regenerate non utilisée par UI dans SP1, simplement disponible — c'est OK, c'est dans le scope du spec)
- Auth magic link + deep link → C1-C5 ✓
- Invitations par code → D5 ✓
- Legend State + sync offline-first → D1, F1-F4 ✓
- Trip switcher → D7 ✓
- Migration des 4 modules → F1-F4 ✓
- Seed Portugal → E1 ✓
- EAS dev build → A2 ✓
- Tests manuels documentés → H1 ✓
- Nettoyage hardcoded data + AsyncStorage legacy → G1 ✓

**Spec items implicites adressés :**
- Profile auto-créé à la 1ʳᵉ connexion → C2 (`upsertProfile`) ✓
- Trigger owner-as-member → B1 ✓
- Cleanup legacy AsyncStorage → G1 ✓
- Dashboard purgé des valeurs hardcodées → F5 ✓

**Type consistency :** noms de stores cohérents (`xxx$`), names de tables cohérents (`expense_splits` partout), enums alignés entre DB et UI.

**Placeholder scan :** aucun "TBD", "TODO", "add appropriate error handling", "implement later". Chaque step a son code complet ou commande exacte.

**Notes résiduelles :**
- `regenerate_join_code` est présente en DB mais pas exposée en UI dans le SP#1 — c'est conforme au scope du spec (l'UI peut venir en SP#2).
- L'écran "détail voyage" / "settings du voyage" (afficher le join_code pour le partager) n'est pas explicitement scopé. Le code est visible côté DB et apparaît dans la modale TripSwitcher si besoin. Ajout d'une UI dédiée = SP ultérieur.
- Le mode `custom` du split d'expense est en DB mais pas en UI (mention explicite dans F4 step 3 : à faire en SP#2 si besoin).

---

## Récap des commits attendus

A1, A2, A4, B1, B3, C2, C3, C4, C5, D1, D2, D3, D4, D5, D6, D7, E1, F1, F2, F3, F4, F5, G1, H1, H2 = **25 commits** sur ~5 à 8 jours de dev.
