# MK Trip — Sous-projet 2 : Pivot PWA Next.js + Refonte UI (design)

Date : 2026-05-20
Statut : design rédigé, en attente de revue Florian
Prérequis : sous-projet 1 livré (cf. `2026-05-20-mk-trip-foundation-design.md`)
Source design : handoff Claude Design `docs/design/claude-design-handoff/`
Source pivot : memo `project_pivot_pwa.md`

## Contexte

Deux décisions convergent et fusionnent en un seul sous-projet :

1. **Pivot stack vers PWA web.** Après ~23 commits Expo/RN, Florian tranche : MK Trip sera une **PWA Next.js** que les users installeront via "Ajouter à l'écran d'accueil". Stack cible : Next.js App Router + Tailwind + shadcn/ui + Supabase + Vercel. Tout le frontend Expo (app/, components/, store/ Legend State, EAS dev build) est abandonné — il reste accessible en git history.

2. **Refonte UI éditoriale.** Florian a produit via Claude Design un handoff complet (`docs/design/claude-design-handoff/`) : moodboard, tokens, 5 écrans mobile, variantes par type de voyage, dark mode, desktop. Direction : photo plein cadre, sable/charbon, accent vif par type, typo Bricolage Grotesque + Geist + Geist Mono.

Les deux sont indissociables. Le handoff Claude Design produit déjà du HTML/CSS/JS — il se transpose naturellement en Next.js + Tailwind + shadcn. Le pivot stack est donc **synchrone** avec la refonte UI : on ne remet pas l'app en marche en RN avant de la refondre.

**Ce qui reste de la foundation :** projet Supabase (Postgres + Auth + RLS + RPCs), migration SQL `20260520_initial.sql`, le seed Portugal (à adapter au nouveau frontend), les décisions de modèle data, l'authentification magic link (à reporter en cookies SSR côté Next.js).

## Scope

### Inclus

**Pivot stack :**
- Bootstrap Next.js 16 App Router dans le repo actuel (remplace `app/`, `components/`, `store/` Expo).
- Suppression progressive des paquets Expo/RN du `package.json`. Git history préserve l'ancien code.
- Configuration Tailwind 3 + shadcn/ui (init + composants nécessaires).
- Auth Supabase via `@supabase/ssr` (cookies, compatible RSC + Route Handlers).
- Manifest PWA + service worker (via `@serwist/next` ou `next-pwa`) pour "Add to Home Screen".
- Déploiement Vercel (déjà lié).
- Variables d'env propagées (Vercel envs : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

**Design system :**
- Tokens couleurs (6 accents par type de voyage + neutres light/dark, sémantiques).
- Typographie via `next/font/google` : Bricolage Grotesque + Geist + Geist Mono.
- Spacing 4pt, radius 8/12/24, élévations subtiles.
- shadcn theme + `globals.css` paramétrés avec les tokens.
- Composants shadcn primaires installés et stylés : `Button`, `Sheet`, `Dialog`, `Tabs`, `Avatar`, `Card`, `Input`, `Checkbox`, `Progress`, `DropdownMenu`, `Skeleton`.

**Les 5 écrans pixel-perfect du handoff :**
1. **Home / Dashboard** — hero photo full-bleed, TripSwitcher, carrousel "à venir", stats crew, quick actions.
2. **Map** — Mapbox GL JS, pins custom par catégorie, route en pointillés, bottom sheet draggable (shadcn `Sheet` + drag handle custom).
3. **Planning** — week strip + timeline verticale avec rail accent.
4. **Budget / Split** — "Qui doit quoi à qui" + tiles catégories + dépenses récentes + modal full-screen "Ajouter une dépense".
5. **Guide / Carnet** — tiles infos pratiques + checklist matos + notes + placeholder lexique.

**Multi-voyage et variantes :**
- Routing : `/(auth)/...`, `/trips/[tripId]/...` (App Router).
- Bottom tab nav custom (5 onglets, persistante mobile) + rail gauche desktop.
- Mapping 6 `trip_type` → 6 accents : skate orange, rando vert, surf bleu, city terracotta, road jaune-sable, other charbon.
- Photos hero : pack par défaut embarqué par `trip_type` (3 photos par type) + upload utilisateur via Supabase Storage bucket `trip-covers`.

**Responsive + dark :**
- Mobile-first (≥ 375), responsive desktop (≥ 1024).
- Layouts desktop dédiés Home et Map (rail gauche + main). Planning, Budget, Guide : largeur max centrée.
- Dark mode complet, switch automatique via `prefers-color-scheme` + toggle manuel optionnel via shadcn `theme-provider`.

