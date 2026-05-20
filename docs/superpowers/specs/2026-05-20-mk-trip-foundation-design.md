# MK Trip — Sous-projet 1 : Fondation multi-voyage (design)

Date : 2026-05-20
Statut : design validé, en attente de plan d'implémentation

## Contexte

L'app MK Trip est aujourd'hui une démo mono-voyage : toutes les données du voyage "Portugal Avril 2026" sont hardcodées dans `components/MapData.ts`, `components/PlanningData.ts`, `app/(tabs)/guide.tsx`. La persistance utilisateur (dépenses ajoutées, items cochés) passe par `AsyncStorage` sur le device.

L'objectif de MK Trip à terme est d'être une plateforme générique pour préparer des voyages atypiques (city break, road trip, voyage sportif, randonnée), multi-utilisateurs, avec partage entre amis. Le premier use case concret est un road trip skateparks d'une région à plusieurs.

Le sous-projet 1 pose la fondation technique pour cette vision : modèle data générique côté Supabase, authentification, multi-utilisateur avec partage par code voyage, sync offline-first, et migration des 4 modules existants (Budget, Planning, Map, Guide) vers cette fondation.

## Scope

### Inclus

- Schéma PostgreSQL complet : profiles, trips, trip_members, days, activities, activity_completions, spots, expenses, expense_splits, checklist_items, checklist_completions, guide_cards.
- Auth Supabase par magic link email + deep link de retour `mktrip://auth-callback`.
- Invitation de membres via code voyage court (format `MKT-A9F2`) partageable hors app, joinable via RPC sécurisée.
- RLS active sur toutes les tables (un user ne voit que les trips dont il est membre).
- Sync offline-first via Legend State v3 + plugin Supabase (SQLite local répliqué depuis Postgres).
- Migration de l'app Expo vers EAS dev build (sortie d'Expo Go nécessaire pour les modules natifs).
- Migration des 4 modules existants pour qu'ils consomment la DB au lieu des données hardcodées.
- Trip switcher dans l'UI permettant de basculer entre voyages.
- Script de seed `scripts/seed-portugal.ts` qui crée un voyage de démo identique à l'actuel pour validation.

### Hors scope (sous-projets ultérieurs)