**Data + sync (offline-first) :**
- Initial paint via Server Components (auth check + premier query Supabase serveur).
- Cache local complet en IndexedDB via **Dexie.js** : toutes les rows des tables critiques (`trips`, `trip_members`, `days`, `activities`, `activity_completions`, `expenses`, `expense_splits`, `checklist_items`, `checklist_completions`, `spots`, `guide_cards`) du trip courant + des autres trips de l'utilisateur (lectures rapides au switch).
- Hydratation : au boot, l'app lit depuis Dexie d'abord (instant), puis revalide via Supabase en arrière-plan.
- Mutations client-side via `@supabase/supabase-js` direct (RLS gère la sécurité) **enveloppées dans une sync queue Dexie** : chaque mutation = entrée de queue avec `op` (insert/update/delete), `table`, `payload`, `created_at`, `status` (pending/sent/failed), `depends_on` (ID parent côté queue pour les insertions enfants type expense_splits qui dépendent d'un expense créé offline).
- À la reconnexion : flush ordonné de la queue, retry exponentiel sur erreurs réseau, marque les conflits LWW par `updated_at` (last write wins, idem foundation), surface les erreurs RLS à l'UI ("cette dépense a été supprimée par un autre membre").
- TanStack Query pour le cache mémoire en session + invalidation après mutations (couche au-dessus de Dexie).
- Supabase Realtime branché sur `trips`, `expenses`, `activities`, `checklist_completions` pour la sync multi-user ; les events Realtime upsert directement dans Dexie.
- Optimistic updates sur toutes les mutations (toggle checklist, mark activity done, add expense, etc.) — le UI lit toujours Dexie, donc l'optimistic est l'écriture Dexie elle-même.
- Service worker (`@serwist/next`) cache les routes + assets + photos hero. L'app reste utilisable même au cold start sans réseau.

**Migrations et seed :**
- Migration DB `20260520_refonte_hero.sql` : ajout `trips.hero_image_url`, `trips.hero_image_uploaded`. Bucket `trip-covers` créé via SQL.
- Seed `scripts/seed-portugal.ts` adapté à `hero_image_url`.
- Nouveau seed `scripts/seed-sudouest.ts` (road trip skate) pour valider 2 accents extrêmes side-by-side.

### Hors scope

- Modal "Add expense" avec split custom complexe (split equal + payer suffit pour cette refonte, custom shares à reporter).
- Drag-to-reorder du Planning (`dnd-kit` est compatible si on l'ajoute plus tard).
- Vote crew sur les spots (bouton "Y aller" présent visuellement, branchement DB plus tard).
- Traduction caméra / live (placeholder Guide uniquement).
- OAuth Google / Apple (magic link suffit).
- Tests automatisés (Vitest/Playwright à introduire plus tard).
- Notifications push (web push à brancher dans un sous-projet ultérieur).
- iOS native wrap (Capacitor/Tauri) — PWA pure pour l'instant.
- Sync offline sophistiquée (CRDT, conflict resolution custom).

## Décisions architecturales validées

| Sujet | Choix | Motivation |
|---|---|---|
| Framework | Next.js 16 App Router | Match parfait avec sortie Claude Design (HTML/CSS/JS → JSX naturel), SSR, Vercel-native. |
| UI lib | shadcn/ui + Radix | Composants accessibles, customisables (on possède le code), bonne intégration Tailwind. |
| Styling | Tailwind 3 | Standard, tokens exposés via `tailwind.config.ts`, classes utilitaires partout. |
| Auth | Supabase magic link via `@supabase/ssr` | Cookies-based, compatible RSC + Route Handlers + middleware. Sécurité côté serveur. |
| Data fetch initial | Server Components | Auth check + premier render data côté serveur (rapide, SEO, partage). |
| Data fetch client | `@supabase/supabase-js` + TanStack Query | Mutations + realtime, cache client. |
| Realtime | Supabase Realtime | Déjà inclus, sync multi-user via channels par `trip_id`. |
| State global UI | Zustand | `currentTripId`, drawer state, toast, etc. Léger, RSC-compatible. |
| Cache offline | Dexie.js (IndexedDB) | Cache complet du trip + sync queue avec dépendances. Pas de PowerSync/Replicache (overkill pour notre volume). |
| Résolution conflits sync | Last-write-wins par `updated_at` | Aligné avec foundation. Mutations enfants attendent leur parent côté queue. |
| Map | Mapbox GL JS | Tiles vectoriels, custom style possible (matche le ton éditorial du handoff), free tier suffit. |
| Map fallback gratuit | MapLibre GL JS (drop-in si Florian refuse Mapbox) | Fork open-source de Mapbox GL JS, même API. |
| Storage photos | Supabase Storage bucket `trip-covers` | Aligné avec le reste du backend. |
| PWA | `@serwist/next` | Manifest + service worker minimal, "Add to Home" cross-browser. `next-pwa` non maintenu activement, on prend Serwist. |
| Déploiement | Vercel | Déjà lié, CI/CD natif Next.js. |
| Mapping `trip_type` → accent | 6 → 6 (DS étendu) | Aucune migration DB nécessaire. `road_trip` et `other` reçoivent leur propre accent. |
| Photos hero | Pack par défaut + upload optionnel | Onboarding sans friction + personnalisation. |
| Phasage | Top-down — Home d'abord après bootstrap stack | Validation ADN rapide avant d'étendre. |
| Branche | Worktree `pivot-pwa-refonte-ui` | Travail isolé, on n'expose pas `main` à un état intermédiaire. |
| Compatibilité React | React 19 (Next.js 16 default) | Aligné avec ce que produit Claude Design. |

## Design system

### Tokens couleurs (source de vérité : `lib/design/tokens.ts`)

**Neutres light :**
```
paper          #F2EDE3
paperDeep      #E8E0CF
sand           #DDD2BD
ink            #1C1A17
inkSoft        #3D362C
inkMute        #7A6F60
hairline       rgba(28,26,23,.08)
hairlineStrong rgba(28,26,23,.16)
```

**Neutres dark :**
```
paperDark          #16140F
paperDarkDeep      #1F1C16
sandDark           #2A251D
inkDark            #F2EDE3
inkSoftDark        #CFC6B4
inkMuteDark        #8B8273
hairlineDark       rgba(242,237,227,.10)
hairlineStrongDark rgba(242,237,227,.20)
```

**6 accents (1 par `trip_type`) :**

| Type DB | Accent | base | deep | tint (light) | tintDark |
|---|---|---|---|---|---|
| `sport` | skate (orange brûlé) | `#C75A20` | `#8C3A0F` | `#F4E2D2` | `#3A1E0F` |
| `hike` | rando (vert mousse) | `#5A6E3E` | `#3A4925` | `#E5E6D6` | `#1F2515` |
| `beach` | surf (bleu profond) | `#1E3A5C` | `#0F2238` | `#DCE3EB` | `#10202F` |
| `city_break` | city (terracotta) | `#B14E32` | `#7A3018` | `#F1DDD2` | `#341A11` |
| `road_trip` | road (jaune-sable brûlé) | `#C99748` | `#8A6722` | `#F1E2C1` | `#3A2E14` |
| `other` | neutre (charbon profond) | `#3D362C` | `#1C1A17` | `#E1DACD` | `#2A251D` |

**Sémantiques :**
```
danger #A33A2A
ok     #5A6E3E
```

### Typographie

Chargement via `next/font/google` (auto-self-hosted par Next, zéro requête tierce au runtime).

```ts
// app/fonts.ts
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'

export const display = Bricolage_Grotesque({
  subsets: ['latin'], variable: '--font-display', weight: ['500', '700', '800'],
  style: ['normal', 'italic']
})
export const body = Geist({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] })
export const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600'] })
```

| Rôle | Famille / Variable | Poids / Style | Usage |
|---|---|---|---|
| Display | `--font-display` | 800, letter-spacing -0.025em, line-height 0.95 | Hero titles, gros chiffres |
| Display italic | `--font-display` italic | 500 | Accent éditorial ("Jour 3 / 7") |
| Heading | `--font-display` | 700, letter-spacing -0.02em | Card titles |
| Body | `--font-body` | 400/500 | Texte courant |
| Mono | `--font-mono` | 400/600, font-variant-numeric tabular | Tous les chiffres |
| Eyebrow | `--font-mono` | 500, 10px, letter-spacing 0.14em, uppercase | Labels de section |

### Spacing, radius, élévations

- **Spacing** : grille 4pt (Tailwind default suffit).
- **Radius** : `rounded-xs` (4), `rounded-sm` (8), `rounded-md` (12), `rounded-lg` (24), `rounded-pill` (999). Étendu dans `tailwind.config.ts`.
- **Shadows** :
  - `shadow-flat` — `0 1px 2px rgba(0,0,0,.06)`
  - `shadow-card` — `0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)`
  - `shadow-sheet` — `0 4px 12px rgba(0,0,0,.10), 0 16px 32px rgba(0,0,0,.08)`

### Iconographie

- `lucide-react` (version web, déjà disponible) stroke 1.75 pour la majorité.
- Pictos custom aplats pour les 6 types : `skateboard`, `peak`, `wave`, `van`, `road`, `compass`. Composant `<TripIcon type={trip_type} />`.

### Util `accentFor(trip_type)`

```ts
// lib/design/accent.ts
export const ACCENT_BY_TYPE = {
  sport: tokens.skate,
  hike: tokens.rando,
  beach: tokens.surf,
  city_break: tokens.city,
  road_trip: tokens.road,
  other: tokens.neutral,
} as const

export const accentFor = (t: Database['public']['Enums']['trip_type']) =>
  ACCENT_BY_TYPE[t] ?? ACCENT_BY_TYPE.other
```

Inline styles sur les couleurs accent dynamiques (Tailwind ne génère pas les classes dynamiques à la volée — alternative `tailwind-merge` + safelist trop verbeuse). Tailwind sert pour neutres + structure + spacing.

## Schéma de données — delta

### Migration `20260520_refonte_hero.sql`

```sql
alter table trips
  add column hero_image_url text,
  add column hero_image_uploaded boolean default false;

-- Bucket
insert into storage.buckets (id, name, public) values ('trip-covers', 'trip-covers', true);

-- Policies
create policy "trip_covers_member_write" on storage.objects
  for all using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_public_read" on storage.objects
  for select using (bucket_id = 'trip-covers');
```

Path convention : `trip-covers/{trip_id}/{uuid}.jpg`.

Côté client : compression à 1600px max + qualité 0.8 via Canvas API + `createImageBitmap` (pas d'`expo-image-manipulator`, c'est du web).

### Pack de photos par défaut

18 photos embarquées en `public/heroes/{type}/{1..3}.jpg`. Source CC0/Unsplash relicensed, vérifiées et hébergées en local.

`lib/design/hero.ts` :
```ts
export function defaultHeroFor(tripId: string, type: TripType): string {
  // Choix stable par trip_id (hash % 3) pour ne pas que la photo change à chaque render
  const idx = hashCode(tripId) % 3
  return `/heroes/${type}/${idx + 1}.jpg`
}
```

| type | 3 photos couvrant |
|---|---|
| sport | skatepark béton, action skate, road trip van |
| hike | crête montagne, sentier altitude, lac alpin |
| beach | vague, planche surf, plage longue |
| city_break | miradouro, tram, rue pavée |
| road_trip | route désertique, sunset highway, van profil |
| other | paysage neutre, route ouverte, ciel ouvert |

## Architecture Next.js

### Arbre cible

```
app/
├─ layout.tsx                      ← fonts, providers (TanStack Query, theme), html lang
├─ globals.css                     ← @tailwind base/components/utilities + CSS vars tokens
├─ not-found.tsx
├─ (auth)/
│  ├─ welcome/page.tsx             ← email input + bouton magic link
│  ├─ check-email/page.tsx
│  └─ callback/route.ts            ← Route Handler qui finalise la session cookie
├─ trips/
│  ├─ layout.tsx                   ← auth gate (redirect /welcome si pas de session)
│  ├─ page.tsx                     ← liste "Mes voyages" (RSC : query Supabase serveur)
│  ├─ new/page.tsx                 ← modal full-screen "Nouveau voyage"
│  ├─ join/page.tsx                ← modal "Rejoindre par code"
│  └─ [tripId]/
│     ├─ layout.tsx                ← charge le trip, set Zustand currentTripId, nav (bottom mobile / rail desktop)
│     ├─ page.tsx                  ← Home / Dashboard (RSC + client carousel)
│     ├─ map/page.tsx
│     ├─ planning/page.tsx
│     ├─ budget/page.tsx
│     ├─ guide/page.tsx
│     └─ settings/page.tsx         ← (optionnel — upload cover, regenerate join_code)
└─ api/
   └─ healthz/route.ts             ← optionnel, pour Vercel

components/
├─ design/
│  ├─ Hero.tsx
│  ├─ TripSwitcher.tsx
│  ├─ BottomTab.tsx                ← mobile (md:hidden)
│  ├─ SideRail.tsx                 ← desktop (md:flex)
│  ├─ AvatarStack.tsx
│  ├─ TripIcon.tsx
│  ├─ Eyebrow.tsx
│  ├─ DSText.tsx                   ← <Display>, <DisplayItalic>, <Heading>, <Body>, <Mono>
│  └─ MapPin.tsx
│
├─ home/
│  ├─ UpcomingCarousel.tsx
│  ├─ UpcomingCard.tsx             ← variantes : next-spot / expense / weather
│  ├─ CrewStats.tsx
│  └─ QuickActions.tsx
│
├─ map/
│  ├─ MapView.tsx                  ← Mapbox GL JS wrapper (client-only)
│  ├─ MapSheet.tsx                 ← shadcn Sheet customisé (bottom mobile / side desktop)
│  └─ SpotListItem.tsx
│
├─ planning/
│  ├─ WeekStrip.tsx
│  ├─ Timeline.tsx
│  └─ TimelineEvent.tsx
│
├─ budget/
│  ├─ DebtFlow.tsx
│  ├─ CategoryTiles.tsx
│  ├─ ExpenseRow.tsx
│  └─ AddExpenseDialog.tsx          ← shadcn Dialog full-screen mobile
│
├─ guide/
│  ├─ InfoTiles.tsx
│  ├─ ChecklistGroup.tsx
│  └─ CrewNote.tsx
│
└─ ui/                              ← shadcn primitives (généré par CLI)

lib/
├─ supabase/
│  ├─ client.ts                    ← Browser client (createBrowserClient)
│  ├─ server.ts                    ← Server client (createServerClient avec cookies())
│  ├─ middleware.ts                ← refresh session cookie au passage
│  └─ types.ts                     ← supabase gen types
├─ design/
│  ├─ tokens.ts
│  ├─ accent.ts
│  ├─ hero.ts
│  └─ fonts.ts                     ← export des next/font instances
├─ queries/                        ← TanStack Query keys + fetchers (lecture Dexie + revalidation Supabase)
│  ├─ trips.ts
│  ├─ days.ts
│  ├─ activities.ts
│  ├─ spots.ts
│  ├─ expenses.ts
│  ├─ checklist.ts
│  └─ guide.ts
├─ db/                              ← couche offline-first
│  ├─ schema.ts                    ← Dexie schema (tables miroir Postgres)
│  ├─ index.ts                     ← export instance Dexie
│  ├─ hydrate.ts                   ← pull initial / refresh depuis Supabase
│  ├─ realtime.ts                  ← branchement Supabase Realtime → Dexie upsert
│  ├─ queue.ts                     ← sync queue : enqueue, flush, depends_on
│  └─ mutations.ts                 ← wrappers typés (createExpense, toggleChecklist, etc.) — écrivent Dexie d'abord, queue ensuite
├─ stores/
│  ├─ currentTrip.ts               ← Zustand
│  └─ ui.ts                        ← Zustand : drawer, toast, etc.
│  └─ syncStatus.ts                ← Zustand : online/offline, queue length, last sync
└─ utils/
   ├─ join-code.ts
   ├─ split-debt.ts                ← calcul "qui doit quoi à qui"
   └─ image-resize.ts              ← Canvas-based, pour upload cover

middleware.ts                       ← Next.js middleware : refresh Supabase session cookies sur chaque request

public/
├─ heroes/{sport,hike,beach,city_break,road_trip,other}/[1..3].jpg
├─ manifest.json
├─ icons/                          ← PWA icons 192, 512, maskable
└─ sw.js                           ← service worker (généré par @serwist/next)

supabase/
└─ migrations/
   ├─ 20260520_initial.sql         ← existante
   └─ 20260520_refonte_hero.sql    ← nouvelle

scripts/
├─ seed-portugal.ts                ← adapté hero_image_url
└─ seed-sudouest.ts                ← nouveau (skate)
```

### Fichiers existants : sort

| Path existant | Devenir |
|---|---|
| `app/` (expo-router) | Supprimé. Le nouveau `app/` est Next.js App Router. |
| `components/` (existant) | Supprimé. Refait depuis zéro dans la nouvelle structure. |
| `store/` (Legend State) | Supprimé. Remplacé par Zustand + TanStack Query + Supabase Realtime. |
| `lib/` (existant) | Audit ligne à ligne. La plupart à recréer côté Next.js. |
| `index.ts`, `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`, `app.json`, `global.css` | Supprimé. |
| `dist/` | Supprimé (build Expo). Le `.next/` Next.js prend le relais. |
| `assets/` | Audit : icônes app à reconvertir en PWA icons (`public/icons/`), splash à retirer. |
| `package.json` | Réécrit. Plus de paquets Expo, ajout Next.js + shadcn deps. |
| `tsconfig.json` | Réécrit aux conventions Next.js + path alias `@/*`. |
| `supabase/` | **Conservé tel quel.** Migrations restent valides. Nouvelle migration ajoutée. |
| `scripts/seed-portugal.ts` | Conservé, légèrement adapté pour `hero_image_url`. |
| `docs/` | Conservé. |
| `.env.local` | Renommé : `EXPO_PUBLIC_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, idem pour anon key. Service role inchangé. |

### Auth pattern (Next.js + Supabase SSR)

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const store = await cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  })
}

// app/trips/layout.tsx
import { redirect } from 'next/navigation'
export default async function Layout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')
  return <>{children}</>
}
```

`middleware.ts` racine refresh la session cookie sur chaque request (pattern Supabase officiel).

### Magic link callback

```ts
// app/(auth)/callback/route.ts
import { NextResponse } from 'next/server'
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/trips', req.url))
}
```

URL redirect ajoutée dans Supabase Auth settings : `https://{vercel-domain}/callback`.

### Data fetching pattern

**Initial paint (Server Component) :**
```tsx
// app/trips/[tripId]/page.tsx
export default async function HomePage({ params }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase.from('trips').select('*').eq('id', tripId).single()
  return <HomeClient initialTrip={trip} />
}
```

**Client-side queries + realtime :**
```tsx
// components/home/UpcomingCarousel.tsx (client)
'use client'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function UpcomingCarousel({ tripId }) {
  const { data } = useQuery({
    queryKey: ['activities', tripId, 'today'],
    queryFn: () => supabase.from('activities').select(...).eq(...),
  })

  useEffect(() => {
    const ch = supabase.channel(`trip:${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `trip_id=eq.${tripId}` }, () => queryClient.invalidateQueries({ queryKey: ['activities', tripId] }))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [tripId])
  ...
}
```

### PWA — manifest + service worker

`public/manifest.json` :
```json
{
  "name": "MK Trip",
  "short_name": "MK Trip",
  "start_url": "/trips",
  "display": "standalone",
  "background_color": "#F2EDE3",
  "theme_color": "#1C1A17",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Service worker via `@serwist/next` : runtime caching des routes principales + assets statiques. Pas de cache des API Supabase (RLS-sensible).

## Phasage — top-down

Branche worktree `pivot-pwa-refonte-ui`. Chaque phase = commit runnable.

### Phase 1 — Bootstrap Next.js + DS + Dexie

**Sortie :** Next.js démarre, fonts chargées, tokens exposés, shadcn initialisé, couche Dexie + sync queue minimale opérationnelle. Aucun écran métier encore implémenté, juste une placeholder `/trips`.

**1.a — Cleanup Expo :**
- Déplacement de `app/`, `components/`, `store/`, `index.ts`, `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`, `app.json`, `global.css`, `dist/` dans `_legacy/`.
- Le dossier `_legacy/` sert de référence visuelle pendant Phase 1 puis est **supprimé à la fin de Phase 1** (git history préserve). À partir de Phase 2, plus aucun fichier legacy dans le working tree.

**1.b — Bootstrap Next.js + shadcn :**
- `npx create-next-app@latest` overlay sur le repo.
- Suppression des dépendances Expo/RN du `package.json`. Ajout `next`, `@supabase/ssr`, `@tanstack/react-query`, `zustand`, `dexie`, `dexie-react-hooks`, `@serwist/next`, `next-themes`, `clsx`, `tailwind-merge`, `lucide-react`, `mapbox-gl`, `react-map-gl`, `vaul`.
- `npx shadcn@latest init` (base color : `Stone` qui matche le sable, on override ensuite).
- `lib/design/{tokens.ts, accent.ts, hero.ts, fonts.ts}` créés.
- `tailwind.config.ts` écrit avec les tokens.
- `app/globals.css` avec les CSS vars `--font-*` + thème dark mode.
- `app/layout.tsx` avec les `next/font` + providers (TanStack Query, shadcn theme).
- `middleware.ts` Supabase configuré.
- `lib/supabase/{client,server,middleware}.ts` écrits.
- `.env.local` renommé pour Next.js (variables `NEXT_PUBLIC_*`).
- Vercel : link et premier deploy preview pour valider le pipeline.

**1.c — Couche Dexie + sync queue minimale :**
- `lib/db/schema.ts` : Dexie schema avec stores miroir des tables Supabase critiques. Version 1 simple.
- `lib/db/index.ts` : instance Dexie singleton, init dans le provider client.
- `lib/db/hydrate.ts` : `hydrateTrip(tripId)` qui pull toutes les tables liées à ce trip (depuis Supabase) et upsert dans Dexie. Appelé à chaque switch de trip + au boot.
- `lib/db/queue.ts` : table `sync_queue` Dexie avec champs `id, op, table, payload, depends_on, created_at, status, attempts, last_error`. Fonctions `enqueue(op)`, `flush()`, `retry()`.
- `lib/db/mutations.ts` : wrappers typés `createExpense`, `toggleChecklistItem`, etc. Écrivent dans Dexie (optimistic) + push dans la queue. La queue flush automatiquement quand `navigator.onLine === true`.
- `lib/db/realtime.ts` : channel Supabase Realtime par trip, upsert direct dans Dexie. Ignore les changements provenant de soi-même (filtré par `payload.commit_timestamp` < `last_push`).
- `lib/stores/syncStatus.ts` (Zustand) : `online`, `queueLength`, `lastSync`, `lastError`. UI bandeau si `queueLength > 0` ou `online === false`.

**1.d — Page placeholder :**
- `/trips/page.tsx` (RSC) : SELECT depuis Supabase côté serveur pour le premier paint.
- `/trips/[tripId]/page.tsx` (RSC) : auth check + hydrate Dexie côté client + render placeholder "Home Sud-Ouest". Test end-to-end : auth → RLS → Dexie hydraté → UI affiche le voyage.

**Validation :** ouvrir `localhost:3000`, se connecter via magic link, voir la liste des trips (Portugal seedé), basculer en mode offline (devtools), recharger : l'app fonctionne, Dexie sert les données. Tokens visibles dans devtools. `_legacy/` supprimé du working tree.

### Phase 2 — Home complet (variante skate, light)

**Sortie :** écran Home pixel-perfect du handoff sur `/trips/[tripId]`, validé sur mobile et desktop dev.

- `app/trips/[tripId]/layout.tsx` charge le trip, set `currentTripId` Zustand.
- `app/trips/[tripId]/page.tsx` (RSC) query trip + days + activities aujourd'hui + expenses récentes côté serveur.
- Implémentation **inline** d'abord (un seul fichier client `HomeClient.tsx`) pour valider l'ADN, comme le faisait `screens.jsx`.
- Bottom tab + side rail nav construits dans le `[tripId]/layout.tsx`.
- Photo hero : un asset Sud-Ouest skate seedé pour les tests (CC0).
- Données "À venir" / "Le crew en chiffres" : dérivées du Supabase quand dispo, hardcodées sinon avec `// TODO`.

**Validation :** screenshots Chrome devtools iPhone 15 Pro + 1280×800. Comparé au `HomeScreen` skate du handoff. Approbation Florian avant Phase 3.

### Phase 3 — DS extract

**Sortie :** Home cassé en composants réutilisables dans `components/design/` + `components/home/`. Pas de régression visuelle.

- Refactor `HomeClient` inline → composants nommés avec API claire.
- Définition de la prop `tone` / `accent` partout (préparation dark + variantes).
- Stories optionnelles dans `app/dev/components/page.tsx` (gallery devboard, dev-only).

### Phase 4 — Map, Planning, Budget, Guide (light, skate)

**Sortie :** les 4 écrans restants pixel-perfect du handoff.

Ordre : **Map → Planning → Guide → Budget**.

- **Map** : intégration Mapbox GL JS via `react-map-gl/mapbox` (client only, dynamic import). Pins custom DOM-overlay. Bottom sheet via shadcn `Sheet` modifié pour drag (lib `vaul` qui s'intègre nativement). Style Mapbox custom matchant les couleurs sable du handoff (style `light-v11` overridé OU style maison).
- **Planning** : `WeekStrip` + `Timeline` purement Tailwind. Pas de drag-to-reorder pour l'instant.
- **Guide** : tiles + checklist. shadcn `Checkbox` stylé.
- **Budget** : `DebtFlow` custom (SVG `<path>` pour les flèches), `CategoryTiles` grid, `ExpenseRow` 3 états, `AddExpenseDialog` (shadcn `Dialog` plein écran mobile via `vaul-style` ou custom).

Pour chaque écran : un commit, validation visuelle, push Vercel preview pour partage.

### Phase 5 — Variantes par trip_type + photos hero

**Sortie :** 6 accents fonctionnels, pack de photos par défaut, upload Supabase Storage opérationnel.

- Migration DB `20260520_refonte_hero.sql` appliquée via MCP.
- 18 photos ajoutées à `public/heroes/`.
- `lib/design/hero.ts` finalisé avec `defaultHeroFor()` stable.
- Modal "Nouveau voyage" enrichi : sélecteur de hero (3 options par type + bouton "Upload une photo") via input file → `lib/utils/image-resize.ts` → upload Storage.
- `<TripIcon type={trip_type} />` étendu aux 6 types.
- `scripts/seed-sudouest.ts` créé : un voyage skate complet avec activities, spots, expenses, checklist, guide_cards.

**Validation :** screenshots des 6 variantes du Home côte à côte (Portugal city, Sud-Ouest skate, GR20 rando fictif, etc.). Upload de photo testé : photo persiste après reload.

### Phase 5.5 — Offline-first robustness

**Sortie :** sync queue durcie, dépendances entre mutations gérées, conflits LWW remontés à l'UI, tests offline approfondis sur les 5 écrans.

- Sync queue : enrichissement des `depends_on` pour les cas réels (créer expense puis splits du même expense, créer day puis activities, etc.). Les enfants attendent que le parent ait reçu son `id` serveur réel avant d'être flushés. Mapping `temp_id → server_id` géré dans la queue.
- Retry policy : exponentiel (1s, 2s, 4s, 8s, max 30s), abandon après 5 tentatives avec entrée dans `lastError` + bandeau UI "1 modification en erreur, voir détails".
- Vue diagnostique offline : `/trips/[tripId]/settings/sync` qui liste la queue, les erreurs, bouton "Forcer le flush", bouton "Annuler une mutation".
- Conflict resolution UX : si une mutation locale échoue parce que l'entité a été supprimée côté serveur, on surface dans un toast : "Cette dépense a été supprimée par Théo. Ta modification a été annulée." Pour les conflits d'`updated_at` (LWW), pas de surface UI, on remplace silencieusement (déjà comporte`ment LWW).
- Upload de photo offline : binary blob mis en queue Dexie (table dédiée `pending_uploads` pour ne pas saturer `sync_queue`). Flush au retour réseau.
- Tests offline scénarios :
  - Mode avion → créer dépense → relancer app → relancer réseau → vérifier sync.
  - 2 devices simultanés en ligne → créer dépense sur device A, voir apparaître sur device B en < 2s (Realtime).
  - Device A offline crée day + activities → device B en ligne supprime le day → device A revient en ligne → conflit géré (toast).
  - Cold start avec service worker, sans réseau → app utilisable en lecture sur le trip actif.

**Validation :** scénarios documentés exécutés sur 2 devices physiques (iOS + Android Chrome). Résultats consignés dans le PR.

### Phase 6 — Dark mode + responsive desktop + PWA

**Sortie :** dark mode complet, desktop layouts Home et Map, PWA installable.

- shadcn `<ThemeProvider>` (basé sur `next-themes`) activé dans `app/layout.tsx`. Tous les composants supportent `tone` (déjà préparé).
- Layouts desktop spécifiques :
  - Home : `md:grid md:grid-cols-[240px_1fr]` (rail + main), hero 320px height fixe, body en `md:grid-cols-[1.4fr_1fr]`.
  - Map : `md:grid md:grid-cols-[1fr_360px]` (map + side panel filtres).
  - Planning, Budget, Guide : largeur max `md:max-w-[720px] md:mx-auto`, pas de refonte structurelle.
- `@serwist/next` configuré : manifest, service worker, precaching des assets, runtime caching des routes `/trips/*` (NetworkFirst).
- Test "Add to Home Screen" sur iOS Safari et Android Chrome.
- Lighthouse PWA audit : score ≥ 90.
- Branding manifest finalisé (theme_color, background_color, icons générés via `pwa-asset-generator`).

**Validation :** dark sur mobile + desktop, vue 1280 Home et Map matchent les exports du handoff, app installable et lance en mode standalone.

## Risques et mitigations

| Risque | Mitigation |
|---|---|
| `npx create-next-app` overlay sur repo Expo casse des fichiers | On déplace l'ancien code dans `_legacy/` au début de Phase 1, on bootstrap Next.js propre, puis on supprime `_legacy/` à la fin (git history préserve). |
| Mapbox GL JS coûteux à grande échelle | Free tier : 50k loads/mois (suffit pour MK Trip MVP). Si dépassement, swap vers MapLibre GL JS — même API, drop-in. |
| `vaul` (lib drag sheet) ne supporte pas tous les cas du handoff | Fallback : sheet shadcn standard avec scroll, drag-to-close uniquement. Plus tard, custom drag avec `framer-motion`. |
| Supabase magic link redirect ne marche pas en dev local | Configurer `http://localhost:3000/callback` dans Supabase Auth Redirect URLs en plus du domaine Vercel. |
| Tailwind ne génère pas les classes accent dynamiques | Inline styles via `MK.skate.base` etc. pour les accents. Tailwind sert pour neutres + structure + spacing uniquement. |
| Service worker cache stale après deploy Vercel | `@serwist/next` gère le versioning + `skipWaiting`. Test sur preview avant prod. |
| RLS + Server Components : `auth.getUser()` doit être appelé pour chaque RSC sensible | Centralisé dans `app/trips/layout.tsx` qui redirige si pas d'user. Les RSC enfants assument que l'auth a déjà été checkée. |
| Mapping classes Tailwind `text-mono` etc. depuis fonts CSS vars | shadcn theme JSON paramétré avec `var(--font-display)` etc. `tailwind.config.ts` expose `fontFamily.display: ['var(--font-display)']`. |
| Upload photos via Canvas API échoue sur Safari iOS < 16 | Détection feature, fallback en upload brut sans resize. |
| Modal full-screen sur mobile vs Dialog desktop centré | shadcn `Dialog` accepte `className` — on conditionne `inset-0` mobile vs `inset-1/2 -translate-1/2` desktop. |
| Perte du seed Portugal pendant le port | `scripts/seed-portugal.ts` est idempotent (upsert par natural key). Re-runnable après chaque flush. |
| Dexie schema bump casse les caches existants | Versioning Dexie strict avec migrations idempotentes (`db.version(2).stores(...).upgrade(tx => ...)`). Au pire on `db.delete()` et on re-hydrate depuis Supabase (perte de la queue uniquement, gérable en demandant à l'user de revenir online avant l'update). |
| Mutations enfants flushées avant que le parent ait son `id` serveur | Champ `depends_on` dans la queue + mapping `temp_id → server_id` populé au flush du parent. Les enfants attendent. |
| Realtime echo : on reçoit nos propres mutations en retour | Filtrage par `payload.commit_timestamp` vs `last_push_at` côté client. Sinon on dédoublonnerait nos propres insertions. |
| Quota IndexedDB plein (rare, ~50% du disque libre) | Détection `navigator.storage.estimate()`, fallback en mode lecture-seule + notification user. Cas extrême, peu probable pour notre volume. |

## Definition of Done

Côté utilisateur :
- App ouvrable sur `mk-trip.vercel.app` (ou domaine custom).
- "Add to Home Screen" sur iOS Safari et Android Chrome installe l'app comme PWA standalone.
- Login magic link, déconnexion fonctionnels via cookies SSR.
- CRUD voyages (créer, rejoindre par code, switcher) opérationnels.
- 5 écrans (Home, Map, Planning, Budget, Guide) pixel-perfect du handoff Claude Design en light + dark.
- Bottom tab mobile + side rail desktop, navigation fluide.
- Création d'un voyage : 6 types disponibles, 3 photos par défaut sélectionnables, upload custom optionnel.
- Map interactive (Mapbox), pins par catégorie, bottom sheet draggable mobile, side panel desktop.
- Sync multi-user via Supabase Realtime sur les modifs critiques (expenses, activities, checklist).
- Voyage Portugal seedé visible + voyage Sud-Ouest skate visible côte à côte (validation 2 accents).
- App utilisable **complètement hors-ligne** : lecture des trips déjà hydratés, écritures mises en file et flushées au retour réseau (incluant upload de photos).
- Bandeau UI quand offline ou queue non vide. Vue diagnostique `/settings/sync` pour inspecter les mutations en attente.

Côté technique :
- Repo migré : aucun import `expo-*`, `react-native-*`, `@legendapp/state` ne reste.
- `package.json` propre, paquets Expo supprimés, Next.js 16 + shadcn + deps Tailwind installés.
- `next.config.ts` configuré (PWA, images Supabase Storage domain whitelisted, `experimental: { typedRoutes: true }` si désiré).
- Tokens dans `lib/design/tokens.ts`, fonts via `next/font`, `tailwind.config.ts` cohérent.
- Auth Supabase SSR fonctionnelle (cookies, middleware refresh, RLS server-side).
- TanStack Query installé, queries client + Supabase Realtime branchés.
- Mapbox GL JS configuré (token Vercel env).
- Migration DB `20260520_refonte_hero.sql` appliquée, bucket `trip-covers` créé avec RLS.
- 18 photos hero embarquées en `public/heroes/`.
- Manifest PWA + service worker via `@serwist/next` fonctionnels (Lighthouse PWA ≥ 90).
- Déploiement Vercel automatique, env vars configurées.
- Couche offline-first : Dexie schema + hydrate + sync queue + Realtime → Dexie + mutations typées dans `lib/db/`.
- Vue diagnostique `/trips/[tripId]/settings/sync` opérationnelle.
- Tests manuels documentés dans le PR (auth, multi-voyage, sync, RLS, PWA install, dark, desktop, **scénarios offline Phase 5.5**).

## Estimation effort

Indicatif : **10 à 15 jours** de dev focused.

Découpe :
- Phase 1 (bootstrap Next.js + DS + Dexie base) — 2 jours (inclut cleanup Expo, setup shadcn, auth SSR, couche offline initiale, Vercel pipeline)
- Phase 2 (Home complet) — 1.5 jour (validation ADN incluse)
- Phase 3 (DS extract + mutations typées) — 0.75 jour
- Phase 4 (4 écrans restants) — 3 jours (Map 1, Planning 0.75, Guide 0.5, Budget 0.75)
- Phase 5 (variantes + photos + upload offline-aware) — 1.75 jour
- Phase 5.5 (offline robustness : dépendances, retry, conflicts, tests 2 devices) — 1.5 à 2 jours
- Phase 6 (dark + desktop + PWA) — 2 jours (PWA setup + Lighthouse audit)

Risques temps majeurs : Phase 1 (cleanup Expo + setup auth SSR + Vercel pipeline + Dexie bootstrap), Phase 4-Map (Mapbox + sheet drag), Phase 5.5 (cas tordus des dépendances entre mutations enfants/parents et conflits Realtime echo), Phase 6-PWA (service worker, tests cross-browser install).

Merge dans `main` : **unique en fin de Phase 6**, via PR globale depuis le worktree `pivot-pwa-refonte-ui`. `main` reste sur l'état foundation (Expo) jusqu'au merge final pour garder un état stable d'où relancer si on doit pivoter encore.