- Stockage de billets / documents (PDF, photos) via Supabase Storage.
- OCR caméra (traduction d'images de menus, panneaux).
- Traduction conversation live (STT + traduction + TTS).
- Itinéraire optimisé entre spots.
- Intégration Revolut ou paiement.
- OAuth Google / Apple (magic link suffit pour le MVP).
- Templates de voyage préconfigurés (skatepark, surf, hike).
- Push notifications cross-user.
- Fallback web (l'app actuelle a un fallback web sur la Map, on accepte de le perdre temporairement).
- Tests automatisés (Jest, Detox). Tests manuels documentés à la place.

## Décisions architecturales

| Sujet | Choix | Motivation |
|---|---|---|
| Backend | Supabase Postgres | Déjà accessible, RLS native, bon DX. |
| Auth | Magic link email | Zéro friction MVP, pas de gestion mdp, OAuth ajouté plus tard. |
| Partage de voyage | Code voyage `MKT-XXXX` partageable | Marche en WhatsApp/SMS, ami sans email requis, code regenerable. |
| Sync data | Legend State v3 + plugin Supabase | Offline-first sans service tiers, DX excellente. |
| DB locale | SQLite via expo-sqlite | Embarqué Expo, suffisant pour notre volume. |
| Build pipeline | EAS dev build | Modules natifs (SQLite, deep links) sortent d'Expo Go. |
| Résolution conflits sync | Last-write-wins par `updated_at` | Acceptable pour ce use case, pas de transactions financières atomiques. |
| Région Supabase | `eu-west-3` (Paris) | Latence faible, conformité GDPR. |

## Schéma de données

Toutes les tables ont `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` géré par trigger `set_updated_at`.

### profiles

| Colonne | Type | Notes |
|---|---|---|
| id | uuid | = auth.users.id, FK cascade |
| display_name | text | obligatoire à l'inscription |
| avatar_url | text | nullable |

### trips

| Colonne | Type | Notes |
|---|---|---|
| owner_id | uuid | → profiles.id |
| name | text | "Road trip skatepark Sud" |
| destination | text | libre, "Portugal", "Sud-France" |
| start_date | date | nullable (voyage non daté possible) |
| end_date | date | nullable |
| trip_type | enum trip_type | city_break, road_trip, sport, hike, beach, other |
| currency | text default 'EUR' | code ISO 3 lettres |
| total_budget | numeric(12,2) | total prévu, optionnel |
| cover_color | text default '#FF6B4A' | hex pour l'UI |
| join_code | text unique not null | format `MKT-XXXX` |

Trigger `after insert on trips` : insère `trip_members (trip_id, owner_id, role='owner', joined_at=now())`.

### trip_members

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| user_id | uuid | → profiles.id cascade |
| role | enum member_role | owner, editor, viewer |
| joined_at | timestamptz | default now() |

PK composite (trip_id, user_id).

### days

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| day_number | int | 1..N, ordre dans le voyage |
| date | date | nullable |
| label | text | "Lisboa Day 1" |
| theme | text | "Découverte du centre" |
| zone | text | libre, "lisboa", "alentejo", "sud" |

Index unique (trip_id, day_number).

### activities

| Colonne | Type | Notes |
|---|---|---|
| day_id | uuid | → days.id cascade |
| time | time | HH:MM |
| title | text | obligatoire |
| subtitle | text | nullable |
| category | enum spot_category | food, culture, nightlife, nature, accommodation, activity, sport |
| position | int | ordre dans la journée |

### activity_completions

| Colonne | Type | Notes |
|---|---|---|
| activity_id | uuid | → activities.id cascade |
| user_id | uuid | → profiles.id cascade |
| completed_at | timestamptz | default now() |

PK composite (activity_id, user_id). Chacun coche pour soi.

### spots

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| name | text | |
| description | text | |
| category | enum spot_category | |
| zone | text | |
| lat | numeric(9,6) | |
| lng | numeric(9,6) | |
| price | text | "$$", "8-12€", nullable |
| tags | text[] | pour spécialisation : "bowl", "street", "indoor" pour skate |

### expenses

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| payer_id | uuid | → profiles.id, qui a payé |
| amount | bigint | en centimes pour éviter les floats |
| currency | text | code ISO |
| category | enum expense_category | food, transport, hotel, activity, drink, shopping, other |
| note | text | nullable |
| spent_at | timestamptz | default now() |
| split_mode | enum split_mode | equal, custom |

### expense_splits

| Colonne | Type | Notes |
|---|---|---|
| expense_id | uuid | → expenses.id cascade |
| user_id | uuid | → profiles.id cascade |
| share | numeric(8,4) | fraction (0..1) si equal, montant en centimes si custom |

PK composite (expense_id, user_id).

### checklist_items

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| label | text | |
| category | enum checklist_category | clothing, gear, docs, other |
| position | int | |

### checklist_completions

| Colonne | Type | Notes |
|---|---|---|
| item_id | uuid | → checklist_items.id cascade |
| user_id | uuid | → profiles.id cascade |
| completed_at | timestamptz | default now() |

PK composite. Chacun coche sa valise.

### guide_cards

| Colonne | Type | Notes |
|---|---|---|
| trip_id | uuid | → trips.id cascade |
| kind | enum guide_kind | danger, warning, info, weather, emergency, food |
| title | text | "Cannabis", "Météo Avril" |
| body | text | markdown léger |
| icon_name | text | mappé côté app vers lucide ("AlertTriangle", "Sun") |
| position | int | ordre d'affichage |

## Sécurité (RLS)

Helper SQL utilisé partout :

```sql
create function public.is_trip_member(t uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from trip_members
    where trip_id = t and user_id = auth.uid()
  )
$$;
```

Politiques par catégorie :

- **profiles** : tous peuvent lire (pour afficher les avatars/noms des co-voyageurs). Update/Delete : self only.
- **trips** : SELECT si `is_trip_member(id)`. INSERT si `auth.uid() = owner_id`. UPDATE si membre avec role in (owner, editor). DELETE si owner.
- **trip_members** : SELECT si `is_trip_member(trip_id)`. INSERT bloqué côté client (passe par RPC `join_trip_by_code`). UPDATE/DELETE : owner ou self (un user peut se retirer d'un voyage).
- **days, activities, spots, expenses, expense_splits, checklist_items, guide_cards** : toutes les opérations gated par `is_trip_member(trip_id)` (ou via la relation pour les tables enfants comme expense_splits → expenses → trip).
- **activity_completions, checklist_completions** : self only (chacun coche pour soi-même, on ne touche pas aux coches des autres).

## RPCs

### `join_trip_by_code(code text) returns uuid`

```sql
create function public.join_trip_by_code(code text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_trip_id uuid;
begin
  select id into v_trip_id from trips where join_code = code;
  if v_trip_id is null then
    raise exception 'TRIP_NOT_FOUND';
  end if;
  insert into trip_members (trip_id, user_id, role)
    values (v_trip_id, auth.uid(), 'editor')
    on conflict (trip_id, user_id) do nothing;
  return v_trip_id;
end;
$$;
```

### `regenerate_join_code(trip uuid) returns text`

Vérifie `auth.uid()` = owner du trip, génère un nouveau code unique, update, retourne le code.

### `generate_join_code() returns text`

Helper interne : `'MKT-' || upper(substring(md5(random()::text) for 4))`, retry si collision (rarissime).

## Architecture app

### Arbre cible

```
app/
├─ _layout.tsx                  ← auth gate, deep link handler, providers
├─ (auth)/
│  ├─ welcome.tsx
│  └─ check-email.tsx
├─ (trips)/
│  ├─ index.tsx                 ← liste "Mes voyages"
│  ├─ new.tsx                   ← modal créer voyage
│  ├─ join.tsx                  ← modal saisir code
│  └─ [tripId]/
│     ├─ _layout.tsx            ← charge le trip, set currentTripId$
│     └─ (tabs)/
│        ├─ _layout.tsx
│        ├─ index.tsx           ← Dashboard
│        ├─ budget.tsx
│        ├─ map.tsx
│        ├─ planning.tsx
│        └─ guide.tsx
└─ auth-callback.tsx

lib/
├─ supabase.ts
├─ legend.ts
└─ types.ts                     ← supabase gen types

store/
├─ auth$.ts
├─ currentTrip$.ts
├─ trips$.ts, tripMembers$.ts
├─ days$.ts, activities$.ts, completions$.ts
├─ spots$.ts
├─ expenses$.ts, expenseSplits$.ts
├─ checklist$.ts
└─ guideCards$.ts

scripts/
└─ seed-portugal.ts

supabase/
└─ migrations/
   └─ 20260520_initial.sql
```

### Pattern store Legend State

```ts
// store/expenses$.ts
import { observable } from '@legendapp/state'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { supabase } from '../lib/supabase'

export const expenses$ = observable(
  syncedSupabase({
    supabase,
    collection: 'expenses',
    select: (from) => from.select('*'),
    actions: ['read', 'create', 'update', 'delete'],
    realtime: { schema: 'public' },
    persist: { name: 'expenses' },
    changesSince: 'last-sync',
    fieldUpdatedAt: 'updated_at',
    fieldCreatedAt: 'created_at',
  })
)
```

### Pattern consommation

```ts
const tripId = use$(currentTripId$)
const expenses = Object.values(use$(expenses$) ?? {}).filter(e => e.trip_id === tripId)

// Ajouter une dépense (optimistic, sync auto)
expenses$[id].set({ id, trip_id: tripId, payer_id: userId, amount: 1500, ... })
```

### Routage et navigation

`app/_layout.tsx` redirige :
- session === null → `/(auth)/welcome`
- session && trips.length === 0 → `/(trips)`
- session && currentTripId → `/(trips)/[tripId]/(tabs)`

`currentTripId$` est persisté localement pour reprendre sur le dernier voyage au lancement.

Trip switcher : un composant dans le header du Dashboard ouvre une bottom sheet listant les trips, avec boutons "Nouveau" et "Rejoindre".

### Valeurs dynamiques remplaçant le hardcodé

L'écran Dashboard ne contient plus les strings "MK Trip", "Avril", "Portugal", "8 jours", "Lisboa", "Alentejo". Elles sont dérivées du trip courant : `trip.name`, `format(trip.start_date, 'MMM')`, `trip.destination`, `daysUntilStart(trip)`, `uniq(days.map(d => d.zone))`.

## Plan de migration

Chaque phase produit un commit qui laisse l'app runnable.

**Phase A — Infra (0 changement visible)**
- Création du projet Supabase MK Trip en `eu-west-3` via MCP
- Install : `@supabase/supabase-js`, `@legendapp/state`, `expo-secure-store`, `expo-sqlite`
- `eas init` puis `eas build --profile development` pour Android et iOS
- `.env.local` (gitignored) avec `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publique par design, sécurité = RLS), et `SUPABASE_SERVICE_ROLE_KEY` (jamais préfixée `EXPO_PUBLIC_`, jamais committée, utilisée uniquement par le script seed local)
- `lib/supabase.ts` créé mais inutilisé
- Plugins Expo ajoutés dans `app.json`

**Phase B — Schema DB**
- Une migration `supabase/migrations/20260520_initial.sql` qui crée tous les enums, tables, triggers, helper `is_trip_member`, RLS policies et RPCs
- Types TypeScript régénérés via `supabase gen types typescript --project-id <ref> > lib/types.ts`, exposé en script `package.json` (`"db:types"`)
- Aucun changement app encore

**Phase C — Auth gate**
- Écran welcome (champ email, bouton "Recevoir le lien")
- Écran check-email
- `auth-callback.tsx` qui parse le deep link et établit la session
- `app/_layout.tsx` redirige si pas de session
- Profile auto-créé à la première connexion (`upsert profiles`)
- Schéma `mktrip://` déclaré dans `app.json`, URL redirect ajoutée dans Supabase Auth settings
- Les écrans existants continuent d'afficher les données hardcodées Portugal

**Phase D — Trips list & switcher**
- `(trips)/index.tsx` liste les voyages
- Modal `new.tsx` (form name, dates, type, budget, devise, couleur) → insert
- Modal `join.tsx` (input code) → appelle `join_trip_by_code` RPC
- `currentTripId$` observable persisté via le storage SQLite de Legend State (clé `currentTripId`)
- Logique de routage post-login via `<Redirect>` conditionnels dans `app/_layout.tsx` et `app/(trips)/_layout.tsx` (pattern Expo Router, pas de navigation impérative depuis un layout)
- Trip switcher composant ajouté au Dashboard

**Phase E — Seed Portugal**
- `scripts/seed-portugal.ts` : connect Supabase avec service role, créer un trip "Portugal Avril 2026" pour l'utilisateur courant, transformer `MapData.SPOTS` en lignes `spots`, `PlanningData.TRIP_DAYS` en `days` + `activities`, le `CHECKLIST_ITEMS` du guide en `checklist_items`, les cards hardcodées du guide en `guide_cards`
- Lancement manuel : `npx tsx scripts/seed-portugal.ts`
- Idempotent (upsert par natural key)

**Phase F — Migration module par module**

Ordre : Guide → Map → Planning → Budget. Du moins risqué au plus complexe.

Pour chaque module :
- Remplacer les imports hardcodés (`MapData`, `PlanningData`, `CHECKLIST_ITEMS`) par les hooks Legend State
- Supprimer les state locaux et AsyncStorage redondants
- Vérifier que l'écriture passe par les stores
- Commit dédié

**Phase G — Nettoyage**
- Suppression de `components/MapData.ts`, `components/PlanningData.ts`, `components/BudgetStore.tsx`, `components/PlanningStore.tsx`
- Suppression des clés legacy `AsyncStorage` (`mk_trip_checklist`, etc.)
- `NotificationService.ts` est conservé mais branché sur le currentTrip

**Phase H — Tests offline et multi-device**
- Build dev sur device physique
- Tests offline : mode avion, ajout dépense, relance app, vérification persistance
- Tests sync : retour réseau, vérification que les changes remontent
- Tests partage : 2 devices, création trip, partage code, vérification visibilité réciproque
- Documentation des résultats dans le PR

## Données locales actuelles

Décision : les données dans `AsyncStorage` (dépenses ajoutées en local, checklist cochée) sont **jetées** au passage. Pas de script de migration AsyncStorage → DB. L'app étant encore en dev, aucune donnée critique n'est saisie. Le seed Portugal donne un trip de démo équivalent.

## Risques et mitigations

| Risque | Mitigation |
|---|---|
| Legend State v3 + plugin Supabase encore jeune, doc parfois lacunaire | PoC isolé sur table `trips` avant de tout brancher. Fallback : TanStack Query + sync custom léger (~3 jours de retard). |
| Build EAS échoue sur combo Expo SDK 55 + Reanimated 4.2 | Combo officiellement supporté. Si KO, downgrade Reanimated à 3.x. |
| Deep link magic link ne revient pas dans l'app sur device | Tester dès la Phase C sur device réel, vérifier `Linking.getInitialURL()` + listener. |
| RLS trop restrictive masque les propres data de l'user | Tests SQL en mode `set local role authenticated; set local "request.jwt.claims" = '{"sub":"…"}'`. Documenté. |
| Conflits sync à 2 devices simultanés | Last-write-wins par `updated_at`. Acceptable pour ce use case. Les inserts ont des UUIDs distincts donc pas d'écrasement. |
| Perte du voyage Portugal seedé pendant le dev | Script seed idempotent (upsert par natural key). Re-runnable. |
| Sortie d'Expo Go casse le fallback web Map | Accepté. La version web sera reprise dans un sous-projet ultérieur. |

## Definition of Done

Côté utilisateur :
- Login magic link, déconnexion, profile basique fonctionnels
- CRUD voyages (créer, rejoindre par code, switcher)
- 4 modules (Budget, Planning, Map, Guide) opérationnels et reliés au voyage actif
- Budget supporte le partage payer + bénéficiaires (split equal ou custom)
- Coches Planning et Checklist persistées par user
- Mode offline complet sur device
- Voyage Portugal Avril 2026 pré-seedé accessible

Côté technique :
- Projet Supabase créé, migration SQL versionnée
- RLS active et testée sur toutes les tables
- RPCs `join_trip_by_code` et `regenerate_join_code` testées
- Stores Legend State pour chaque table, hooks dans les écrans
- EAS dev build configuré Android et iOS
- Types TS générés depuis Supabase
- Tests manuels documentés (offline, sync, partage 2 devices)

## Estimation effort

Indicatif : 5 à 8 jours de dev focused. Risques temps majeurs : Phase C (deep link sur device réel) et Phase F-Budget (UX des splits).
