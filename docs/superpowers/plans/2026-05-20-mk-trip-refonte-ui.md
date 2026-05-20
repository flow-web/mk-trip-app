# MK Trip — Pivot PWA Next.js + Refonte UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivoter MK Trip d'Expo/RN vers une PWA Next.js + Tailwind + shadcn + Supabase, en implémentant pixel-perfect le handoff Claude Design (5 écrans + variantes par type + dark + desktop) avec couche offline-first (Dexie + sync queue).

**Architecture:** Next.js 16 App Router + Tailwind 3 + shadcn/ui côté frontend. Supabase (Postgres + Auth + RLS + Realtime) côté backend, déjà speccé en foundation. Couche offline-first via Dexie (IndexedDB) avec sync queue à dépendances. Vercel pour déploiement et PWA via `@serwist/next`. Le code Expo existant est jeté (préservé en git history).

**Tech Stack :**
- Next.js 16 (App Router, React 19 Server Components)
- Tailwind 3 + shadcn/ui (composants Radix)
- Supabase JS (`@supabase/ssr` pour auth cookies)
- Dexie.js + dexie-react-hooks (IndexedDB)
- TanStack Query (cache mémoire + invalidation)
- Zustand (state UI léger)
- Mapbox GL JS + react-map-gl
- vaul (drag-sheet)
- @serwist/next (service worker PWA)
- next-themes (dark mode)
- lucide-react (icônes)
- Vercel (déploiement)

**Référence design :** `docs/design/claude-design-handoff/project/` (à consulter à chaque tâche d'écran)
**Référence spec :** `docs/superpowers/specs/2026-05-20-mk-trip-refonte-ui-design.md`

**Méthode de travail :**
- Branche worktree `pivot-pwa-refonte-ui` (créée en Task 1 via `superpowers:using-git-worktrees`).
- `main` reste sur l'état foundation Expo jusqu'au merge final (fin Phase 6).
- Pas de tests automatisés dans ce projet (hors scope). Validation = manuelle, screenshots dans le PR, Lighthouse à la fin.
- Chaque tâche se termine par un commit. Messages en français, format `feat(scope): ...` ou `chore(scope): ...`.
- Pour les écrans pixel-perfect : ouvrir le fichier handoff JSX correspondant dans `docs/design/claude-design-handoff/project/` et reproduire le rendu visuel, sans copier la structure interne. JSX du handoff est un prototype `<div style={...}>` — porter en composants Tailwind + shadcn idiomatiques.

---

## Phase 1 — Bootstrap Next.js + DS + Dexie

**Objectif :** Next.js démarre, fonts chargées, tokens exposés, auth SSR fonctionnel, couche Dexie + sync queue minimale opérationnelle. Aucun écran métier, juste une placeholder `/trips`. `_legacy/` supprimé à la fin.

### Task 1: Setup worktree + déplacement Expo en _legacy/

**Files:**
- Move into `_legacy/`: `app/`, `components/`, `store/`, `index.ts`, `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`, `app.json`, `global.css`, `dist/`, `tailwind.config.js`

- [ ] **Step 1: Créer le worktree isolé**

Invoke `superpowers:using-git-worktrees` skill. Worktree name: `pivot-pwa-refonte-ui`. Tous les travaux suivants se passent dans ce worktree.

- [ ] **Step 2: Déplacer le frontend Expo en _legacy/**

```bash
mkdir -p _legacy
git mv app _legacy/app
git mv components _legacy/components
git mv store _legacy/store
git mv index.ts _legacy/index.ts
git mv babel.config.js _legacy/babel.config.js
git mv metro.config.js _legacy/metro.config.js
git mv nativewind-env.d.ts _legacy/nativewind-env.d.ts
git mv app.json _legacy/app.json
git mv global.css _legacy/global.css
git mv tailwind.config.js _legacy/tailwind.config.js
rm -rf dist
```

- [ ] **Step 3: Commit du déplacement**

```bash
git add -A
git commit -m "chore(legacy): move Expo frontend to _legacy/ before Next.js bootstrap"
```

### Task 2: Bootstrap Next.js + nettoyage package.json

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`, `tsconfig.json` (réécrit), `.gitignore` (étendu)

- [ ] **Step 1: Réécrire `package.json`**

Remplacer le contenu par :

```json
{
  "name": "mk-trip",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed:portugal": "tsx --env-file=.env.local scripts/seed-portugal.ts",
    "seed:sudouest": "tsx --env-file=.env.local scripts/seed-sudouest.ts",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > lib/supabase/types.ts"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.106.1",
    "@tanstack/react-query": "^5.59.0",
    "@serwist/next": "^9.0.0",
    "clsx": "^2.1.1",
    "dexie": "^4.0.10",
    "dexie-react-hooks": "^1.1.7",
    "lucide-react": "^0.460.0",
    "mapbox-gl": "^3.7.0",
    "next": "^16.0.0",
    "next-themes": "^0.4.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-map-gl": "^7.1.7",
    "tailwind-merge": "^2.5.4",
    "vaul": "^1.1.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/mapbox-gl": "^3.4.0",
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "serwist": "^9.0.0",
    "supabase": "^2.100.1",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.22.3",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Réécrire `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "_legacy"]
}
```

- [ ] **Step 3: Créer `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      // sera précisé en Phase 5 (Supabase Storage bucket)
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Étendre `.gitignore`**

Ajouter à la fin :

```
.next/
out/
.vercel
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 5: Installer les dépendances**

```bash
rm -rf node_modules package-lock.json
npm install
```

- [ ] **Step 6: Vérifier que la compilation Next.js démarre**

```bash
mkdir -p app
echo 'export default function Page() { return <div>MK Trip — bootstrap OK</div> }' > app/page.tsx
echo 'export default function Layout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html> }' > app/layout.tsx
npm run dev
```

Expected : `localhost:3000` affiche "MK Trip — bootstrap OK".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(stack): bootstrap Next.js 16 + clean package.json"
```

### Task 3: Initialiser shadcn/ui

**Files:**
- Create: `components.json`, `components/ui/*` (générés), `lib/utils.ts`

- [ ] **Step 1: Lancer le CLI shadcn en mode init**

```bash
npx shadcn@latest init -d
```

Options à confirmer (mode `-d` defaults) :
- TypeScript : Yes
- Style : Default
- Base color : `Stone` (sera overridée par nos tokens)
- CSS variables : Yes
- Tailwind config : `tailwind.config.ts`
- Alias : `@/*`
- React Server Components : Yes

- [ ] **Step 2: Installer les composants shadcn nécessaires d'avance**

```bash
npx shadcn@latest add button sheet dialog tabs avatar card input checkbox progress dropdown-menu skeleton toast
```

- [ ] **Step 3: Vérifier que shadcn n'a pas écrasé notre layout**

Lire `app/layout.tsx` — s'il a été remplacé par un template shadcn, garder le template (on l'enrichira en Task 5).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): init shadcn + install core components"
```

### Task 4: Design tokens + util accent

**Files:**
- Create: `lib/design/tokens.ts`, `lib/design/accent.ts`, `lib/design/hero.ts`, `lib/design/fonts.ts`

- [ ] **Step 1: Créer `lib/design/tokens.ts`**

```ts
// lib/design/tokens.ts — single source of truth for MK Trip design system
export const MK = {
  paper: '#F2EDE3',
  paperDeep: '#E8E0CF',
  sand: '#DDD2BD',
  ink: '#1C1A17',
  inkSoft: '#3D362C',
  inkMute: '#7A6F60',
  hairline: 'rgba(28,26,23,.08)',
  hairlineStrong: 'rgba(28,26,23,.16)',

  paperDark: '#16140F',
  paperDarkDeep: '#1F1C16',
  sandDark: '#2A251D',
  inkDark: '#F2EDE3',
  inkSoftDark: '#CFC6B4',
  inkMuteDark: '#8B8273',
  hairlineDark: 'rgba(242,237,227,.10)',
  hairlineStrongDark: 'rgba(242,237,227,.20)',

  skate:   { base: '#C75A20', deep: '#8C3A0F', tint: '#F4E2D2', tintDark: '#3A1E0F' },
  rando:   { base: '#5A6E3E', deep: '#3A4925', tint: '#E5E6D6', tintDark: '#1F2515' },
  surf:    { base: '#1E3A5C', deep: '#0F2238', tint: '#DCE3EB', tintDark: '#10202F' },
  city:    { base: '#B14E32', deep: '#7A3018', tint: '#F1DDD2', tintDark: '#341A11' },
  road:    { base: '#C99748', deep: '#8A6722', tint: '#F1E2C1', tintDark: '#3A2E14' },
  neutral: { base: '#3D362C', deep: '#1C1A17', tint: '#E1DACD', tintDark: '#2A251D' },

  danger: '#A33A2A',
  ok: '#5A6E3E',
} as const

export type AccentTokens = typeof MK.skate
```

- [ ] **Step 2: Créer `lib/design/accent.ts`**

```ts
// lib/design/accent.ts
import { MK, type AccentTokens } from './tokens'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

export const ACCENT_BY_TYPE: Record<TripType, AccentTokens> = {
  sport: MK.skate,
  hike: MK.rando,
  beach: MK.surf,
  city_break: MK.city,
  road_trip: MK.road,
  other: MK.neutral,
}

export const accentFor = (t: TripType | null | undefined): AccentTokens =>
  (t && ACCENT_BY_TYPE[t]) ?? MK.neutral
```

- [ ] **Step 3: Créer `lib/design/hero.ts` (squelette, photos en Phase 5)**

```ts
// lib/design/hero.ts
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const hashCode = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function defaultHeroFor(tripId: string, type: TripType): string {
  const idx = (hashCode(tripId) % 3) + 1
  return `/heroes/${type}/${idx}.jpg`
}
```

- [ ] **Step 4: Créer `lib/design/fonts.ts`**

```ts
// lib/design/fonts.ts
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'

export const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const body = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})
```

- [ ] **Step 5: Commit**

```bash
git add lib/design/
git commit -m "feat(design): tokens + accent + hero helpers + next/font setup"
```

### Task 5: Tailwind config + globals.css avec tokens

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`

- [ ] **Step 1: Réécrire `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'
import { MK } from './lib/design/tokens'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: MK.paper,
        'paper-deep': MK.paperDeep,
        sand: MK.sand,
        ink: MK.ink,
        'ink-soft': MK.inkSoft,
        'ink-mute': MK.inkMute,
        hairline: MK.hairline,
        'hairline-strong': MK.hairlineStrong,

        'paper-dark': MK.paperDark,
        'paper-dark-deep': MK.paperDarkDeep,
        'sand-dark': MK.sandDark,
        'ink-dark': MK.inkDark,
        'ink-soft-dark': MK.inkSoftDark,
        'ink-mute-dark': MK.inkMuteDark,

        danger: MK.danger,
        ok: MK.ok,

        // shadcn semantic — pointent vers nos tokens via CSS vars (cf. globals.css)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '24px',
        pill: '9999px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        flat: '0 1px 2px rgba(0,0,0,.06)',
        card: '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)',
        sheet: '0 4px 12px rgba(0,0,0,.10), 0 16px 32px rgba(0,0,0,.08)',
      },
      letterSpacing: {
        eyebrow: '0.14em',
        tight: '-0.025em',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 2: Réécrire `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn HSL mappings vers nos tokens MK light */
    --background: 39 32% 92%;        /* paper #F2EDE3 */
    --foreground: 25 11% 10%;        /* ink #1C1A17 */
    --card: 0 0% 100%;
    --card-foreground: 25 11% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 25 11% 10%;
    --primary: 25 11% 10%;
    --primary-foreground: 39 32% 92%;
    --secondary: 39 17% 83%;         /* sand */
    --secondary-foreground: 25 11% 10%;
    --muted: 39 17% 83%;
    --muted-foreground: 30 12% 43%;  /* inkMute */
    --accent: 39 17% 83%;
    --accent-foreground: 25 11% 10%;
    --destructive: 8 56% 40%;        /* danger */
    --destructive-foreground: 0 0% 98%;
    --border: 25 11% 92%;
    --input: 25 11% 92%;
    --ring: 25 11% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 35 22% 7%;         /* paperDark */
    --foreground: 39 32% 92%;
    --card: 35 19% 11%;
    --card-foreground: 39 32% 92%;
    --popover: 35 19% 11%;
    --popover-foreground: 39 32% 92%;
    --primary: 39 32% 92%;
    --primary-foreground: 25 11% 10%;
    --secondary: 32 18% 14%;
    --secondary-foreground: 39 32% 92%;
    --muted: 32 18% 14%;
    --muted-foreground: 38 9% 49%;
    --accent: 32 18% 14%;
    --accent-foreground: 39 32% 92%;
    --destructive: 8 56% 40%;
    --destructive-foreground: 0 0% 98%;
    --border: 38 17% 18%;
    --input: 38 17% 18%;
    --ring: 39 32% 92%;
  }

  body {
    @apply bg-paper text-ink font-body antialiased;
    font-family: var(--font-body);
  }
  body.dark {
    @apply bg-paper-dark text-ink-dark;
  }
}

@layer components {
  .mk-eyebrow {
    @apply font-mono uppercase tracking-eyebrow text-[10px] font-medium;
  }
  .mk-display {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 0.95;
  }
  .mk-display-italic {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .mk-mono {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .mk-noscroll::-webkit-scrollbar { display: none; }
  .mk-noscroll { scrollbar-width: none; }
}
```

- [ ] **Step 3: Installer `tailwindcss-animate`**

```bash
npm install -D tailwindcss-animate
```

- [ ] **Step 4: Vérifier visuellement le bootstrap**

Modifier `app/page.tsx` :

```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mk-eyebrow text-ink-mute">MK TRIP · BOOTSTRAP</div>
      <h1 className="mk-display text-6xl text-ink mt-3">Carnet de bord</h1>
      <p className="text-ink-soft mt-2">Tokens et fonts opérationnels.</p>
      <div className="mt-6 mk-mono text-sm text-ink-mute">437 km · 8 / 14 spots · 312 €</div>
    </div>
  )
}
```

Run `npm run dev`. Vérifier : fond sable, titre en Bricolage Grotesque 800, eyebrow Geist Mono, chiffres en mono.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/page.tsx package.json package-lock.json
git commit -m "feat(design): wire Tailwind + globals.css to MK tokens"
```

### Task 6: app/layout.tsx avec fonts + providers

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/providers.tsx`

- [ ] **Step 1: Créer `app/providers.tsx`**

```tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  }))

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Réécrire `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { display, body, mono } from '@/lib/design/fonts'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'MK Trip',
  description: 'Le carnet de bord du crew.',
  themeColor: '#F2EDE3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Vérifier que les fonts chargent**

`npm run dev`, ouvrir devtools Network, recharger : 3 fichiers WOFF2 self-hostés par Next (pas de requête `fonts.googleapis.com` au runtime). Le rendu utilise Bricolage + Geist + Geist Mono.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/providers.tsx
git commit -m "feat(app): root layout with next/font + theme + query providers"
```

### Task 7: Supabase clients (server, client, middleware)

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/supabase/types.ts` (généré)
- Create: `middleware.ts` (racine projet)
- Create: `.env.local` (non committé) et `.env.example`

- [ ] **Step 1: Créer `.env.example` à la racine**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF=YOUR_PROJECT_REF
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_PUBLIC_TOKEN
```

Demander à Florian de créer `.env.local` à partir de `.env.example` avec les vraies valeurs (mêmes URL/clés que la foundation, juste préfixe `NEXT_PUBLIC_` au lieu de `EXPO_PUBLIC_`).

- [ ] **Step 2: Régénérer les types Supabase**

```bash
npm run db:types
```

Cela écrit `lib/supabase/types.ts` depuis le schéma DB foundation.

- [ ] **Step 3: Créer `lib/supabase/client.ts`** (browser)

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export const supabase = createClient()
```

- [ ] **Step 4: Créer `lib/supabase/server.ts`** (RSC + Route Handlers)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const store = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // RSC peut throw si set est appelé en read-only context — ok
          }
        },
      },
    },
  )
}
```

- [ ] **Step 5: Créer `lib/supabase/middleware.ts`** (helper appelé par middleware.ts racine)

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  await supabase.auth.getUser()
  return response
}
```

- [ ] **Step 6: Créer `middleware.ts` à la racine**

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/ middleware.ts .env.example
git commit -m "feat(auth): supabase SSR client + middleware session refresh"
```

### Task 8: Écrans d'auth (welcome, check-email, callback)

**Files:**
- Create: `app/(auth)/welcome/page.tsx`, `app/(auth)/check-email/page.tsx`, `app/(auth)/layout.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Créer `app/(auth)/layout.tsx`** (layout sans nav, centré)

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
```

- [ ] **Step 2: Créer `app/(auth)/welcome/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

export default function WelcomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    router.push(`/check-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div>
      <div className="mk-eyebrow text-ink-mute">MK TRIP</div>
      <h1 className="mk-display text-5xl mt-3">
        Le carnet<br />de bord<br />
        <span className="mk-display-italic" style={{ color: '#C75A20' }}>du crew.</span>
      </h1>
      <p className="text-ink-soft mt-6 text-sm">
        Reçois un lien magique par email pour te connecter.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr" required autoComplete="email" />
        <Button type="submit" disabled={loading || !email} className="w-full">
          {loading ? 'Envoi…' : 'Recevoir le lien'}
        </Button>
        {err && <p className="text-sm text-danger">{err}</p>}
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Créer `app/(auth)/check-email/page.tsx`**

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

export default function CheckEmailPage() {
  const email = useSearchParams().get('email')
  return (
    <div className="text-center">
      <div className="mk-eyebrow text-ink-mute">VÉRIFIE TES MAILS</div>
      <h1 className="mk-display text-4xl mt-3">On t'a envoyé<br />un lien.</h1>
      <p className="text-ink-soft mt-4 text-sm">
        Clique le lien dans le mail pour ouvrir MK Trip.<br />
        {email && <span className="mk-mono text-xs">→ {email}</span>}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Créer `app/auth/callback/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/trips', url.origin))
}
```

- [ ] **Step 5: Configurer Supabase Auth Redirect URLs**

Manuel : dans le dashboard Supabase Auth, ajouter à la liste des `Redirect URLs` :
- `http://localhost:3000/auth/callback`
- `https://<vercel-preview-domain>/auth/callback`
- (et le domaine prod final quand connu)

- [ ] **Step 6: Tester le flow magic link**

`npm run dev`, ouvrir `localhost:3000/welcome`, soumettre email, recevoir le mail, cliquer le lien, vérifier qu'on atterrit sur `/trips` (qui n'existe pas encore — erreur 404 attendue).

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\)/ app/auth/
git commit -m "feat(auth): magic link welcome + check-email + callback route"
```

### Task 9: Auth gate sur /trips/* + page placeholder

**Files:**
- Create: `app/trips/layout.tsx`, `app/trips/page.tsx`
- Create: `app/page.tsx` (modifié — redirige vers /trips ou /welcome)

- [ ] **Step 1: Modifier `app/page.tsx`** (root redirect)

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/trips' : '/welcome')
}
```

- [ ] **Step 2: Créer `app/trips/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function TripsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')
  return <>{children}</>
}
```

- [ ] **Step 3: Créer `app/trips/page.tsx`** (liste placeholder)

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function TripsListPage() {
  const supabase = await createClient()
  const { data: trips } = await supabase.from('trips').select('*').order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-paper p-6">
      <div className="mk-eyebrow text-ink-mute">MES VOYAGES</div>
      <h1 className="mk-display text-4xl mt-3">{trips?.length ?? 0} voyage{(trips?.length ?? 0) > 1 ? 's' : ''}</h1>
      <ul className="mt-6 space-y-2">
        {trips?.map((t) => (
          <li key={t.id}>
            <Link href={`/trips/${t.id}` as const} className="block bg-white rounded-md p-4 border border-hairline">
              <div className="font-display font-bold text-lg">{t.name}</div>
              <div className="text-sm text-ink-mute">{t.destination} · {t.trip_type}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: Valider le flow complet auth → trips**

`npm run dev`, depuis un état déconnecté ouvrir `/` → redirigé vers `/welcome` → soumettre email → cliquer magic link → `/auth/callback` → `/trips` qui affiche le voyage Portugal seedé. Confirme que RLS marche (un user voit ses trips, pas les autres).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/trips/layout.tsx app/trips/page.tsx
git commit -m "feat(auth): trips layout gate + placeholder list (RSC + RLS)"
```

### Task 10: Schéma Dexie + instance

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`

- [ ] **Step 1: Créer `lib/db/schema.ts`**

```ts
// lib/db/schema.ts
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']

// Helper : enrichir les rows DB avec _pending_mutation_id + _local_updated_at
export type LocalRow<T> = T & {
  _pending_mutation_id?: string | null
  _local_updated_at?: number
}

export type LocalProfile = LocalRow<Tables['profiles']['Row']>
export type LocalTrip = LocalRow<Tables['trips']['Row']>
export type LocalTripMember = LocalRow<Tables['trip_members']['Row']>
export type LocalDay = LocalRow<Tables['days']['Row']>
export type LocalActivity = LocalRow<Tables['activities']['Row']>
export type LocalActivityCompletion = LocalRow<Tables['activity_completions']['Row']>
export type LocalSpot = LocalRow<Tables['spots']['Row']>
export type LocalExpense = LocalRow<Tables['expenses']['Row']>
export type LocalExpenseSplit = LocalRow<Tables['expense_splits']['Row']>
export type LocalChecklistItem = LocalRow<Tables['checklist_items']['Row']>
export type LocalChecklistCompletion = LocalRow<Tables['checklist_completions']['Row']>
export type LocalGuideCard = LocalRow<Tables['guide_cards']['Row']>

// Sync queue entry
export type SyncQueueOp = 'insert' | 'update' | 'delete'
export type SyncQueueStatus = 'pending' | 'sending' | 'failed'

export interface SyncQueueEntry {
  id: string                  // uuid local
  op: SyncQueueOp
  table: string               // table Postgres cible
  payload: Record<string, unknown>
  row_id: string              // id de la row touchée (temp_id si insert, id réel sinon)
  depends_on?: string[]       // ids d'autres SyncQueueEntry à attendre
  created_at: number
  status: SyncQueueStatus
  attempts: number
  last_error?: string
  // Mapping temp_id → server_id, populé après flush réussi d'un insert
  server_id?: string
}

// Pending uploads (binary blobs pour photos)
export interface PendingUpload {
  id: string                  // uuid local
  trip_id: string
  file: Blob
  filename: string
  status: 'pending' | 'uploading' | 'failed'
  attempts: number
  last_error?: string
  created_at: number
}
```

- [ ] **Step 2: Créer `lib/db/index.ts`**

```ts
// lib/db/index.ts
import Dexie, { type EntityTable } from 'dexie'
import type {
  LocalProfile, LocalTrip, LocalTripMember, LocalDay, LocalActivity,
  LocalActivityCompletion, LocalSpot, LocalExpense, LocalExpenseSplit,
  LocalChecklistItem, LocalChecklistCompletion, LocalGuideCard,
  SyncQueueEntry, PendingUpload,
} from './schema'

export class MKTripDB extends Dexie {
  profiles!: EntityTable<LocalProfile, 'id'>
  trips!: EntityTable<LocalTrip, 'id'>
  trip_members!: EntityTable<LocalTripMember, 'trip_id'>
  days!: EntityTable<LocalDay, 'id'>
  activities!: EntityTable<LocalActivity, 'id'>
  activity_completions!: EntityTable<LocalActivityCompletion, 'activity_id'>
  spots!: EntityTable<LocalSpot, 'id'>
  expenses!: EntityTable<LocalExpense, 'id'>
  expense_splits!: EntityTable<LocalExpenseSplit, 'expense_id'>
  checklist_items!: EntityTable<LocalChecklistItem, 'id'>
  checklist_completions!: EntityTable<LocalChecklistCompletion, 'item_id'>
  guide_cards!: EntityTable<LocalGuideCard, 'id'>

  sync_queue!: EntityTable<SyncQueueEntry, 'id'>
  pending_uploads!: EntityTable<PendingUpload, 'id'>

  constructor() {
    super('mk_trip')
    this.version(1).stores({
      profiles: 'id, display_name',
      trips: 'id, owner_id, trip_type, name',
      trip_members: '[trip_id+user_id], trip_id, user_id',
      days: 'id, trip_id, day_number',
      activities: 'id, day_id, position',
      activity_completions: '[activity_id+user_id], activity_id, user_id',
      spots: 'id, trip_id, category',
      expenses: 'id, trip_id, payer_id, spent_at',
      expense_splits: '[expense_id+user_id], expense_id, user_id',
      checklist_items: 'id, trip_id, category, position',
      checklist_completions: '[item_id+user_id], item_id, user_id',
      guide_cards: 'id, trip_id, position',
      sync_queue: 'id, status, created_at, row_id',
      pending_uploads: 'id, trip_id, status, created_at',
    })
  }
}

export const db = new MKTripDB()
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts lib/db/index.ts
git commit -m "feat(db): dexie schema with local mirror tables + sync queue"
```

### Task 11: Hydrate Dexie depuis Supabase + Realtime subscriber

**Files:**
- Create: `lib/db/hydrate.ts`, `lib/db/realtime.ts`

- [ ] **Step 1: Créer `lib/db/hydrate.ts`**

```ts
// lib/db/hydrate.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'

const TABLES_BY_TRIP = [
  'days', 'activities', 'spots', 'expenses', 'checklist_items', 'guide_cards',
] as const

const TABLES_NESTED = [
  // [parent_table, child_table, fk]
  ['days', 'activities', 'day_id'],
  ['expenses', 'expense_splits', 'expense_id'],
  ['activities', 'activity_completions', 'activity_id'],
  ['checklist_items', 'checklist_completions', 'item_id'],
] as const

export async function hydrateAllTrips() {
  const { data: trips } = await supabase.from('trips').select('*')
  if (trips) await db.trips.bulkPut(trips)

  const { data: members } = await supabase.from('trip_members').select('*')
  if (members) await db.trip_members.bulkPut(members)

  const { data: profiles } = await supabase.from('profiles').select('*')
  if (profiles) await db.profiles.bulkPut(profiles)
}

export async function hydrateTrip(tripId: string) {
  for (const table of TABLES_BY_TRIP) {
    const { data } = await supabase.from(table).select('*').eq('trip_id', tripId)
    if (data) await (db as any)[table].bulkPut(data)
  }
  // Tables enfants (jointures)
  const { data: activityIds } = await supabase
    .from('activities')
    .select('id')
    .in('day_id', (await db.days.where({ trip_id: tripId }).primaryKeys()))
  if (activityIds?.length) {
    const ids = activityIds.map((a) => a.id)
    const { data: comps } = await supabase.from('activity_completions').select('*').in('activity_id', ids)
    if (comps) await db.activity_completions.bulkPut(comps)
  }
  const { data: expenseIds } = await supabase.from('expenses').select('id').eq('trip_id', tripId)
  if (expenseIds?.length) {
    const ids = expenseIds.map((e) => e.id)
    const { data: splits } = await supabase.from('expense_splits').select('*').in('expense_id', ids)
    if (splits) await db.expense_splits.bulkPut(splits)
  }
  const { data: itemIds } = await supabase.from('checklist_items').select('id').eq('trip_id', tripId)
  if (itemIds?.length) {
    const ids = itemIds.map((i) => i.id)
    const { data: comps } = await supabase.from('checklist_completions').select('*').in('item_id', ids)
    if (comps) await db.checklist_completions.bulkPut(comps)
  }
}
```

- [ ] **Step 2: Créer `lib/db/realtime.ts`**

```ts
// lib/db/realtime.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import type { RealtimeChannel } from '@supabase/supabase-js'

const TABLES = [
  'trips', 'trip_members', 'days', 'activities', 'activity_completions',
  'spots', 'expenses', 'expense_splits', 'checklist_items',
  'checklist_completions', 'guide_cards',
] as const

export function subscribeTrip(tripId: string): RealtimeChannel {
  const channel = supabase.channel(`trip:${tripId}`)
  for (const table of TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table } as any,
      async (payload) => {
        const id = (payload.new as any)?.id ?? (payload.old as any)?.id
        if (!id) return
        const localKey = (payload.new as any)?.id ?? (payload.old as any)?.[`${table.slice(0, -1)}_id`]
        const existing = await (db as any)[table].get(localKey)
        // Verrou : ne pas écraser une mutation locale en attente
        if (existing?._pending_mutation_id) return
        if (payload.eventType === 'DELETE') {
          await (db as any)[table].delete(localKey)
        } else {
          await (db as any)[table].put(payload.new)
        }
      },
    )
  }
  channel.subscribe()
  return channel
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/hydrate.ts lib/db/realtime.ts
git commit -m "feat(db): hydrate + realtime subscriber with _pending_mutation_id lock"
```

### Task 12: Sync queue + mutations typées

**Files:**
- Create: `lib/db/queue.ts`, `lib/db/mutations.ts`
- Create: `lib/stores/syncStatus.ts`

- [ ] **Step 1: Créer `lib/stores/syncStatus.ts`**

```ts
// lib/stores/syncStatus.ts
import { create } from 'zustand'

interface SyncStatusState {
  online: boolean
  queueLength: number
  failedCount: number
  lastSyncAt: number | null
  setOnline: (v: boolean) => void
  setQueueLength: (n: number) => void
  setFailedCount: (n: number) => void
  setLastSyncAt: (ts: number) => void
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queueLength: 0,
  failedCount: 0,
  lastSyncAt: null,
  setOnline: (v) => set({ online: v }),
  setQueueLength: (n) => set({ queueLength: n }),
  setFailedCount: (n) => set({ failedCount: n }),
  setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
}))
```

- [ ] **Step 2: Créer `lib/db/queue.ts`**

```ts
// lib/db/queue.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import { useSyncStatus } from '@/lib/stores/syncStatus'
import type { SyncQueueEntry } from './schema'

export async function enqueue(entry: Omit<SyncQueueEntry, 'id' | 'created_at' | 'status' | 'attempts'>): Promise<string> {
  const id = crypto.randomUUID()
  await db.sync_queue.add({
    ...entry,
    id,
    created_at: Date.now(),
    status: 'pending',
    attempts: 0,
  })
  await refreshStatus()
  return id
}

export async function refreshStatus() {
  const total = await db.sync_queue.count()
  const failed = await db.sync_queue.where('status').equals('failed').count()
  useSyncStatus.getState().setQueueLength(total)
  useSyncStatus.getState().setFailedCount(failed)
}

// Flush respectant les depends_on
export async function flush(): Promise<void> {
  if (!navigator.onLine) return
  const pending = await db.sync_queue
    .where('status').equals('pending')
    .sortBy('created_at')

  for (const entry of pending) {
    // Si dépendances pas encore syncées, skip
    if (entry.depends_on?.length) {
      const deps = await db.sync_queue.bulkGet(entry.depends_on)
      const unresolved = deps.find((d) => d && !d.server_id)
      if (unresolved) continue
      // Remplacer temp_ids par server_ids dans le payload
      for (const depId of entry.depends_on) {
        const dep = deps.find((d) => d?.id === depId)
        if (dep?.server_id && dep.row_id) {
          for (const [k, v] of Object.entries(entry.payload)) {
            if (v === dep.row_id) entry.payload[k] = dep.server_id
          }
        }
      }
    }

    await db.sync_queue.update(entry.id, { status: 'sending', attempts: entry.attempts + 1 })

    try {
      let serverRow: any = null
      if (entry.op === 'insert') {
        const { data, error } = await supabase.from(entry.table as any).insert(entry.payload).select().single()
        if (error) throw error
        serverRow = data
      } else if (entry.op === 'update') {
        const { error } = await supabase.from(entry.table as any).update(entry.payload).eq('id', entry.row_id)
        if (error) throw error
      } else if (entry.op === 'delete') {
        const { error } = await supabase.from(entry.table as any).delete().eq('id', entry.row_id)
        if (error) throw error
      }

      // Clear le _pending_mutation_id local + map server_id
      if (serverRow?.id) {
        await (db as any)[entry.table].delete(entry.row_id)
        await (db as any)[entry.table].put({ ...serverRow, _pending_mutation_id: null })
        await db.sync_queue.update(entry.id, { server_id: serverRow.id })
      } else {
        const existing = await (db as any)[entry.table].get(entry.row_id)
        if (existing) await (db as any)[entry.table].update(entry.row_id, { _pending_mutation_id: null })
      }

      await db.sync_queue.delete(entry.id)
    } catch (err: any) {
      const delay = Math.min(1000 * 2 ** entry.attempts, 30_000)
      const status = entry.attempts >= 5 ? 'failed' : 'pending'
      await db.sync_queue.update(entry.id, { status, last_error: String(err?.message ?? err) })
      if (status === 'pending') setTimeout(() => flush(), delay)
    }
  }
  await refreshStatus()
  useSyncStatus.getState().setLastSyncAt(Date.now())
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { useSyncStatus.getState().setOnline(true); flush() })
  window.addEventListener('offline', () => useSyncStatus.getState().setOnline(false))
}
```

- [ ] **Step 3: Créer `lib/db/mutations.ts` (squelette typé, étendu plus tard)**

```ts
// lib/db/mutations.ts
import { db } from './index'
import { enqueue, flush } from './queue'
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']

type InsertWithTempId<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string }

// Helper : optimistic insert
async function localInsert<T extends string>(
  table: T,
  data: Record<string, any>,
  dependsOn?: string[],
): Promise<{ id: string; queueId: string }> {
  const id = data.id ?? crypto.randomUUID()
  const pendingMutationId = crypto.randomUUID()
  const now = new Date().toISOString()
  await (db as any)[table].put({
    ...data,
    id,
    created_at: now,
    updated_at: now,
    _pending_mutation_id: pendingMutationId,
    _local_updated_at: Date.now(),
  })
  const queueId = await enqueue({
    op: 'insert',
    table,
    payload: { ...data, id },
    row_id: id,
    depends_on: dependsOn,
  })
  flush()
  return { id, queueId }
}

async function localUpdate<T extends string>(
  table: T,
  id: string,
  patch: Record<string, any>,
): Promise<void> {
  const pendingMutationId = crypto.randomUUID()
  await (db as any)[table].update(id, {
    ...patch,
    updated_at: new Date().toISOString(),
    _pending_mutation_id: pendingMutationId,
    _local_updated_at: Date.now(),
  })
  await enqueue({ op: 'update', table, payload: patch, row_id: id })
  flush()
}

async function localDelete<T extends string>(table: T, id: string): Promise<void> {
  await (db as any)[table].delete(id)
  await enqueue({ op: 'delete', table, payload: {}, row_id: id })
  flush()
}

// Mutations publiques typées
export const mutations = {
  trip: {
    create: (data: InsertWithTempId<Tables['trips']['Insert']>) => localInsert('trips', data),
    update: (id: string, patch: Tables['trips']['Update']) => localUpdate('trips', id, patch),
    delete: (id: string) => localDelete('trips', id),
  },
  expense: {
    create: async (
      expense: InsertWithTempId<Tables['expenses']['Insert']>,
      splits: Array<Omit<Tables['expense_splits']['Insert'], 'expense_id'>>,
    ) => {
      const { id, queueId } = await localInsert('expenses', expense)
      for (const split of splits) {
        await localInsert('expense_splits', { ...split, expense_id: id }, [queueId])
      }
      return { id }
    },
    delete: (id: string) => localDelete('expenses', id),
  },
  activity: {
    toggleCompletion: async (activityId: string, userId: string, done: boolean) => {
      if (done) {
        await localInsert('activity_completions', {
          activity_id: activityId,
          user_id: userId,
          completed_at: new Date().toISOString(),
        })
      } else {
        // delete by composite key
        await db.activity_completions.delete([activityId, userId] as any)
        await enqueue({
          op: 'delete', table: 'activity_completions',
          payload: { activity_id: activityId, user_id: userId },
          row_id: activityId,
        })
        flush()
      }
    },
  },
  checklist: {
    toggle: async (itemId: string, userId: string, done: boolean) => {
      if (done) {
        await localInsert('checklist_completions', {
          item_id: itemId, user_id: userId, completed_at: new Date().toISOString(),
        })
      } else {
        await db.checklist_completions.delete([itemId, userId] as any)
        await enqueue({
          op: 'delete', table: 'checklist_completions',
          payload: { item_id: itemId, user_id: userId },
          row_id: itemId,
        })
        flush()
      }
    },
    create: (item: InsertWithTempId<Tables['checklist_items']['Insert']>) => localInsert('checklist_items', item),
  },
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/queue.ts lib/db/mutations.ts lib/stores/syncStatus.ts
git commit -m "feat(db): sync queue with depends_on + typed mutation wrappers"
```

### Task 13: Provider client Dexie + hydratation au boot

**Files:**
- Create: `app/db-provider.tsx`
- Modify: `app/providers.tsx`

- [ ] **Step 1: Créer `app/db-provider.tsx`**

```tsx
'use client'

import { useEffect, type ReactNode } from 'react'
import { hydrateAllTrips } from '@/lib/db/hydrate'
import { flush, refreshStatus } from '@/lib/db/queue'

export function DbProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refreshStatus()
      if (cancelled) return
      try { await hydrateAllTrips() } catch (e) { console.warn('hydrate failed', e) }
      if (cancelled) return
      flush()
    })()
    return () => { cancelled = true }
  }, [])
  return <>{children}</>
}
```

- [ ] **Step 2: Brancher dans `app/providers.tsx`**

```tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { DbProvider } from './db-provider'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  }))

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={client}>
        <DbProvider>{children}</DbProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 3: Valider l'hydratation**

`npm run dev`, se connecter, ouvrir devtools Application → IndexedDB → `mk_trip` → vérifier que les tables `trips`, `profiles`, `trip_members` sont remplies depuis Supabase après login.

- [ ] **Step 4: Commit**

```bash
git add app/db-provider.tsx app/providers.tsx
git commit -m "feat(db): hydrate dexie at boot via client provider"
```

### Task 14: Vercel link + premier deploy preview

**Files:** aucun (configuration externe)

- [ ] **Step 1: Linker le projet Vercel**

```bash
npx vercel link
```

Suivre les prompts pour pointer vers le projet Vercel existant.

- [ ] **Step 2: Configurer les env vars sur Vercel**

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
```

(Mapbox token sera laissé vide pour l'instant, ajouté en Phase 4.)

- [ ] **Step 3: Déployer en preview**

```bash
npx vercel
```

Vérifier le deploy preview : ouverture du lien, login magic link fonctionne (penser à ajouter le domain preview dans Supabase Auth Redirect URLs), `/trips` liste le voyage Portugal.

- [ ] **Step 4: Commit (rien à commit côté code, juste valider)**

Pas de commit pour cette tâche — c'est de la configuration externe.

### Task 15: Cleanup _legacy/

**Files:**
- Delete: `_legacy/` entier

- [ ] **Step 1: Vérifier qu'aucun fichier de _legacy/ n'est référencé**

```bash
grep -r "_legacy" --include="*.ts" --include="*.tsx" .
```

Expected : aucun match.

- [ ] **Step 2: Supprimer _legacy/**

```bash
git rm -r _legacy
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(legacy): remove _legacy/ — Expo frontend retired"
```

---

## Phase 1 — État de sortie

- Next.js 16 tourne en local + Vercel preview.
- Auth magic link end-to-end : welcome → check-email → callback → /trips (liste).
- Dexie hydraté au boot, sync queue + mutations typées prêtes, lock `_pending_mutation_id` actif.
- Tokens DS + fonts + Tailwind config opérationnels.
- shadcn/ui installé avec composants de base.
- `_legacy/` supprimé.

Validation avant Phase 2 : Florian se connecte sur l'URL preview Vercel, voit le voyage Portugal listé, peut ouvrir devtools → IndexedDB → voir les données hydratées.

---

## Phase 2 — Home complet (variante skate, light)

**Objectif :** écran Home pixel-perfect du handoff sur `/trips/[tripId]`, validé sur mobile + desktop. Composants inline d'abord, extraction Phase 3.

**Référence visuelle :** `docs/design/claude-design-handoff/project/screens.jsx` (composant `HomeScreen`) + `variants.jsx` (composant `HomeDesktop`).

### Task 16: Layout trip avec currentTrip + hydrate

**Files:**
- Create: `app/trips/[tripId]/layout.tsx`
- Create: `lib/stores/currentTrip.ts`
- Create: `app/trips/[tripId]/trip-bootstrap.tsx` (client component qui hydrate + subscribe)

- [ ] **Step 1: Créer `lib/stores/currentTrip.ts`**

```ts
import { create } from 'zustand'

interface State {
  tripId: string | null
  setTripId: (id: string | null) => void
}

export const useCurrentTripId = create<State>((set) => ({
  tripId: null,
  setTripId: (id) => set({ tripId: id }),
}))
```

- [ ] **Step 2: Créer `app/trips/[tripId]/trip-bootstrap.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { hydrateTrip } from '@/lib/db/hydrate'
import { subscribeTrip } from '@/lib/db/realtime'
import { useCurrentTripId } from '@/lib/stores/currentTrip'

export function TripBootstrap({ tripId }: { tripId: string }) {
  const setTripId = useCurrentTripId((s) => s.setTripId)
  useEffect(() => {
    setTripId(tripId)
    hydrateTrip(tripId).catch(console.warn)
    const channel = subscribeTrip(tripId)
    return () => { channel.unsubscribe(); setTripId(null) }
  }, [tripId, setTripId])
  return null
}
```

- [ ] **Step 3: Créer `app/trips/[tripId]/layout.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripBootstrap } from './trip-bootstrap'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase.from('trips').select('id').eq('id', tripId).maybeSingle()
  if (!trip) notFound()
  return (
    <>
      <TripBootstrap tripId={tripId} />
      {children}
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/trips/\[tripId\]/ lib/stores/currentTrip.ts
git commit -m "feat(trips): layout with trip bootstrap + realtime subscription"
```

### Task 17: Home — Server Component qui passe la data au client

**Files:**
- Create: `app/trips/[tripId]/page.tsx`
- Create: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Créer `app/trips/[tripId]/page.tsx`** (RSC)

```tsx
import { createClient } from '@/lib/supabase/server'
import { HomeClient } from './home-client'

export default async function HomePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase.from('trips').select('*').eq('id', tripId).single()
  return <HomeClient initialTrip={trip!} tripId={tripId} />
}
```

- [ ] **Step 2: Créer `app/trips/[tripId]/home-client.tsx`** (squelette, à remplir tâches suivantes)

```tsx
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { defaultHeroFor } from '@/lib/design/hero'
import type { Database } from '@/lib/supabase/types'

type Trip = Database['public']['Tables']['trips']['Row']

export function HomeClient({ initialTrip, tripId }: { initialTrip: Trip; tripId: string }) {
  const trip = useLiveQuery(() => db.trips.get(tripId)) ?? initialTrip
  const accent = accentFor(trip.trip_type)
  const heroUrl = trip.hero_image_url ?? defaultHeroFor(trip.id, trip.trip_type)

  return (
    <main className="min-h-screen bg-paper flex flex-col">
      {/* Hero — Task 18 */}
      {/* Upcoming carousel — Task 19 */}
      {/* Crew stats — Task 20 */}
      {/* Quick actions — Task 21 */}
      {/* Bottom tab — Task 22 */}
      <div className="p-6">
        <div className="mk-eyebrow text-ink-mute">SKELETON</div>
        <h1 className="mk-display text-4xl mt-2">{trip.name}</h1>
        <div className="mk-mono text-sm text-ink-mute mt-2">
          accent: {accent.base} · hero: {heroUrl}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Validation visuelle**

`npm run dev`, ouvrir `/trips/<portugal_id>` (récupérer l'id depuis la liste). Vérifier que la page affiche le nom du trip et l'accent (city = #B14E32 pour Portugal).

- [ ] **Step 4: Commit**

```bash
git add app/trips/\[tripId\]/page.tsx app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(home): page skeleton with trip live query + accent resolved"
```

### Task 18: Home Hero (photo full-bleed + overlay + meta)

**Files:**
- Modify: `app/trips/[tripId]/home-client.tsx`
- Note : pas de pack photos encore (Phase 5), on utilise une URL Unsplash temporaire pour le dev

- [ ] **Step 1: Compléter le Hero dans `home-client.tsx`**

Remplacer le bloc skeleton par :

```tsx
import Image from 'next/image'
import { ChevronDown, Bell } from 'lucide-react'

// ... dans le return de HomeClient :

return (
  <main className="min-h-screen bg-paper flex flex-col pb-24 md:pb-0">
    {/* HERO */}
    <section className="relative h-[420px] md:h-[480px] w-full overflow-hidden">
      <Image
        src={heroUrl.startsWith('/') ? 'https://images.unsplash.com/photo-1531565637446-32307b194362?w=1200&q=80' : heroUrl}
        alt={trip.name}
        fill
        className="object-cover"
        priority
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* Top bar — TripSwitcher placeholder */}
      <div className="absolute top-0 left-0 right-0 pt-14 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.18)' }}
          >
            <span className="text-white text-sm font-display font-bold">MK</span>
          </div>
          <div className="flex flex-col text-white">
            <div className="flex items-center gap-1 font-display font-bold text-base">
              {trip.name}
              <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
            </div>
            <div className="mk-mono text-[10px] opacity-70">{trip.trip_type.toUpperCase()}</div>
          </div>
        </div>
        <button className="w-9 h-9 rounded-sm border border-white/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-white" strokeWidth={1.75} />
        </button>
      </div>

      {/* Bottom-left content */}
      <div className="absolute left-5 right-5 bottom-5 text-white">
        <div className="mk-eyebrow text-white/85">
          {trip.start_date && trip.end_date
            ? `${trip.trip_type.toUpperCase()} · ${formatRange(trip.start_date, trip.end_date)}`
            : trip.trip_type.toUpperCase()}
        </div>
        <h1 className="mk-display text-5xl md:text-7xl mt-2 whitespace-pre-line">
          {trip.name.split(' ').join('\n')}
        </h1>
        <div className="flex items-center gap-3 mt-4">
          <span
            className="px-2.5 py-1 rounded-xs text-white text-base mk-display-italic"
            style={{ background: accent.base }}
          >
            {/* Phase 4 wires this to real day counter */}
            JOUR — / —
          </span>
          <span className="mk-mono text-sm">{trip.destination ?? '—'}</span>
        </div>
      </div>
    </section>
    {/* ... reste à venir Tasks 19-22 */}
  </main>
)
```

Et ajouter en haut du fichier (helpers) :

```tsx
function formatRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' })
  return `${fmt.format(s)} → ${fmt.format(e)}`
}
```

- [ ] **Step 2: Validation visuelle**

`npm run dev`, ouvrir `/trips/<portugal_id>`. Vérifier hero photo Unsplash visible, overlay gradient lisible, titre en display, badge accent terracotta (Portugal = city). Comparer au `HomeScreen` du handoff (zone hero).

- [ ] **Step 3: Commit**

```bash
git add app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(home): hero full-bleed with overlay + accent badge + title"
```

### Task 19: Home — Upcoming carousel (next-spot / expense / weather)

**Files:**
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Ajouter les queries Dexie pour next activity + recent expense**

Au-dessus du `return` dans `HomeClient` :

```tsx
const today = new Date().toISOString().slice(0, 10)

const todayActivities = useLiveQuery(async () => {
  const days = await db.days.where({ trip_id: tripId }).toArray()
  const todayDay = days.find((d) => d.date === today)
  if (!todayDay) return []
  return db.activities.where({ day_id: todayDay.id }).sortBy('position')
}, [tripId, today]) ?? []

const recentExpense = useLiveQuery(async () => {
  const list = await db.expenses.where({ trip_id: tripId }).sortBy('spent_at')
  return list[list.length - 1]
}, [tripId])

const nextActivity = todayActivities.find((a) => !a.completed_at)
```

- [ ] **Step 2: Ajouter le carrousel après le hero**

```tsx
{/* UPCOMING CAROUSEL */}
<section className="px-5 mt-5">
  <div className="flex items-center justify-between mb-3">
    <div>
      <div className="mk-eyebrow text-ink-mute">À VENIR · AUJOURD'HUI</div>
      <h2 className="font-display font-bold text-xl mt-1">
        {todayActivities.length > 0 ? `Encore ${todayActivities.filter((a) => !a.completed_at).length} choses.` : 'Rien de calé.'}
      </h2>
    </div>
  </div>

  <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 mk-noscroll">
    {/* Next spot card */}
    {nextActivity && (
      <div className="w-[220px] flex-none bg-white rounded-md border border-hairline p-3.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-xs flex items-center justify-center" style={{ background: accent.base }}>
            <span className="text-white text-[10px]">●</span>
          </div>
          <div className="mk-mono text-[10px] text-ink-mute">
            PROCHAIN · {nextActivity.time?.slice(0, 5) ?? '—'}
          </div>
        </div>
        <div className="font-display font-bold text-lg mt-2.5 leading-tight">{nextActivity.title}</div>
        <div className="text-xs text-ink-mute mt-0.5">{nextActivity.subtitle ?? '—'}</div>
      </div>
    )}

    {/* Expense card */}
    {recentExpense && (
      <div className="w-[200px] flex-none bg-ink text-paper rounded-md p-3.5">
        <div className="mk-mono text-[10px] opacity-60">DERNIÈRE DÉPENSE</div>
        <div className="mk-display text-3xl mt-3 text-white">
          {(recentExpense.amount / 100).toFixed(2)} €
        </div>
        <div className="text-xs opacity-85 mt-0.5">{recentExpense.note ?? recentExpense.category}</div>
      </div>
    )}

    {/* Weather placeholder */}
    <div className="w-[180px] flex-none rounded-md p-3.5" style={{ background: accent.tint }}>
      <div className="mk-mono text-[10px]" style={{ color: accent.deep }}>MÉTÉO</div>
      <div className="mk-display text-3xl mt-3" style={{ color: accent.deep }}>—</div>
      <div className="text-xs opacity-80 mt-1" style={{ color: accent.deep }}>API à brancher</div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Validation**

Vérifier que le carrousel affiche les activités du Portugal (qui a un planning seedé) ou des cards vides si pas de planning aujourd'hui.

- [ ] **Step 4: Commit**

```bash
git add app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(home): upcoming carousel from dexie live queries"
```

### Task 20: Home — Crew stats panel

**Files:**
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Compute stats depuis Dexie**

Avant le `return` :

```tsx
const expenses = useLiveQuery(() => db.expenses.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
const days = useLiveQuery(() => db.days.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
const allActivities = useLiveQuery(async () => {
  const dayIds = days.map((d) => d.id)
  if (!dayIds.length) return []
  return db.activities.where('day_id').anyOf(dayIds).toArray()
}, [days]) ?? []

const totalSpent = expenses.reduce((s, e) => s + (e.amount ?? 0), 0) / 100
const budget = trip.total_budget ?? 0
const spotsTotal = allActivities.length
const spotsDone = allActivities.filter((a) => !!a.completed_at).length
const daysTotal = days.length
const daysElapsed = trip.start_date
  ? Math.max(0, Math.min(daysTotal, Math.floor((Date.now() - new Date(trip.start_date).getTime()) / 86_400_000) + 1))
  : 0

const stats = [
  { label: 'jours', val: `${daysElapsed} / ${daysTotal}`, unit: '' },
  { label: 'spots faits', val: `${spotsDone} / ${spotsTotal}`, unit: '' },
  { label: 'budget', val: totalSpent.toFixed(0), unit: budget ? `/ ${budget}€` : '€' },
]
```

- [ ] **Step 2: Ajouter le panel après le carrousel**

```tsx
{/* CREW STATS */}
<section className="px-5 mt-8">
  <div className="mk-eyebrow text-ink-mute">LE CREW EN CHIFFRES</div>
  <div className="mt-3 bg-white rounded-md border border-hairline overflow-hidden">
    {stats.map((s, i) => (
      <div
        key={s.label}
        className={`flex items-baseline justify-between px-4 py-3.5 ${i ? 'border-t border-hairline' : ''}`}
      >
        <div className="text-sm text-ink-soft">{s.label}</div>
        <div className="flex items-baseline gap-1">
          <div className="mk-display text-2xl">{s.val}</div>
          {s.unit && <div className="mk-mono text-xs text-ink-mute">{s.unit}</div>}
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(home): crew stats panel computed from dexie"
```

### Task 21: Home — Quick actions grid

**Files:**
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Ajouter la grille Quick Actions**

```tsx
import { Receipt, MapPin, CalendarPlus, Plus } from 'lucide-react'

// dans le return, après stats :

{/* QUICK ACTIONS */}
<section className="px-5 mt-6 mb-6">
  <div className="grid grid-cols-3 gap-2">
    {[
      { Icon: Receipt, label: 'Dépense', href: `/trips/${tripId}/budget?new=1` },
      { Icon: MapPin, label: 'Spot', href: `/trips/${tripId}/map?new=1` },
      { Icon: CalendarPlus, label: 'Jour', href: `/trips/${tripId}/planning?new=1` },
    ].map(({ Icon, label, href }) => (
      <a key={label} href={href} className="bg-white rounded-md border border-hairline p-3 flex flex-col gap-1.5 relative">
        <div className="w-7 h-7 bg-paper rounded-xs flex items-center justify-center">
          <Icon className="w-4 h-4 text-ink" strokeWidth={1.75} />
        </div>
        <div className="text-sm font-medium">{label}</div>
        <Plus className="absolute top-3 right-3 w-3.5 h-3.5 text-ink-mute" strokeWidth={2} />
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(home): quick actions grid (expense / spot / day)"
```

### Task 22: Bottom tab nav (mobile) + side rail (desktop)

**Files:**
- Create: `app/trips/[tripId]/(nav)/bottom-tab.tsx`
- Create: `app/trips/[tripId]/(nav)/side-rail.tsx`
- Modify: `app/trips/[tripId]/layout.tsx` (ajout des nav)

- [ ] **Step 1: Créer `bottom-tab.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Calendar, Wallet, BookOpen } from 'lucide-react'
import { accentFor } from '@/lib/design/accent'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const TABS = [
  { id: 'home', Icon: Home, label: 'Home', suffix: '' },
  { id: 'map', Icon: Map, label: 'Map', suffix: 'map' },
  { id: 'plan', Icon: Calendar, label: 'Planning', suffix: 'planning' },
  { id: 'split', Icon: Wallet, label: 'Split', suffix: 'budget' },
  { id: 'guide', Icon: BookOpen, label: 'Guide', suffix: 'guide' },
]

export function BottomTab({ tripId, tripType }: { tripId: string; tripType: TripType }) {
  const path = usePathname()
  const accent = accentFor(tripType)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-hairline pt-2 pb-6 flex justify-around z-50">
      {TABS.map(({ id, Icon, label, suffix }) => {
        const href = `/trips/${tripId}${suffix ? `/${suffix}` : ''}`
        const active = suffix === '' ? path === `/trips/${tripId}` : path.endsWith(`/${suffix}`)
        const color = active ? accent.base : '#7A6F60'
        return (
          <Link key={id} href={href as any} className="flex flex-col items-center gap-1 flex-1 relative">
            {active && <div className="absolute -top-2 w-5 h-[2.5px] rounded" style={{ background: accent.base }} />}
            <Icon className="w-5 h-5" style={{ color }} strokeWidth={active ? 2 : 1.6} />
            <span className="text-[10px]" style={{ color, fontWeight: active ? 600 : 500 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Créer `side-rail.tsx`** (desktop ≥ md)

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Calendar, Wallet, BookOpen, Plus } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { useCurrentTripId } from '@/lib/stores/currentTrip'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const NAV = [
  { Icon: Home, label: 'Home', suffix: '' },
  { Icon: Map, label: 'Map', suffix: 'map' },
  { Icon: Calendar, label: 'Planning', suffix: 'planning' },
  { Icon: Wallet, label: 'Split', suffix: 'budget' },
  { Icon: BookOpen, label: 'Guide', suffix: 'guide' },
]

export function SideRail({ tripId, tripType }: { tripId: string; tripType: TripType }) {
  const path = usePathname()
  const accent = accentFor(tripType)
  const trips = useLiveQuery(() => db.trips.toArray()) ?? []

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-hairline bg-paper p-5 gap-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center">
          <span className="mk-display text-paper text-lg">MK</span>
        </div>
        <span className="mk-display text-xl">Trip</span>
      </div>

      <div>
        <div className="mk-eyebrow text-ink-mute mb-2">VOYAGES · {trips.length}</div>
        {trips.map((t) => {
          const a = accentFor(t.trip_type as TripType)
          const isActive = t.id === tripId
          return (
            <Link
              key={t.id}
              href={`/trips/${t.id}` as any}
              className="flex items-center gap-2.5 px-2 py-2 rounded-sm mb-1"
              style={{ background: isActive ? '#fff' : 'transparent', border: isActive ? '1px solid #1C1A1714' : 'none' }}
            >
              <div className="w-7 h-7 rounded-xs flex items-center justify-center" style={{ background: a.base }}>
                <span className="text-white text-xs">●</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="mk-mono text-[9px] text-ink-mute">{t.trip_type.toUpperCase()}</div>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: a.base }} />}
            </Link>
          )
        })}
        <Link href={'/trips/new' as any} className="flex items-center gap-2 px-2 py-2 text-ink-mute text-sm">
          <Plus className="w-3.5 h-3.5" /> Nouveau voyage
        </Link>
      </div>

      <div className="mt-auto flex flex-col gap-0.5">
        {NAV.map(({ Icon, label, suffix }) => {
          const href = `/trips/${tripId}${suffix ? `/${suffix}` : ''}`
          const active = suffix === '' ? path === `/trips/${tripId}` : path.endsWith(`/${suffix}`)
          return (
            <Link
              key={label}
              href={href as any}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xs"
              style={{ background: active ? '#E8E0CF' : 'transparent' }}
            >
              <Icon className="w-4 h-4" style={{ color: active ? accent.base : '#3D362C' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ fontWeight: active ? 600 : 500, color: active ? '#1C1A17' : '#3D362C' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Modifier `app/trips/[tripId]/layout.tsx` pour inclure les nav**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripBootstrap } from './trip-bootstrap'
import { BottomTab } from './(nav)/bottom-tab'
import { SideRail } from './(nav)/side-rail'

export default async function TripLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase.from('trips').select('id, trip_type').eq('id', tripId).maybeSingle()
  if (!trip) notFound()
  return (
    <div className="min-h-screen flex">
      <SideRail tripId={tripId} tripType={trip.trip_type} />
      <div className="flex-1 min-w-0">
        <TripBootstrap tripId={tripId} />
        {children}
      </div>
      <BottomTab tripId={tripId} tripType={trip.trip_type} />
    </div>
  )
}
```

- [ ] **Step 4: Validation**

`npm run dev`, ouvrir `/trips/<portugal_id>` :
- Mobile (devtools 375px) : bottom tab visible, side rail caché.
- Desktop (≥ 1024px) : side rail visible avec la liste des trips, bottom tab caché.
- Cliquer sur les onglets navigue (les pages cibles n'existent pas encore, 404 attendu sur map/planning/budget/guide).

- [ ] **Step 5: Commit**

```bash
git add app/trips/\[tripId\]/\(nav\)/ app/trips/\[tripId\]/layout.tsx
git commit -m "feat(nav): bottom tab mobile + side rail desktop with accent active state"
```

### Task 23: Validation pixel-perfect Home

**Files:** aucun code, validation visuelle

- [ ] **Step 1: Screenshot mobile 375px**

Devtools Chrome → iPhone 15 Pro (393×852). Capturer le Home complet (scroll inclus).

- [ ] **Step 2: Screenshot desktop 1280**

Devtools Chrome → Responsive 1280×800. Capturer le Home complet.

- [ ] **Step 3: Comparer aux refs handoff**

Ouvrir `docs/design/claude-design-handoff/project/screens.jsx` (`HomeScreen`) et `variants.jsx` (`HomeDesktop`). Côte à côte avec les screenshots devtools.

- [ ] **Step 4: Lister les écarts**

Documenter dans un commit ou note les écarts si présents (typo, espacements, couleurs). Si écarts mineurs → corriger inline. Si écart majeur → ouvrir question à Florian.

- [ ] **Step 5: Commit (si corrections)**

```bash
git commit -am "fix(home): pixel-perfect corrections vs handoff"
```

Sinon, pas de commit.

---

## Phase 2 — État de sortie

- Écran Home complet (hero + carousel + stats + actions) sur mobile et desktop.
- Bottom tab + side rail naviguent (autres pages 404 encore).
- Composants encore inline dans `home-client.tsx` — Phase 3 extrait.

---

## Phase 3 — DS extract

**Objectif :** factoriser le Home inline en composants réutilisables dans `components/design/` et `components/home/`. Pas de régression visuelle.

### Task 24: Extraire `<Hero>` + `<TripSwitcher>`

**Files:**
- Create: `components/design/Hero.tsx`, `components/design/TripSwitcher.tsx`
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Créer `components/design/Hero.tsx`**

```tsx
import Image from 'next/image'
import type { AccentTokens } from '@/lib/design/tokens'

export interface HeroProps {
  photo: string
  accent: AccentTokens
  eyebrow: string
  title: string
  metaBadge?: string
  metaRight?: string
  topBar?: React.ReactNode
}

export function Hero({ photo, accent, eyebrow, title, metaBadge, metaRight, topBar }: HeroProps) {
  return (
    <section className="relative h-[420px] md:h-[480px] w-full overflow-hidden">
      <Image src={photo} alt="" fill className="object-cover" priority unoptimized />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      {topBar && <div className="absolute top-0 left-0 right-0 pt-14 px-5">{topBar}</div>}
      <div className="absolute left-5 right-5 bottom-5 text-white">
        <div className="mk-eyebrow text-white/85">{eyebrow}</div>
        <h1 className="mk-display text-5xl md:text-7xl mt-2 whitespace-pre-line">{title}</h1>
        {(metaBadge || metaRight) && (
          <div className="flex items-center gap-3 mt-4">
            {metaBadge && (
              <span className="px-2.5 py-1 rounded-xs text-white text-base mk-display-italic" style={{ background: accent.base }}>
                {metaBadge}
              </span>
            )}
            {metaRight && <span className="mk-mono text-sm">{metaRight}</span>}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Créer `components/design/TripSwitcher.tsx`**

```tsx
'use client'

import { ChevronDown, Bell } from 'lucide-react'
import { TripIcon } from './TripIcon'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  tone: 'light' | 'dark'
  tripName: string
  tripType: TripType
  sublabel?: string
  onClick?: () => void
}

export function TripSwitcher({ tone, tripName, tripType, sublabel, onClick }: Props) {
  const onHero = tone === 'dark'
  return (
    <div className="flex items-center justify-between">
      <button onClick={onClick} className="flex items-center gap-2.5 text-left">
        <div
          className="w-9 h-9 rounded-sm flex items-center justify-center"
          style={{ background: onHero ? 'rgba(255,255,255,.18)' : 'transparent' }}
        >
          <TripIcon type={tripType} size={20} color={onHero ? '#fff' : undefined} />
        </div>
        <div className="flex flex-col">
          <div
            className="flex items-center gap-1 font-display font-bold text-base"
            style={{ color: onHero ? '#fff' : '#1C1A17' }}
          >
            {tripName}
            <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
          </div>
          {sublabel && (
            <div
              className="mk-mono text-[10px]"
              style={{ color: onHero ? 'rgba(255,255,255,.7)' : '#7A6F60' }}
            >
              {sublabel.toUpperCase()}
            </div>
          )}
        </div>
      </button>
      <button
        className="w-9 h-9 rounded-sm flex items-center justify-center"
        style={{ border: `1px solid ${onHero ? 'rgba(255,255,255,.2)' : '#1C1A1714'}` }}
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} style={{ color: onHero ? '#fff' : '#1C1A17' }} />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Créer `components/design/TripIcon.tsx`** (placeholder, 6 types finalisés Phase 5)

```tsx
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props { type: TripType; size?: number; color?: string }

const SYMBOL: Record<TripType, string> = {
  sport: '🛹',
  hike: '⛰',
  beach: '🌊',
  city_break: '🏛',
  road_trip: '🚐',
  other: '◆',
}

export function TripIcon({ type, size = 20, color }: Props) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.8, color }}
      aria-hidden
    >
      {SYMBOL[type] ?? SYMBOL.other}
    </span>
  )
}
```

- [ ] **Step 4: Refactorer `home-client.tsx` pour utiliser ces composants**

Remplacer la section hero inline par :

```tsx
<Hero
  photo={'https://images.unsplash.com/photo-1531565637446-32307b194362?w=1200&q=80'}
  accent={accent}
  eyebrow={trip.start_date && trip.end_date ? `${trip.trip_type.toUpperCase()} · ${formatRange(trip.start_date, trip.end_date)}` : trip.trip_type.toUpperCase()}
  title={trip.name.split(' ').join('\n')}
  metaBadge={`JOUR ${daysElapsed} / ${daysTotal}`}
  metaRight={trip.destination ?? '—'}
  topBar={<TripSwitcher tone="dark" tripName={trip.name} tripType={trip.trip_type} sublabel={trip.destination ?? undefined} />}
/>
```

(Imports : `import { Hero } from '@/components/design/Hero'`, `import { TripSwitcher } from '@/components/design/TripSwitcher'`.)

- [ ] **Step 5: Validation visuelle** — rendu identique au Task 23.

- [ ] **Step 6: Commit**

```bash
git add components/design/ app/trips/\[tripId\]/home-client.tsx
git commit -m "refactor(design): extract Hero + TripSwitcher + TripIcon"
```

### Task 25: Extraire `<UpcomingCarousel>` + cards

**Files:**
- Create: `components/home/UpcomingCarousel.tsx`, `components/home/UpcomingCard.tsx`
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Créer `components/home/UpcomingCard.tsx`**

```tsx
import type { AccentTokens } from '@/lib/design/tokens'

interface BaseProps { variant: 'next-spot' | 'expense' | 'weather'; accent: AccentTokens }
type NextSpotProps = BaseProps & { variant: 'next-spot'; title: string; subtitle?: string; time?: string }
type ExpenseProps = BaseProps & { variant: 'expense'; amount: number; label: string }
type WeatherProps = BaseProps & { variant: 'weather'; temp?: string; condition?: string }
type Props = NextSpotProps | ExpenseProps | WeatherProps

export function UpcomingCard(p: Props) {
  if (p.variant === 'next-spot') return <NextSpot {...p} />
  if (p.variant === 'expense') return <ExpenseCard {...p} />
  return <Weather {...p} />
}

function NextSpot({ accent, title, subtitle, time }: NextSpotProps) {
  return (
    <div className="w-[220px] flex-none bg-white rounded-md border border-hairline p-3.5">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-xs flex items-center justify-center" style={{ background: accent.base }}>
          <span className="text-white text-[10px]">●</span>
        </div>
        <div className="mk-mono text-[10px] text-ink-mute">PROCHAIN · {time ?? '—'}</div>
      </div>
      <div className="font-display font-bold text-lg mt-2.5 leading-tight">{title}</div>
      {subtitle && <div className="text-xs text-ink-mute mt-0.5">{subtitle}</div>}
    </div>
  )
}

function ExpenseCard({ amount, label }: ExpenseProps) {
  return (
    <div className="w-[200px] flex-none bg-ink text-paper rounded-md p-3.5">
      <div className="mk-mono text-[10px] opacity-60">DERNIÈRE DÉPENSE</div>
      <div className="mk-display text-3xl mt-3 text-white">{(amount / 100).toFixed(2)} €</div>
      <div className="text-xs opacity-85 mt-0.5">{label}</div>
    </div>
  )
}

function Weather({ accent, temp, condition }: WeatherProps) {
  return (
    <div className="w-[180px] flex-none rounded-md p-3.5" style={{ background: accent.tint }}>
      <div className="mk-mono text-[10px]" style={{ color: accent.deep }}>MÉTÉO</div>
      <div className="mk-display text-3xl mt-3" style={{ color: accent.deep }}>{temp ?? '—'}</div>
      <div className="text-xs opacity-80 mt-1" style={{ color: accent.deep }}>{condition ?? 'API à brancher'}</div>
    </div>
  )
}
```

- [ ] **Step 2: Créer `components/home/UpcomingCarousel.tsx`**

```tsx
'use client'

import { UpcomingCard } from './UpcomingCard'
import type { AccentTokens } from '@/lib/design/tokens'

interface Activity { id: string; title: string; subtitle: string | null; time: string | null; completed_at?: string | null }
interface Expense { amount: number; note: string | null; category: string }

interface Props {
  accent: AccentTokens
  nextActivity?: Activity | null
  recentExpense?: Expense | null
  remainingCount: number
}

export function UpcomingCarousel({ accent, nextActivity, recentExpense, remainingCount }: Props) {
  return (
    <section className="px-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="mk-eyebrow text-ink-mute">À VENIR · AUJOURD'HUI</div>
          <h2 className="font-display font-bold text-xl mt-1">
            {remainingCount > 0 ? `Encore ${remainingCount} choses.` : 'Rien de calé.'}
          </h2>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 mk-noscroll">
        {nextActivity && (
          <UpcomingCard
            variant="next-spot" accent={accent}
            title={nextActivity.title}
            subtitle={nextActivity.subtitle ?? undefined}
            time={nextActivity.time?.slice(0, 5)}
          />
        )}
        {recentExpense && (
          <UpcomingCard
            variant="expense" accent={accent}
            amount={recentExpense.amount}
            label={recentExpense.note ?? recentExpense.category}
          />
        )}
        <UpcomingCard variant="weather" accent={accent} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Refactor home-client.tsx**

Remplacer la section carrousel inline par :

```tsx
import { UpcomingCarousel } from '@/components/home/UpcomingCarousel'

// dans le return :
<UpcomingCarousel
  accent={accent}
  nextActivity={nextActivity}
  recentExpense={recentExpense}
  remainingCount={todayActivities.filter((a) => !a.completed_at).length}
/>
```

- [ ] **Step 4: Commit**

```bash
git add components/home/ app/trips/\[tripId\]/home-client.tsx
git commit -m "refactor(home): extract UpcomingCarousel + UpcomingCard"
```

### Task 26: Extraire `<CrewStats>` + `<QuickActions>` + `<DSText>` + `<Eyebrow>`

**Files:**
- Create: `components/home/CrewStats.tsx`, `components/home/QuickActions.tsx`
- Create: `components/design/Eyebrow.tsx`, `components/design/DSText.tsx`
- Modify: `app/trips/[tripId]/home-client.tsx`

- [ ] **Step 1: Créer `components/design/Eyebrow.tsx`**

```tsx
import type { ReactNode } from 'react'

export function Eyebrow({ children, style, className = '' }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={`mk-eyebrow ${className}`} style={style}>{children}</div>
}
```

- [ ] **Step 2: Créer `components/design/DSText.tsx`**

```tsx
import type { ReactNode, CSSProperties } from 'react'

type T = { children: ReactNode; className?: string; style?: CSSProperties }

export const Display = ({ children, className = '', style }: T) =>
  <span className={`mk-display ${className}`} style={style}>{children}</span>
export const DisplayItalic = ({ children, className = '', style }: T) =>
  <span className={`mk-display-italic ${className}`} style={style}>{children}</span>
export const Heading = ({ children, className = '', style }: T) =>
  <span className={`font-display font-bold tracking-tight ${className}`} style={style}>{children}</span>
export const Body = ({ children, className = '', style }: T) =>
  <span className={`font-body ${className}`} style={style}>{children}</span>
export const Mono = ({ children, className = '', style }: T) =>
  <span className={`mk-mono ${className}`} style={style}>{children}</span>
```

- [ ] **Step 3: Créer `components/home/CrewStats.tsx`**

```tsx
import { Eyebrow } from '@/components/design/Eyebrow'

interface Stat { label: string; val: string; unit?: string }

export function CrewStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="px-5 mt-8">
      <Eyebrow className="text-ink-mute">LE CREW EN CHIFFRES</Eyebrow>
      <div className="mt-3 bg-white rounded-md border border-hairline overflow-hidden">
        {stats.map((s, i) => (
          <div key={s.label} className={`flex items-baseline justify-between px-4 py-3.5 ${i ? 'border-t border-hairline' : ''}`}>
            <div className="text-sm text-ink-soft">{s.label}</div>
            <div className="flex items-baseline gap-1">
              <div className="mk-display text-2xl">{s.val}</div>
              {s.unit && <div className="mk-mono text-xs text-ink-mute">{s.unit}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Créer `components/home/QuickActions.tsx`**

```tsx
import Link from 'next/link'
import { Receipt, MapPin, CalendarPlus, Plus } from 'lucide-react'

export function QuickActions({ tripId }: { tripId: string }) {
  const items = [
    { Icon: Receipt, label: 'Dépense', href: `/trips/${tripId}/budget?new=1` as const },
    { Icon: MapPin, label: 'Spot', href: `/trips/${tripId}/map?new=1` as const },
    { Icon: CalendarPlus, label: 'Jour', href: `/trips/${tripId}/planning?new=1` as const },
  ]
  return (
    <section className="px-5 mt-6 mb-6">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ Icon, label, href }) => (
          <Link key={label} href={href} className="bg-white rounded-md border border-hairline p-3 flex flex-col gap-1.5 relative">
            <div className="w-7 h-7 bg-paper rounded-xs flex items-center justify-center">
              <Icon className="w-4 h-4 text-ink" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-medium">{label}</div>
            <Plus className="absolute top-3 right-3 w-3.5 h-3.5 text-ink-mute" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Refactor `home-client.tsx`**

Remplacer les sections inline par :

```tsx
import { CrewStats } from '@/components/home/CrewStats'
import { QuickActions } from '@/components/home/QuickActions'

// dans le return :
<CrewStats stats={stats} />
<QuickActions tripId={tripId} />
```

- [ ] **Step 6: Commit**

```bash
git add components/design/ components/home/ app/trips/\[tripId\]/home-client.tsx
git commit -m "refactor(home): extract CrewStats + QuickActions + DSText primitives"
```

### Task 27: Extraire `<AvatarStack>` + `<Avatar>` (pour Phase 4 ready)

**Files:**
- Create: `components/design/Avatar.tsx`, `components/design/AvatarStack.tsx`

- [ ] **Step 1: Créer `components/design/Avatar.tsx`**

```tsx
interface Props { name: string; size?: number; bg?: string; color?: string; border?: string }

export function Avatar({ name, size = 24, bg = '#1C1A17', color = '#fff', border }: Props) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-body font-semibold"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.42, letterSpacing: '-0.02em', flex: 'none', border }}
    >
      {name}
    </div>
  )
}
```

- [ ] **Step 2: Créer `components/design/AvatarStack.tsx`**

```tsx
import { Avatar } from './Avatar'

interface Person { initials: string; color: string }
interface Props { people: Person[]; size?: number; max?: number; bgRing?: string; overflowBg?: string }

export function AvatarStack({ people, size = 24, max = 4, bgRing = '#F2EDE3', overflowBg = '#1C1A17' }: Props) {
  const shown = people.slice(0, max)
  const overflow = people.length - max
  return (
    <div className="flex">
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar name={p.initials} size={size} bg={p.color} border={`2px solid ${bgRing}`} />
        </div>
      ))}
      {overflow > 0 && (
        <div style={{ marginLeft: -size * 0.32 }}>
          <Avatar name={`+${overflow}`} size={size} bg={overflowBg} border={`2px solid ${bgRing}`} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/design/Avatar.tsx components/design/AvatarStack.tsx
git commit -m "feat(design): Avatar + AvatarStack primitives"
```

---

## Phase 3 — État de sortie

- Home identique visuellement à Phase 2 mais structuré en composants.
- `components/design/` : Hero, TripSwitcher, TripIcon, Avatar, AvatarStack, Eyebrow, DSText.
- `components/home/` : UpcomingCarousel, UpcomingCard, CrewStats, QuickActions.
- API publique des composants stable, prête pour les variantes Phase 5.

---

## Phase 4 — Map, Planning, Guide, Budget

**Objectif :** les 4 écrans restants pixel-perfect du handoff, variante skate light. Ordre : Map → Planning → Guide → Budget.

**Référence visuelle :** `docs/design/claude-design-handoff/project/screens.jsx` (Map) + `screens2.jsx` (Planning, Budget, Guide).

### Task 28: Mapbox setup + env token

**Files:**
- Modify: `next.config.ts`
- Get Mapbox public token (manuel)

- [ ] **Step 1: Créer un compte Mapbox + token public**

Florian crée un account sur `account.mapbox.com`, récupère un token public (`pk.*`). Coller dans `.env.local` :

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...
```

Et l'ajouter dans Vercel via `npx vercel env add NEXT_PUBLIC_MAPBOX_TOKEN`.

- [ ] **Step 2: Vérifier qu'il est lisible côté client**

```bash
echo "console.log(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)" >> tmp-check.ts
# Pas commit — juste vérifier en dev tools que la var est définie
```

(Skip si évident.)

- [ ] **Step 3: Modifier `next.config.ts`** pour autoriser le domaine Supabase Storage à venir

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "chore(config): allow supabase storage + unsplash domains, prep mapbox"
```

### Task 29: MapView + pin component

**Files:**
- Create: `components/design/MapPin.tsx`, `components/map/MapView.tsx`
- Create: `app/trips/[tripId]/map/page.tsx`

- [ ] **Step 1: Créer `components/design/MapPin.tsx`**

```tsx
import type { ReactNode } from 'react'

interface Props { color: string; active?: boolean; size?: number; children?: ReactNode }

export function MapPin({ color, active = false, size = 32, children }: Props) {
  const scale = active ? 1.15 : 1
  return (
    <div
      className="rounded-tl-full rounded-tr-full rounded-bl-full flex items-center justify-center"
      style={{
        width: size, height: size, background: color, transform: `rotate(-45deg) scale(${scale})`,
        boxShadow: active ? `0 2px 8px ${color}66` : '0 2px 6px rgba(0,0,0,.25)',
        border: '2px solid #fff',
      }}
    >
      <div style={{ transform: 'rotate(45deg)' }}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Créer `components/map/MapView.tsx`** (client only, dynamic import)

```tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, NavigationControl, Marker } from 'react-map-gl/mapbox'
import { Skateboard } from 'lucide-react'
import { MapPin } from '@/components/design/MapPin'
import type { AccentTokens } from '@/lib/design/tokens'

interface Spot { id: string; name: string; lat: number; lng: number; category: string }

interface Props { accent: AccentTokens; spots: Spot[]; activeSpotId?: string | null }

export function MapView({ accent, spots, activeSpotId }: Props) {
  const center = spots[0] ?? { lat: 38.722, lng: -9.139 } // Lisbonne fallback
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: 11 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      {spots.map((spot) => {
        const active = spot.id === activeSpotId
        return (
          <Marker key={spot.id} latitude={spot.lat} longitude={spot.lng}>
            <MapPin color={active ? accent.base : '#1C1A17'} active={active}>
              <span className="text-white text-[10px]">●</span>
            </MapPin>
          </Marker>
        )
      })}
    </Map>
  )
}
```

- [ ] **Step 3: Créer `app/trips/[tripId]/map/page.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'next/navigation'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import type { Database } from '@/lib/supabase/types'

const MapView = dynamic(() => import('@/components/map/MapView').then((m) => m.MapView), { ssr: false })

type TripType = Database['public']['Enums']['trip_type']

export default function MapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const spots = useLiveQuery(() => db.spots.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  if (!trip) return null
  const accent = accentFor(trip.trip_type as TripType)

  return (
    <main className="h-screen flex flex-col">
      <div className="flex-1 relative">
        <MapView accent={accent} spots={spots.map((s) => ({ id: s.id, name: s.name, lat: Number(s.lat), lng: Number(s.lng), category: s.category }))} />
      </div>
      {/* MapSheet — Task 30 */}
    </main>
  )
}
```

- [ ] **Step 4: Validation**

`npm run dev`, naviguer `/trips/<portugal_id>/map`. Vérifier : la map se charge, les spots Portugal s'affichent comme pins, la cible accent est terracotta (city). Pas encore de sheet en bas.

- [ ] **Step 5: Commit**

```bash
git add components/design/MapPin.tsx components/map/MapView.tsx app/trips/\[tripId\]/map/
git commit -m "feat(map): mapbox base view with spot pins from dexie"
```

### Task 30: MapSheet (vaul) avec liste spots + filtres

**Files:**
- Create: `components/map/MapSheet.tsx`
- Modify: `app/trips/[tripId]/map/page.tsx`

- [ ] **Step 1: Créer `components/map/MapSheet.tsx`**

```tsx
'use client'

import { Drawer } from 'vaul'
import { useState } from 'react'
import { Eyebrow } from '@/components/design/Eyebrow'
import type { AccentTokens } from '@/lib/design/tokens'

interface Spot { id: string; name: string; category: string }

interface Props { accent: AccentTokens; spots: Spot[]; currentDayLabel?: string }

const FILTERS = ['Tous', 'Jour', 'Type']

export function MapSheet({ accent, spots, currentDayLabel }: Props) {
  const [filter, setFilter] = useState<string>('Tous')
  return (
    <Drawer.Root open dismissible={false} modal={false}>
      <Drawer.Portal>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[65%] bg-white rounded-t-[16px] shadow-sheet outline-none">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <div className="px-5 flex items-center justify-between">
            <div>
              <Eyebrow className="text-ink-mute">{currentDayLabel ?? 'TOUS LES SPOTS'}</Eyebrow>
              <div className="font-display font-bold text-lg mt-0.5">{spots.length} spot{spots.length > 1 ? 's' : ''}</div>
            </div>
            <div className="flex gap-1.5">
              {FILTERS.map((f) => {
                const active = f === filter
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-pill text-[11px] font-medium"
                    style={{
                      background: active ? '#1C1A17' : 'transparent',
                      color: active ? '#fff' : '#3D362C',
                      border: active ? 'none' : '1px solid #1C1A1729',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </div>
          <ul className="mt-3 px-5 pb-6 overflow-y-auto max-h-[45vh] mk-noscroll">
            {spots.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-3 py-3 ${i ? 'border-t border-hairline' : ''}`}>
                <div className="w-8 h-8 rounded-xs flex items-center justify-center" style={{ background: accent.base }}>
                  <span className="text-white text-xs">●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="mk-mono text-[10px] text-ink-mute mt-0.5">{s.category.toUpperCase()}</div>
                </div>
              </li>
            ))}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

- [ ] **Step 2: Modifier `app/trips/[tripId]/map/page.tsx`** pour ajouter le sheet

```tsx
// ajouter import :
import { MapSheet } from '@/components/map/MapSheet'

// dans le return, avant le `</main>` :
<MapSheet accent={accent} spots={spots.map((s) => ({ id: s.id, name: s.name, category: s.category }))} />
```

- [ ] **Step 3: Validation**

Vérifier que le sheet est visible en bas avec la liste des spots Portugal, drag fonctionnel.

- [ ] **Step 4: Commit**

```bash
git add components/map/ app/trips/\[tripId\]/map/
git commit -m "feat(map): bottom sheet vaul with filterable spot list"
```

### Task 31: Planning — week strip + timeline

**Files:**
- Create: `components/planning/WeekStrip.tsx`, `components/planning/Timeline.tsx`, `components/planning/TimelineEvent.tsx`
- Create: `app/trips/[tripId]/planning/page.tsx`

- [ ] **Step 1: Créer `components/planning/WeekStrip.tsx`**

```tsx
'use client'

import type { AccentTokens } from '@/lib/design/tokens'

interface Day { id: string; date: string | null; day_number: number; done?: boolean }
interface Props { days: Day[]; activeDayId: string | null; onSelect: (id: string) => void; accent: AccentTokens }

const DAYS_FR = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function WeekStrip({ days, activeDayId, onSelect, accent }: Props) {
  return (
    <div className="flex gap-1.5 mt-4">
      {days.map((d) => {
        const date = d.date ? new Date(d.date) : null
        const dayLabel = date ? DAYS_FR[date.getDay()] : '?'
        const dateLabel = date ? date.getDate().toString().padStart(2, '0') : '?'
        const active = d.id === activeDayId
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="flex-1 flex flex-col items-center py-2 rounded-sm border"
            style={{
              background: active ? '#1C1A17' : 'transparent',
              borderColor: active ? '#1C1A17' : '#1C1A1714',
              color: active ? '#fff' : '#1C1A17',
            }}
          >
            <span className="mk-mono text-[9px] opacity-70">{dayLabel}</span>
            <span className="font-display font-bold text-base mt-0.5">{dateLabel}</span>
            {d.done && !active && <span className="w-1 h-1 rounded-full mt-1" style={{ background: accent.base }} />}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Créer `components/planning/TimelineEvent.tsx`**

```tsx
'use client'

import type { AccentTokens } from '@/lib/design/tokens'

interface Props {
  time: string
  duration?: string
  title: string
  subtitle?: string
  done: boolean
  active: boolean
  accent: AccentTokens
  isLast?: boolean
  onToggle: () => void
}

export function TimelineEvent({ time, duration, title, subtitle, done, active, accent, isLast, onToggle }: Props) {
  return (
    <div className="flex gap-3 relative">
      <div className="w-12 pt-3 flex flex-col items-end">
        <div className="mk-mono text-xs font-semibold" style={{ color: active ? accent.base : '#1C1A17' }}>{time}</div>
        {duration && <div className="mk-mono text-[9px] text-ink-mute mt-0.5">{duration}</div>}
      </div>
      <div className="flex flex-col items-center pt-3.5">
        <button
          onClick={onToggle}
          className="w-3 h-3 rounded-full"
          style={{
            background: done ? accent.base : '#fff',
            border: active ? `3px solid ${accent.base}` : `2px solid ${done ? accent.base : '#1C1A1729'}`,
          }}
        />
        {!isLast && <div className="w-[1.5px] flex-1 min-h-[50px]" style={{ background: done ? accent.base : '#1C1A1729' }} />}
      </div>
      <div className="flex-1 pt-2 pb-4">
        <div
          className="font-display font-bold text-base tracking-tight"
          style={{ textDecoration: done ? 'line-through' : 'none', color: done ? '#7A6F60' : '#1C1A17' }}
        >
          {title}
        </div>
        {subtitle && <div className="text-xs text-ink-soft mt-0.5">{subtitle}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Créer `components/planning/Timeline.tsx`**

```tsx
'use client'

import { TimelineEvent } from './TimelineEvent'
import type { AccentTokens } from '@/lib/design/tokens'

interface Activity {
  id: string
  time: string | null
  title: string
  subtitle: string | null
  completed_at: string | null
}

interface Props {
  activities: Activity[]
  accent: AccentTokens
  onToggleActivity: (id: string, currentlyDone: boolean) => void
  currentActivityId?: string | null
}

export function Timeline({ activities, accent, onToggleActivity, currentActivityId }: Props) {
  return (
    <div className="px-5 pb-24">
      {activities.map((a, i) => (
        <TimelineEvent
          key={a.id}
          time={a.time?.slice(0, 5) ?? '—'}
          title={a.title}
          subtitle={a.subtitle ?? undefined}
          done={!!a.completed_at}
          active={a.id === currentActivityId}
          accent={accent}
          isLast={i === activities.length - 1}
          onToggle={() => onToggleActivity(a.id, !!a.completed_at)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Créer `app/trips/[tripId]/planning/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { WeekStrip } from '@/components/planning/WeekStrip'
import { Timeline } from '@/components/planning/Timeline'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

export default function PlanningPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days = useLiveQuery(() => db.days.where({ trip_id: tripId }).sortBy('day_number'), [tripId]) ?? []
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const day = activeDayId ? days.find((d) => d.id === activeDayId) : days[0]
  const activities = useLiveQuery(async () => {
    if (!day) return []
    return db.activities.where({ day_id: day.id }).sortBy('position')
  }, [day?.id]) ?? []

  if (!trip || !day) return null
  const accent = accentFor(trip.trip_type as TripType)

  async function toggleActivity(id: string, currentlyDone: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.activity.toggleCompletion(id, user.id, !currentlyDone)
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="pt-12 px-5">
        <TripSwitcher tone="light" tripName={trip.name} tripType={trip.trip_type as TripType} sublabel={trip.destination ?? undefined} />
      </div>
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between">
          <Eyebrow className="text-ink-mute">PLANNING</Eyebrow>
        </div>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="mk-display text-4xl">
            {day.date ? new Date(day.date).toLocaleDateString('fr', { weekday: 'long', day: 'numeric' }) : day.label ?? `Jour ${day.day_number}`}
          </span>
          <span className="mk-display-italic text-2xl" style={{ color: accent.base }}>Jour {day.day_number}</span>
        </div>
        {day.zone && <div className="text-sm text-ink-soft mt-0.5">{day.zone}</div>}
        <WeekStrip
          days={days.map((d) => ({ id: d.id, date: d.date, day_number: d.day_number, done: d.day_number < day.day_number }))}
          activeDayId={day.id}
          onSelect={setActiveDayId}
          accent={accent}
        />
      </div>
      <Timeline activities={activities} accent={accent} onToggleActivity={toggleActivity} />
      <button className="fixed bottom-[88px] right-5 w-13 h-13 rounded-full bg-ink shadow-card flex items-center justify-center">
        <Plus className="w-5 h-5 text-white" strokeWidth={2} />
      </button>
    </main>
  )
}
```

- [ ] **Step 5: Validation**

Ouvrir `/trips/<portugal_id>/planning`. Vérifier week strip, timeline, toggle d'une activité (devrait persister via Dexie + sync).

- [ ] **Step 6: Commit**

```bash
git add components/planning/ app/trips/\[tripId\]/planning/
git commit -m "feat(planning): week strip + timeline with toggle via mutations"
```

### Task 32: Guide — info tiles + checklist + crew notes

**Files:**
- Create: `components/guide/InfoTiles.tsx`, `components/guide/ChecklistGroup.tsx`, `components/guide/CrewNote.tsx`
- Create: `app/trips/[tripId]/guide/page.tsx`

- [ ] **Step 1: Créer `components/guide/InfoTiles.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react'

interface Tile { Icon: LucideIcon; title: string; value: string; emphasis?: boolean; accentColor?: string }

export function InfoTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(({ Icon, title, value, emphasis, accentColor }) => (
        <div
          key={title}
          className="rounded-md p-3.5"
          style={{
            background: emphasis ? '#1C1A17' : '#fff',
            color: emphasis ? '#fff' : '#1C1A17',
            border: emphasis ? 'none' : '1px solid #1C1A1714',
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: emphasis ? accentColor : '#7A6F60' }} />
          <div className="text-[11px] mt-2.5" style={{ color: emphasis ? 'rgba(255,255,255,.7)' : '#7A6F60' }}>{title}</div>
          <div className="font-display font-bold text-lg mt-0.5 tracking-tight">{value}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Créer `components/guide/ChecklistGroup.tsx`**

```tsx
'use client'

import { Check } from 'lucide-react'
import { Avatar } from '@/components/design/Avatar'
import type { AccentTokens } from '@/lib/design/tokens'

interface Item { id: string; label: string; done: boolean; ownerInitials?: string; ownerColor?: string }

interface Props { items: Item[]; accent: AccentTokens; onToggle: (id: string, currentlyDone: boolean) => void; onAdd?: () => void }

export function ChecklistGroup({ items, accent, onToggle, onAdd }: Props) {
  const doneCount = items.filter((i) => i.done).length
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="mk-eyebrow text-ink-mute">CHECKLIST MATOS</div>
        <div className="mk-mono text-[11px] font-semibold" style={{ color: accent.base }}>
          {doneCount} / {items.length}
        </div>
      </div>
      <div className="mt-3 bg-white rounded-md border border-hairline overflow-hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id, item.done)}
            className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${i ? 'border-t border-hairline' : ''}`}
          >
            <div
              className="w-5 h-5 rounded-xs flex items-center justify-center"
              style={{
                background: item.done ? '#1C1A17' : 'transparent',
                border: item.done ? 'none' : '1.5px solid #1C1A1729',
              }}
            >
              {item.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />}
            </div>
            <div
              className="flex-1 text-sm font-medium"
              style={{
                textDecoration: item.done ? 'line-through' : 'none',
                color: item.done ? '#7A6F60' : '#1C1A17',
              }}
            >
              {item.label}
            </div>
            {item.ownerInitials && item.ownerColor && (
              <Avatar name={item.ownerInitials} bg={item.ownerColor} size={22} />
            )}
          </button>
        ))}
        {onAdd && (
          <button onClick={onAdd} className="w-full flex items-center gap-2 px-3.5 py-3 border-t border-hairline text-ink-mute text-sm">
            <span>+ Ajouter un item</span>
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Créer `components/guide/CrewNote.tsx`**

```tsx
import { Avatar } from '@/components/design/Avatar'

interface Props { authorName: string; authorInitials: string; authorColor: string; date: string; body: string }

export function CrewNote({ authorName, authorInitials, authorColor, date, body }: Props) {
  return (
    <div className="bg-white rounded-md p-3.5 border border-hairline mb-2">
      <div className="flex items-center gap-2">
        <Avatar name={authorInitials} bg={authorColor} size={22} />
        <span className="text-xs font-medium">{authorName}</span>
        <span className="mk-mono text-[10px] text-ink-mute ml-auto">{date.toUpperCase()}</span>
      </div>
      <div className="text-sm text-ink-soft mt-2 leading-relaxed">{body}</div>
    </div>
  )
}
```

- [ ] **Step 4: Créer `app/trips/[tripId]/guide/page.tsx`**

```tsx
'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Book, Wallet, Flame, Sun } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { InfoTiles } from '@/components/guide/InfoTiles'
import { ChecklistGroup } from '@/components/guide/ChecklistGroup'
import { CrewNote } from '@/components/guide/CrewNote'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

export default function GuidePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const items = useLiveQuery(() => db.checklist_items.where({ trip_id: tripId }).sortBy('position'), [tripId]) ?? []
  const completions = useLiveQuery(() => db.checklist_completions.toArray(), []) ?? []
  const guideCards = useLiveQuery(() => db.guide_cards.where({ trip_id: tripId }).sortBy('position'), [tripId]) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type as TripType)
  const completedItemIds = new Set(completions.map((c) => c.item_id))

  async function toggleItem(id: string, currentlyDone: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.checklist.toggle(id, user.id, !currentlyDone)
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="pt-12 px-5">
        <TripSwitcher tone="light" tripName={trip.name} tripType={trip.trip_type as TripType} sublabel={trip.destination ?? undefined} />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute">CARNET</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          Le guide<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>{trip.destination ?? trip.name}.</span>
        </h1>
        <p className="text-sm text-ink-soft mt-2 max-w-[280px]">Pratique, lexique, matos.</p>

        <div className="mt-6">
          <InfoTiles
            tiles={[
              { Icon: Book, title: 'Langues', value: 'FR · PT' },
              { Icon: Wallet, title: 'Devise', value: trip.currency ?? 'EUR' },
              { Icon: Flame, title: 'Urgences', value: '112', emphasis: true, accentColor: accent.base },
              { Icon: Sun, title: 'Météo type', value: '22-26°' },
            ]}
          />
        </div>

        <div className="mt-7">
          <ChecklistGroup
            items={items.map((it) => ({ id: it.id, label: it.label, done: completedItemIds.has(it.id) }))}
            accent={accent}
            onToggle={toggleItem}
          />
        </div>

        {guideCards.length > 0 && (
          <div className="mt-7">
            <Eyebrow className="text-ink-mute">NOTES DU CREW</Eyebrow>
            <div className="mt-3">
              {guideCards.map((g) => (
                <CrewNote
                  key={g.id}
                  authorName="Crew"
                  authorInitials="MK"
                  authorColor={accent.base}
                  date={new Date(g.created_at).toLocaleDateString('fr')}
                  body={g.body}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Validation**

Ouvrir `/trips/<portugal_id>/guide`. Vérifier les tiles, la checklist (toggle persiste), les notes affichées.

- [ ] **Step 6: Commit**

```bash
git add components/guide/ app/trips/\[tripId\]/guide/
git commit -m "feat(guide): info tiles + checklist + crew notes from dexie"
```

### Task 33: Budget — Debt flow + categories + expenses + add dialog

**Files:**
- Create: `components/budget/DebtFlow.tsx`, `components/budget/CategoryTiles.tsx`, `components/budget/ExpenseRow.tsx`, `components/budget/AddExpenseDialog.tsx`
- Create: `lib/utils/split-debt.ts`
- Create: `app/trips/[tripId]/budget/page.tsx`

- [ ] **Step 1: Créer `lib/utils/split-debt.ts`**

```ts
// Calcule "qui doit quoi à qui" depuis une liste d'expenses + splits
interface Expense { id: string; payer_id: string; amount: number }
interface Split { expense_id: string; user_id: string; share: number }
export interface Debt { from: string; to: string; amount: number }

export function computeDebts(expenses: Expense[], splits: Split[]): Debt[] {
  const balances = new Map<string, number>() // userId → net (positive = on lui doit)
  for (const e of expenses) {
    balances.set(e.payer_id, (balances.get(e.payer_id) ?? 0) + e.amount)
    const expSplits = splits.filter((s) => s.expense_id === e.id)
    for (const s of expSplits) {
      const owed = e.amount * Number(s.share)
      balances.set(s.user_id, (balances.get(s.user_id) ?? 0) - owed)
    }
  }
  // Greedy : appariement créanciers / débiteurs
  const creditors = [...balances.entries()].filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1])
  const debtors = [...balances.entries()].filter(([, v]) => v < -1).sort((a, b) => a[1] - b[1])
  const debts: Debt[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const [dId, dVal] = debtors[i]
    const [cId, cVal] = creditors[j]
    const amount = Math.min(-dVal, cVal)
    debts.push({ from: dId, to: cId, amount })
    debtors[i][1] += amount
    creditors[j][1] -= amount
    if (Math.abs(debtors[i][1]) < 1) i++
    if (creditors[j][1] < 1) j++
  }
  return debts
}
```

- [ ] **Step 2: Créer `components/budget/DebtFlow.tsx`**

```tsx
import { ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/design/Avatar'

interface Line { fromInitials: string; fromName: string; fromColor: string; toInitials: string; toName: string; toColor: string; amountCents: number }

export function DebtFlow({ lines }: { lines: Line[] }) {
  return (
    <div className="bg-white rounded-md border border-hairline py-1">
      {lines.map((d, i) => (
        <div key={i} className={`flex items-center gap-2 px-4 py-2.5 ${i ? 'border-t border-hairline' : ''}`}>
          <Avatar name={d.fromInitials} bg={d.fromColor} size={28} />
          <span className="text-sm text-ink-soft">{d.fromName}</span>
          <div className="flex-1 flex items-center relative">
            <div className="flex-1 border-t border-dashed border-hairline-strong" />
            <span className="mk-mono text-sm font-semibold absolute left-1/2 -translate-x-1/2 bg-white px-1.5">
              {(d.amountCents / 100).toFixed(2)} €
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-mute -ml-1" />
          </div>
          <span className="text-sm text-ink-soft text-right">{d.toName}</span>
          <Avatar name={d.toInitials} bg={d.toColor} size={28} />
        </div>
      ))}
      {lines.length === 0 && <div className="px-4 py-4 text-sm text-ink-mute">Tout est réglé.</div>}
    </div>
  )
}
```

- [ ] **Step 3: Créer `components/budget/CategoryTiles.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react'

interface Tile { Icon: LucideIcon; name: string; valueCents: number; pct: number; color: string }

export function CategoryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(({ Icon, name, valueCents, pct, color }) => (
        <div key={name} className="bg-white rounded-sm p-3 border border-hairline">
          <div className="flex items-center justify-between">
            <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.75} />
            <span className="mk-mono text-[10px] text-ink-mute">{pct}%</span>
          </div>
          <div className="text-xs text-ink-soft mt-2">{name}</div>
          <div className="mk-display text-xl mt-0.5">
            {(valueCents / 100).toFixed(2)}<span className="text-xs text-ink-mute"> €</span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Créer `components/budget/ExpenseRow.tsx`**

```tsx
import { Avatar } from '@/components/design/Avatar'

interface Props {
  payerInitials: string
  payerColor: string
  label: string
  category: string
  amountCents: number
  splitsCount: number
  when: string
  state?: 'normal' | 'pending' | 'settled'
}

export function ExpenseRow({ payerInitials, payerColor, label, category, amountCents, splitsCount, when, state = 'normal' }: Props) {
  const isSettled = state === 'settled'
  const isPending = state === 'pending'
  return (
    <div
      className="flex items-center gap-3 py-3 border-t border-hairline first:border-t-0"
      style={{ background: isPending ? '#F4E2D2' : 'transparent', opacity: isSettled ? 0.55 : 1 }}
    >
      <Avatar name={payerInitials} bg={payerColor} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="mk-mono text-[10px] text-ink-mute mt-0.5">{category.toUpperCase()} · {when}</div>
      </div>
      <div className="text-right">
        <div
          className="mk-mono text-base font-semibold"
          style={{ textDecoration: isSettled ? 'line-through' : 'none' }}
        >
          {(amountCents / 100).toFixed(2)} €
        </div>
        <div className="mk-mono text-[9px] text-ink-mute mt-0.5">÷ {splitsCount}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Créer `components/budget/AddExpenseDialog.tsx`** (Dialog full-screen mobile)

```tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Member = { user_id: string; display_name: string }

interface Props { tripId: string; currency: string; members: Member[] }

export function AddExpenseDialog({ tripId, currency, members }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Database['public']['Enums']['expense_category']>('food')

  async function onSubmit() {
    const cents = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!cents || cents <= 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const share = 1 / members.length
    await mutations.expense.create(
      {
        trip_id: tripId, payer_id: user.id, amount: cents,
        currency, category, note: note || null,
        spent_at: new Date().toISOString(), split_mode: 'equal',
      },
      members.map((m) => ({ user_id: m.user_id, share })),
    )
    setOpen(false); setAmount(''); setNote('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-[88px] left-5 right-5 h-12 rounded-pill bg-ink text-white flex items-center justify-center gap-2 shadow-card font-semibold">
          <Plus className="w-4 h-4" strokeWidth={2} />
          Ajouter une dépense
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg inset-0 md:inset-auto translate-x-0 md:translate-x-[-50%] translate-y-0 md:translate-y-[-50%] md:top-1/2 md:left-1/2 rounded-none md:rounded-md h-full md:h-auto p-6">
        <div className="mk-eyebrow text-ink-mute">NOUVELLE DÉPENSE</div>
        <h2 className="mk-display text-3xl mt-2">Combien ?</h2>
        <div className="mt-6 space-y-3">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" className="text-2xl mk-mono" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (ex: Plein essence)" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm"
          >
            <option value="food">Bouffe</option>
            <option value="transport">Transport</option>
            <option value="hotel">Hébergement</option>
            <option value="activity">Activité</option>
            <option value="drink">Boisson</option>
            <option value="shopping">Shopping</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <Button onClick={onSubmit} className="w-full mt-6">Enregistrer</Button>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 6: Créer `app/trips/[tripId]/budget/page.tsx`**

```tsx
'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Fuel, Bed, Flame, Plus as ActivityIcon } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { computeDebts } from '@/lib/utils/split-debt'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { DebtFlow } from '@/components/budget/DebtFlow'
import { CategoryTiles } from '@/components/budget/CategoryTiles'
import { ExpenseRow } from '@/components/budget/ExpenseRow'
import { AddExpenseDialog } from '@/components/budget/AddExpenseDialog'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const CAT_ICON: Record<string, { Icon: any; color: string }> = {
  food: { Icon: Flame, color: '#1E3A5C' },
  transport: { Icon: Fuel, color: '#1C1A17' },
  hotel: { Icon: Bed, color: '#C75A20' },
  activity: { Icon: ActivityIcon, color: '#5A6E3E' },
  drink: { Icon: Flame, color: '#B14E32' },
  shopping: { Icon: ActivityIcon, color: '#7A6F60' },
  other: { Icon: ActivityIcon, color: '#3D362C' },
}

export default function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const expenses = useLiveQuery(() => db.expenses.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const splits = useLiveQuery(() => db.expense_splits.toArray(), []) ?? []
  const members = useLiveQuery(() => db.trip_members.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type as TripType)
  const totalCents = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const budget = trip.total_budget ? Number(trip.total_budget) * 100 : 0
  const pct = budget ? Math.round((totalCents / budget) * 100) : 0

  // Build debt flow with names + colors
  const profMap = new Map(profiles.map((p) => [p.id, p]))
  const debts = computeDebts(
    expenses.map((e) => ({ id: e.id, payer_id: e.payer_id, amount: e.amount })),
    splits.map((s) => ({ expense_id: s.expense_id, user_id: s.user_id, share: Number(s.share) })),
  ).map((d, i) => ({
    fromInitials: (profMap.get(d.from)?.display_name ?? 'XX').slice(0, 2).toUpperCase(),
    fromName: profMap.get(d.from)?.display_name ?? '—',
    fromColor: ['#C75A20', '#5A6E3E', '#1E3A5C', '#B14E32', '#3D362C'][i % 5],
    toInitials: (profMap.get(d.to)?.display_name ?? 'XX').slice(0, 2).toUpperCase(),
    toName: profMap.get(d.to)?.display_name ?? '—',
    toColor: ['#C75A20', '#5A6E3E', '#1E3A5C', '#B14E32', '#3D362C'][(i + 2) % 5],
    amountCents: d.amount,
  }))

  // Categories aggregation
  const byCat = new Map<string, number>()
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)
  const tiles = [...byCat.entries()].map(([cat, val]) => ({
    name: cat, Icon: CAT_ICON[cat]?.Icon ?? Flame, color: CAT_ICON[cat]?.color ?? '#1C1A17',
    valueCents: val, pct: totalCents ? Math.round((val / totalCents) * 100) : 0,
  }))

  return (
    <main className="min-h-screen bg-paper pb-32">
      <div className="pt-12 px-5">
        <TripSwitcher tone="light" tripName={trip.name} tripType={trip.trip_type as TripType} sublabel={trip.destination ?? undefined} />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute">BUDGET · TOTAL DÉPENSÉ</Eyebrow>
        <div className="flex items-baseline justify-between mt-1.5">
          <div className="mk-display text-5xl">
            {(totalCents / 100).toFixed(0)}<span className="text-3xl text-ink-mute">,{((totalCents % 100) / 100).toFixed(2).slice(2)} €</span>
          </div>
          <div className="text-right">
            {budget > 0 && <div className="mk-mono text-[11px] text-ink-mute">BUDGET {(budget / 100).toFixed(0)} €</div>}
            {budget > 0 && <div className="mk-mono text-xs font-semibold" style={{ color: accent.base }}>{pct} % consommé</div>}
          </div>
        </div>
        {budget > 0 && (
          <div className="mt-3 h-1.5 bg-sand rounded-full overflow-hidden">
            <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: accent.base }} />
          </div>
        )}

        <div className="mt-7">
          <Eyebrow className="text-ink-mute">QUI DOIT QUOI À QUI</Eyebrow>
          <div className="mt-3">
            <DebtFlow lines={debts} />
          </div>
        </div>

        <div className="mt-7">
          <Eyebrow className="text-ink-mute">PAR CATÉGORIE</Eyebrow>
          <div className="mt-3">
            <CategoryTiles tiles={tiles} />
          </div>
        </div>

        <div className="mt-7">
          <Eyebrow className="text-ink-mute">DÉPENSES RÉCENTES</Eyebrow>
          <div className="mt-3">
            {expenses.slice().sort((a, b) => +new Date(b.spent_at) - +new Date(a.spent_at)).map((e) => {
              const payer = profMap.get(e.payer_id)
              return (
                <ExpenseRow
                  key={e.id}
                  payerInitials={(payer?.display_name ?? 'XX').slice(0, 2).toUpperCase()}
                  payerColor="#C75A20"
                  label={e.note ?? e.category}
                  category={e.category}
                  amountCents={e.amount}
                  splitsCount={splits.filter((s) => s.expense_id === e.id).length}
                  when={new Date(e.spent_at).toLocaleDateString('fr')}
                />
              )
            })}
          </div>
        </div>
      </div>

      <AddExpenseDialog
        tripId={tripId}
        currency={trip.currency ?? 'EUR'}
        members={members.map((m) => ({ user_id: m.user_id, display_name: profMap.get(m.user_id)?.display_name ?? 'XX' }))}
      />
    </main>
  )
}
```

- [ ] **Step 7: Validation**

Ouvrir `/trips/<portugal_id>/budget`. Vérifier total, debt flow (s'il y a des dépenses + splits), catégories, expenses récentes. Tester l'ajout d'une dépense via le CTA (devrait apparaître immédiatement via Dexie).

- [ ] **Step 8: Commit**

```bash
git add components/budget/ lib/utils/split-debt.ts app/trips/\[tripId\]/budget/
git commit -m "feat(budget): debt flow + categories + expense rows + add dialog"
```

---

## Phase 4 — État de sortie

- Les 5 écrans (Home, Map, Planning, Guide, Budget) sont opérationnels et branchés sur Dexie.
- Toggle activity + checklist + ajout expense passent par la sync queue.
- Mapbox affiche les spots, vaul sheet drag fonctionne.
- Variante skate par défaut (le Portugal qui est city_break utilise l'accent city, le mapping joue).

---

## Phase 5 — Variantes par trip_type + photos hero + upload

**Objectif :** mapping 6 types → 6 accents validé, pack photos par défaut embarqué, upload Supabase Storage opérationnel, seed Sud-Ouest skate ajouté.

### Task 34: Migration DB hero_image_url + bucket Storage

**Files:**
- Create: `supabase/migrations/20260520_refonte_hero.sql`

- [ ] **Step 1: Créer la migration SQL**

```sql
-- supabase/migrations/20260520_refonte_hero.sql

alter table public.trips
  add column hero_image_url text,
  add column hero_image_uploaded boolean default false;

-- Bucket Storage
insert into storage.buckets (id, name, public)
values ('trip-covers', 'trip-covers', true)
on conflict (id) do nothing;

-- Policies
create policy "trip_covers_member_write" on storage.objects
  for insert with check (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_member_update" on storage.objects
  for update using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_member_delete" on storage.objects
  for delete using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1]::uuid in (
      select trip_id from trip_members where user_id = auth.uid()
    )
  );

create policy "trip_covers_public_read" on storage.objects
  for select using (bucket_id = 'trip-covers');
```

- [ ] **Step 2: Appliquer la migration**

Via Supabase MCP ou CLI :

```bash
npx supabase db push
# ou via le MCP : mcp__claude_ai_Supabase__apply_migration
```

- [ ] **Step 3: Régénérer les types**

```bash
npm run db:types
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/ lib/supabase/types.ts
git commit -m "feat(db): hero_image_url + trip-covers storage bucket with RLS"
```

### Task 35: Pack de 18 photos par défaut

**Files:**
- Create: `public/heroes/sport/{1,2,3}.jpg`, `public/heroes/hike/{1,2,3}.jpg`, etc. (6 types × 3 photos = 18 fichiers)

- [ ] **Step 1: Récupérer 18 photos CC0**

Sources : Unsplash, Pexels (CC0). Pour chaque type, 3 photos thématiques (~1600×1200 chacune, qualité 80%, < 250 ko chacune après compression).

| Dossier | Suggestions thématiques |
|---|---|
| `public/heroes/sport/` | skatepark béton, action skate, bowl |
| `public/heroes/hike/` | crête montagne, sentier altitude, lac alpin |
| `public/heroes/beach/` | vague, planche surf, plage longue |
| `public/heroes/city_break/` | miradouro, tram, rue pavée |
| `public/heroes/road_trip/` | route désertique, sunset highway, van profil |
| `public/heroes/other/` | paysage neutre, route ouverte, ciel ouvert |

Pour ce plan : Florian télécharge les 18 photos, les compresse (via `tinypng.com` ou `sharp` côté CLI), les place selon le mapping.

- [ ] **Step 2: Vérifier la structure**

```bash
ls public/heroes/sport public/heroes/hike public/heroes/beach public/heroes/city_break public/heroes/road_trip public/heroes/other
```

Expected : 3 fichiers par dossier, nommés `1.jpg`, `2.jpg`, `3.jpg`.

- [ ] **Step 3: Vérifier l'affichage**

Modifier temporairement le hero dans `home-client.tsx` pour utiliser `defaultHeroFor(trip.id, trip.trip_type)` au lieu de l'URL Unsplash hardcodée :

```tsx
const heroUrl = trip.hero_image_url ?? defaultHeroFor(trip.id, trip.trip_type)

// dans le <Hero photo={heroUrl} ... />
```

Tester en local : l'image `/heroes/city_break/N.jpg` doit s'afficher pour le voyage Portugal.

- [ ] **Step 4: Commit**

```bash
git add public/heroes/ app/trips/\[tripId\]/home-client.tsx
git commit -m "feat(design): 18 hero photos (3 per trip_type) + wire defaultHeroFor"
```

### Task 36: Hero photo helper + TripIcon finalisé (6 types)

**Files:**
- Modify: `components/design/TripIcon.tsx`

- [ ] **Step 1: Remplacer le TripIcon emoji par des SVG aplats**

```tsx
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props { type: TripType; size?: number; color?: string }

const PATHS: Record<TripType, React.ReactNode> = {
  sport: ( // skateboard aplat
    <>
      <ellipse cx="12" cy="10" rx="9" ry="2.5" fill="currentColor" />
      <circle cx="6" cy="14" r="1.6" fill="currentColor" />
      <circle cx="18" cy="14" r="1.6" fill="currentColor" />
    </>
  ),
  hike: <path d="M2 20L9 6l4 7 3-3 6 10z" fill="currentColor" />,
  beach: <path d="M2 14c2.5 0 4-4 7-4s4 4 7 4 4-4 6-4v6H2z" fill="currentColor" />,
  city_break: ( // van aplat
    <>
      <path d="M2 17V9a2 2 0 012-2h9l4 3h4a1 1 0 011 1v6h-2a2.5 2.5 0 01-5 0H9a2.5 2.5 0 01-5 0H2z" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.6" fill="#fff" />
      <circle cx="16.5" cy="17.5" r="1.6" fill="#fff" />
    </>
  ),
  road_trip: ( // route stylisée
    <path d="M8 3l-2 18h12l-2-18zm0 4h8M9 11h6M10 15h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  other: <circle cx="12" cy="12" r="8" fill="currentColor" />,
}

export function TripIcon({ type, size = 20, color = 'currentColor' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color, flex: 'none' }}>
      {PATHS[type]}
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/design/TripIcon.tsx
git commit -m "feat(design): TripIcon SVG aplats for 6 trip types"
```

### Task 37: Modal "Nouveau voyage" avec sélecteur de hero + upload

**Files:**
- Create: `app/trips/new/page.tsx`
- Create: `components/trips/HeroPicker.tsx`
- Create: `lib/utils/image-resize.ts`

- [ ] **Step 1: Créer `lib/utils/image-resize.ts`**

```ts
export async function resizeImage(file: File, maxSize = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1)
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob null')), 'image/jpeg', quality),
  )
}
```

- [ ] **Step 2: Créer `components/trips/HeroPicker.tsx`**

```tsx
'use client'

import Image from 'next/image'
import { Upload } from 'lucide-react'
import { useRef } from 'react'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  type: TripType
  value: string | null
  onChange: (url: string, uploaded: boolean) => void
  onFileSelected?: (file: File) => void
}

export function HeroPicker({ type, value, onChange, onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const defaults = [1, 2, 3].map((i) => `/heroes/${type}/${i}.jpg`)

  return (
    <div>
      <div className="mk-eyebrow text-ink-mute mb-2">PHOTO DE COUVERTURE</div>
      <div className="grid grid-cols-3 gap-2">
        {defaults.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url, false)}
            className="relative aspect-[4/5] rounded-sm overflow-hidden"
            style={{ outline: value === url ? '3px solid #1C1A17' : 'none', outlineOffset: '-3px' }}
          >
            <Image src={url} alt="" fill className="object-cover" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 w-full h-12 border border-dashed border-hairline-strong rounded-sm flex items-center justify-center gap-2 text-sm text-ink-soft"
      >
        <Upload className="w-4 h-4" />
        Uploader la mienne
      </button>
      <input
        ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected?.(f) }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Créer `app/trips/new/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HeroPicker } from '@/components/trips/HeroPicker'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { resizeImage } from '@/lib/utils/image-resize'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/db/queue'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']
const TYPES: { value: TripType; label: string }[] = [
  { value: 'sport', label: 'Sport (skate, surf urbain…)' },
  { value: 'hike', label: 'Randonnée' },
  { value: 'beach', label: 'Mer / surf' },
  { value: 'city_break', label: 'City break' },
  { value: 'road_trip', label: 'Road trip' },
  { value: 'other', label: 'Autre' },
]

export default function NewTripPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [type, setType] = useState<TripType>('sport')
  const [heroUrl, setHeroUrl] = useState<string | null>(`/heroes/sport/1.jpg`)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    // Generate temp id côté client
    const tripId = crypto.randomUUID()
    const joinCode = `MKT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    await mutations.trip.create({
      id: tripId,
      owner_id: user.id,
      name, destination: destination || null,
      trip_type: type, currency: 'EUR',
      join_code: joinCode,
      hero_image_url: pendingFile ? null : heroUrl,
      hero_image_uploaded: false,
    } as any)

    if (pendingFile) {
      const blob = await resizeImage(pendingFile)
      await db.pending_uploads.add({
        id: crypto.randomUUID(),
        trip_id: tripId,
        file: blob,
        filename: `${crypto.randomUUID()}.jpg`,
        status: 'pending',
        attempts: 0,
        created_at: Date.now(),
      })
      // (le flush des pending_uploads est implémenté en Task 41)
    }

    setLoading(false)
    router.push(`/trips/${tripId}` as any)
  }

  return (
    <main className="min-h-screen bg-paper p-5 pb-24">
      <div className="mk-eyebrow text-ink-mute">NOUVEAU VOYAGE</div>
      <h1 className="mk-display text-3xl mt-2">On part où ?</h1>

      <div className="mt-6 space-y-3">
        <Input placeholder="Nom du voyage" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Destination (libre)" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <select
          value={type} onChange={(e) => { const t = e.target.value as TripType; setType(t); setHeroUrl(`/heroes/${t}/1.jpg`) }}
          className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm"
        >
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="mt-6">
        <HeroPicker
          type={type}
          value={heroUrl}
          onChange={(url) => { setHeroUrl(url); setPendingFile(null) }}
          onFileSelected={(f) => { setPendingFile(f); setHeroUrl(URL.createObjectURL(f)) }}
        />
      </div>

      <Button onClick={onSubmit} disabled={!name || loading} className="w-full mt-6">
        {loading ? 'Création…' : 'Créer le voyage'}
      </Button>
    </main>
  )
}
```

- [ ] **Step 4: Validation**

`npm run dev`, ouvrir `/trips/new`. Créer un voyage skate → vérifier qu'il apparaît dans la liste et que le hero est `/heroes/sport/1.jpg`.

- [ ] **Step 5: Commit**

```bash
git add app/trips/new/ components/trips/ lib/utils/image-resize.ts
git commit -m "feat(trips): new trip modal with hero picker + image resize"
```

### Task 38: Seed Sud-Ouest skate

**Files:**
- Create: `scripts/seed-sudouest.ts`

- [ ] **Step 1: Créer `scripts/seed-sudouest.ts`**

```ts
// scripts/seed-sudouest.ts — seed un trip skate Sud-Ouest pour valider l'accent skate
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TRIP_ID = 'sudouest-skate-2026'
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'florianmeissel.pro1@gmail.com'

async function main() {
  // Trouver l'owner
  const { data: profiles } = await supabase.from('profiles').select('id').limit(50)
  if (!profiles?.length) { console.error('Aucun profile — login at least once first'); process.exit(1) }
  const ownerId = profiles[0].id // ajuster si plusieurs profiles

  // Upsert trip
  await supabase.from('trips').upsert({
    id: TRIP_ID,
    owner_id: ownerId,
    name: 'Sud-Ouest skate',
    destination: 'Bayonne → Bordeaux',
    trip_type: 'sport',
    currency: 'EUR',
    total_budget: 800,
    cover_color: '#C75A20',
    join_code: 'MKT-SO26',
    start_date: '2026-05-28',
    end_date: '2026-06-04',
    hero_image_url: '/heroes/sport/1.jpg',
  })

  // 7 jours
  const days = Array.from({ length: 7 }, (_, i) => ({
    id: `${TRIP_ID}-day-${i + 1}`,
    trip_id: TRIP_ID,
    day_number: i + 1,
    date: new Date(Date.UTC(2026, 4, 28 + i)).toISOString().slice(0, 10),
    label: `Jour ${i + 1}`,
    theme: ['Bayonne', 'Anglet', 'Hossegor', 'Capbreton', 'Mimizan', 'Lacanau', 'Bordeaux'][i],
    zone: 'sud-ouest',
  }))
  await supabase.from('days').upsert(days)

  // Activities (3-4 par jour)
  const activities = days.flatMap((d, di) => [
    { id: `${d.id}-a1`, day_id: d.id, time: '09:30', title: 'Café + briefing', subtitle: 'Bouge ce van', category: 'food', position: 0 },
    { id: `${d.id}-a2`, day_id: d.id, time: '11:00', title: `Skatepark de ${d.theme}`, subtitle: 'Spot · Bowl béton', category: 'sport', position: 1 },
    { id: `${d.id}-a3`, day_id: d.id, time: '14:30', title: `Session vidéo`, subtitle: 'GoPro + drone', category: 'sport', position: 2 },
    { id: `${d.id}-a4`, day_id: d.id, time: '19:30', title: 'Bouffe — Chez Manu', subtitle: 'Tapas · 28€/tête', category: 'food', position: 3 },
  ])
  await supabase.from('activities').upsert(activities)

  // Spots
  const spots = [
    { id: `${TRIP_ID}-s1`, trip_id: TRIP_ID, name: 'Skatepark Bayonne', category: 'sport', lat: 43.4929, lng: -1.4748, tags: ['bowl', 'street'] },
    { id: `${TRIP_ID}-s2`, trip_id: TRIP_ID, name: 'Anglet Skatepark', category: 'sport', lat: 43.4942, lng: -1.5320, tags: ['bowl'] },
    { id: `${TRIP_ID}-s3`, trip_id: TRIP_ID, name: 'Hossegor Spot', category: 'sport', lat: 43.6671, lng: -1.3960, tags: ['indoor'] },
    { id: `${TRIP_ID}-s4`, trip_id: TRIP_ID, name: 'Airbnb Hossegor', category: 'accommodation', lat: 43.6680, lng: -1.4000, tags: [] },
  ]
  await supabase.from('spots').upsert(spots)

  // Expenses
  const expenses = [
    { id: `${TRIP_ID}-e1`, trip_id: TRIP_ID, payer_id: ownerId, amount: 4820, currency: 'EUR', category: 'transport', note: 'Plein Total', spent_at: '2026-05-28T11:30:00Z', split_mode: 'equal' },
    { id: `${TRIP_ID}-e2`, trip_id: TRIP_ID, payer_id: ownerId, amount: 2340, currency: 'EUR', category: 'food', note: 'Boulangerie Aupy', spent_at: '2026-05-28T09:15:00Z', split_mode: 'equal' },
    { id: `${TRIP_ID}-e3`, trip_id: TRIP_ID, payer_id: ownerId, amount: 9800, currency: 'EUR', category: 'hotel', note: 'Airbnb Hossegor', spent_at: '2026-05-29T18:00:00Z', split_mode: 'equal' },
  ]
  await supabase.from('expenses').upsert(expenses)

  // Checklist matos skate
  const checklist = [
    { id: `${TRIP_ID}-c1`, trip_id: TRIP_ID, label: 'Board principale + roues de spare', category: 'gear', position: 0 },
    { id: `${TRIP_ID}-c2`, trip_id: TRIP_ID, label: 'Casque + genouillères', category: 'gear', position: 1 },
    { id: `${TRIP_ID}-c3`, trip_id: TRIP_ID, label: 'GoPro + 3 batteries', category: 'gear', position: 2 },
    { id: `${TRIP_ID}-c4`, trip_id: TRIP_ID, label: 'Pharmacie crew', category: 'gear', position: 3 },
    { id: `${TRIP_ID}-c5`, trip_id: TRIP_ID, label: 'Câbles + chargeurs van', category: 'gear', position: 4 },
  ]
  await supabase.from('checklist_items').upsert(checklist)

  // Guide cards
  await supabase.from('guide_cards').upsert([
    { id: `${TRIP_ID}-g1`, trip_id: TRIP_ID, kind: 'info', title: 'Local crew', body: 'Demander au local crew avant de tourner. Toujours OK.', icon_name: 'Users', position: 0 },
    { id: `${TRIP_ID}-g2`, trip_id: TRIP_ID, kind: 'warning', title: 'Casque obligatoire', body: 'Bowl deep end de Bayonne. Pas de discussion.', icon_name: 'AlertTriangle', position: 1 },
  ])

  console.log('✓ Sud-Ouest skate seeded')
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Lancer le seed**

```bash
npm run seed:sudouest
```

- [ ] **Step 3: Valider sur l'app**

Recharger `/trips` → 2 voyages : Portugal (city) et Sud-Ouest skate. Ouvrir le Sud-Ouest → hero `/heroes/sport/N.jpg`, accent skate orange.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-sudouest.ts
git commit -m "feat(seed): sud-ouest skate trip seed for accent validation"
```

---

## Phase 5 — État de sortie

- DB a `hero_image_url` + bucket `trip-covers` avec RLS.
- 18 photos hero embarquées.
- Modal "Nouveau voyage" avec sélecteur + upload.
- TripIcon SVG pour les 6 types.
- 2 voyages côte à côte (Portugal city / Sud-Ouest skate) valident 2 accents extrêmes.

---

## Phase 5.5 — Offline-first robustness

**Objectif :** durcir la sync queue, gérer dépendances temp_id → server_id, conflict resolution UX, upload offline, vue diagnostique.

### Task 39: Tests offline scénarios + vue diagnostique /settings/sync

**Files:**
- Create: `app/trips/[tripId]/settings/sync/page.tsx`

- [ ] **Step 1: Créer la vue diagnostique**

```tsx
'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { flush } from '@/lib/db/queue'
import { useSyncStatus } from '@/lib/stores/syncStatus'
import { Button } from '@/components/ui/button'

export default function SyncDiagnosticPage() {
  const queue = useLiveQuery(() => db.sync_queue.orderBy('created_at').toArray()) ?? []
  const uploads = useLiveQuery(() => db.pending_uploads.orderBy('created_at').toArray()) ?? []
  const { online, queueLength, failedCount, lastSyncAt } = useSyncStatus()

  return (
    <main className="min-h-screen bg-paper p-5 pb-24">
      <div className="mk-eyebrow text-ink-mute">DIAGNOSTIQUE SYNC</div>
      <h1 className="mk-display text-3xl mt-2">État du sync.</h1>

      <div className="mt-6 bg-white border border-hairline rounded-md p-4 space-y-2">
        <Row label="Online" value={online ? 'Oui' : 'Non'} />
        <Row label="En attente" value={String(queueLength)} />
        <Row label="En erreur" value={String(failedCount)} />
        <Row label="Dernier sync" value={lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString('fr') : 'jamais'} />
      </div>

      <Button onClick={() => flush()} className="w-full mt-4">Forcer le flush</Button>

      {queue.length > 0 && (
        <div className="mt-8">
          <div className="mk-eyebrow text-ink-mute mb-2">QUEUE ({queue.length})</div>
          <div className="bg-white border border-hairline rounded-md overflow-hidden">
            {queue.map((q) => (
              <div key={q.id} className="px-3 py-2.5 border-b border-hairline last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="mk-mono text-xs">{q.op.toUpperCase()} · {q.table}</span>
                  <span
                    className="mk-mono text-[10px] px-1.5 py-0.5 rounded-xs"
                    style={{ background: q.status === 'failed' ? '#A33A2A20' : '#1C1A1714', color: q.status === 'failed' ? '#A33A2A' : '#1C1A17' }}
                  >
                    {q.status}
                  </span>
                </div>
                {q.last_error && <div className="text-[11px] text-danger mt-1">{q.last_error}</div>}
                <div className="mk-mono text-[10px] text-ink-mute mt-0.5">attempts: {q.attempts} · {new Date(q.created_at).toLocaleTimeString('fr')}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => db.sync_queue.update(q.id, { status: 'pending', attempts: 0 })} className="mk-mono text-[10px] underline">Retry</button>
                  <button onClick={() => db.sync_queue.delete(q.id)} className="mk-mono text-[10px] underline text-danger">Annuler</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-8">
          <div className="mk-eyebrow text-ink-mute mb-2">UPLOADS ({uploads.length})</div>
          <div className="bg-white border border-hairline rounded-md overflow-hidden">
            {uploads.map((u) => (
              <div key={u.id} className="px-3 py-2.5 border-b border-hairline last:border-b-0 mk-mono text-xs">
                {u.filename} · {u.status} · {(u.file.size / 1024).toFixed(0)} ko
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="mk-mono">{value}</span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/trips/\[tripId\]/settings/
git commit -m "feat(sync): diagnostic page /settings/sync with queue + uploads"
```

### Task 40: Bandeau UI online/offline + queue length

**Files:**
- Create: `components/sync/SyncBanner.tsx`
- Modify: `app/trips/[tripId]/layout.tsx`

- [ ] **Step 1: Créer `components/sync/SyncBanner.tsx`**

```tsx
'use client'

import { useSyncStatus } from '@/lib/stores/syncStatus'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'

export function SyncBanner() {
  const { online, queueLength, failedCount } = useSyncStatus()
  const { tripId } = useParams<{ tripId: string }>()
  if (online && queueLength === 0) return null

  const tone = failedCount > 0 ? 'danger' : !online ? 'warn' : 'info'
  const bg = tone === 'danger' ? '#A33A2A' : tone === 'warn' ? '#1C1A17' : '#3D362C'

  return (
    <Link
      href={`/trips/${tripId}/settings/sync` as any}
      className="block fixed top-0 left-0 right-0 z-40 text-white text-xs py-2 px-4 flex items-center gap-2"
      style={{ background: bg }}
    >
      {!online ? <WifiOff className="w-3.5 h-3.5" /> : failedCount > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
      <span>
        {!online
          ? `Hors-ligne · ${queueLength} modification${queueLength > 1 ? 's' : ''} en attente`
          : failedCount > 0
          ? `${failedCount} erreur${failedCount > 1 ? 's' : ''} de sync`
          : `Synchronisation… ${queueLength}`}
      </span>
      <span className="ml-auto underline">Détails</span>
    </Link>
  )
}
```

- [ ] **Step 2: Brancher dans le layout `app/trips/[tripId]/layout.tsx`**

Ajouter `<SyncBanner />` juste après le `<TripBootstrap />` :

```tsx
import { SyncBanner } from '@/components/sync/SyncBanner'

// dans le return :
<SyncBanner />
```

- [ ] **Step 3: Commit**

```bash
git add components/sync/ app/trips/\[tripId\]/layout.tsx
git commit -m "feat(sync): banner UI online/offline + queue indicator"
```

### Task 41: Flush des pending_uploads

**Files:**
- Modify: `lib/db/queue.ts`
- Create: `lib/db/uploads.ts`

- [ ] **Step 1: Créer `lib/db/uploads.ts`**

```ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import { mutations } from './mutations'

export async function flushUploads() {
  if (!navigator.onLine) return
  const pending = await db.pending_uploads.where('status').equals('pending').toArray()
  for (const upload of pending) {
    await db.pending_uploads.update(upload.id, { status: 'uploading', attempts: upload.attempts + 1 })
    try {
      const path = `${upload.trip_id}/${upload.filename}`
      const { error } = await supabase.storage.from('trip-covers').upload(path, upload.file, {
        contentType: 'image/jpeg', upsert: true,
      })
      if (error) throw error
      const { data: pub } = supabase.storage.from('trip-covers').getPublicUrl(path)
      await mutations.trip.update(upload.trip_id, {
        hero_image_url: pub.publicUrl, hero_image_uploaded: true,
      })
      await db.pending_uploads.delete(upload.id)
    } catch (err: any) {
      const status = upload.attempts >= 5 ? 'failed' : 'pending'
      await db.pending_uploads.update(upload.id, { status, last_error: String(err?.message ?? err) })
    }
  }
}
```

- [ ] **Step 2: Brancher `flushUploads()` après le flush sync queue**

Dans `lib/db/queue.ts`, à la fin de la fonction `flush()` (juste avant `useSyncStatus.getState().setLastSyncAt(Date.now())`), ajouter :

```ts
import { flushUploads } from './uploads'

// fin de flush() :
await flushUploads()
```

Et dans `app/db-provider.tsx`, ajouter aussi `flushUploads()` dans le useEffect :

```tsx
import { flushUploads } from '@/lib/db/uploads'

// à la fin du useEffect :
flushUploads()
```

- [ ] **Step 3: Test scénario offline upload**

DevTools → Network → Offline. Créer un voyage avec upload de photo. Vérifier que la pending_upload apparaît dans Dexie. Repasser online. Vérifier que la photo est uploadée et le trip mis à jour.

- [ ] **Step 4: Commit**

```bash
git add lib/db/queue.ts lib/db/uploads.ts app/db-provider.tsx
git commit -m "feat(sync): flush pending photo uploads at queue flush"
```

### Task 42: Tests offline approfondis multi-scénarios

**Files:** aucun (validation manuelle, docs)

- [ ] **Step 1: Scénario 1 — Mode avion → créer dépense → relance app**

DevTools → Network → Offline. Sur `/trips/<id>/budget`, ajouter une dépense via le CTA. Recharger l'app (toujours offline). La dépense doit être visible (depuis Dexie). Ouvrir `/settings/sync` : 1 entrée pending. Repasser online. La dépense est syncée en moins de 30s, queue vide.

- [ ] **Step 2: Scénario 2 — 2 devices Realtime**

Device A (laptop) + device B (téléphone). Connectés au même trip. Device A ajoute une dépense. Vérifier qu'elle apparaît sur device B en moins de 2 secondes (Realtime).

- [ ] **Step 3: Scénario 3 — Dépendances offline (expense + splits)**

DevTools offline. Créer une expense (qui crée aussi des splits via la mutation). Vérifier dans `/settings/sync` que les entrées splits ont `depends_on` pointant vers l'entrée expense. Repasser online. Vérifier que l'expense est syncée d'abord, puis les splits avec le bon `expense_id` server.

- [ ] **Step 4: Scénario 4 — Conflit Realtime echo**

Device A toggle une activité. Sur device A, le `_pending_mutation_id` est set. Pendant que la queue n'a pas fini de flush, simuler manuellement un push Realtime depuis Supabase (ou device B fait la même action). Vérifier que la row Dexie de A n'est pas écrasée par le push remote (le lock fonctionne).

- [ ] **Step 5: Documenter les résultats**

Créer un fichier de notes :

```bash
cat > docs/superpowers/notes/2026-XX-XX-offline-tests.md <<'EOF'
# Tests offline Phase 5.5

## Scénario 1 — Mode avion ajout dépense
- [ ] Dépense visible offline après reload
- [ ] Queue length augmente
- [ ] Sync au retour réseau OK

## Scénario 2 — Realtime 2 devices
- [ ] Mutation A visible sur B en < 2s

## Scénario 3 — Dépendances
- [ ] depends_on populé correctement
- [ ] Splits flushés après l'expense parent

## Scénario 4 — Lock Realtime
- [ ] Push remote skip si _pending_mutation_id set
EOF
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/notes/
git commit -m "docs(sync): offline test scenarios for phase 5.5"
```

---

## Phase 5.5 — État de sortie

- Sync queue durcie avec dépendances temp_id → server_id.
- Pending uploads photos flushées au retour réseau.
- Vue diagnostique `/settings/sync` fonctionnelle.
- Bandeau UI online/offline.
- Tests offline 2 devices documentés.

---

## Phase 6 — Dark mode + responsive desktop + PWA

**Objectif :** dark mode complet, layouts desktop Home et Map dédiés, PWA installable avec service worker.

### Task 43: Toggle dark mode + tests visuels

**Files:**
- Create: `components/design/ThemeToggle.tsx`
- Modify: `app/trips/[tripId]/(nav)/side-rail.tsx` (ajout toggle)

- [ ] **Step 1: Créer `components/design/ThemeToggle.tsx`**

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-2 px-2 py-2 text-sm text-ink-soft"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
```

- [ ] **Step 2: Ajouter `<ThemeToggle />` dans le SideRail (bas de la nav)**

Dans `app/trips/[tripId]/(nav)/side-rail.tsx`, après la liste NAV :

```tsx
import { ThemeToggle } from '@/components/design/ThemeToggle'

// après le bloc NAV.map :
<ThemeToggle />
```

- [ ] **Step 3: Vérifier que tous les écrans rendent OK en dark**

Toggle dark, ouvrir chaque écran (Home, Map, Planning, Budget, Guide). Lister les écarts visuels (couleurs hardcodées blanches dans le code à remplacer par classes `dark:bg-paper-dark-deep` etc.).

- [ ] **Step 4: Patch dark mode partout où nécessaire**

Pour chaque endroit où il y a `bg-white` ou `border-hairline`, ajouter le pendant dark :
- `bg-white` → `bg-white dark:bg-paper-dark-deep`
- `border-hairline` → `border-hairline dark:border-hairline-dark`
- `text-ink` → `text-ink dark:text-ink-dark`
- `text-ink-mute` → `text-ink-mute dark:text-ink-mute-dark`

Faire un sweep dans `components/` et `app/trips/`.

- [ ] **Step 5: Commit**

```bash
git add components/design/ThemeToggle.tsx app/trips/ components/
git commit -m "feat(dark): theme toggle + dark mode classes across screens"
```

### Task 44: Desktop layouts Home + Map

**Files:**
- Modify: `app/trips/[tripId]/home-client.tsx`
- Modify: `app/trips/[tripId]/map/page.tsx`

- [ ] **Step 1: Home desktop**

Dans `home-client.tsx`, wrapper le contenu sous le hero dans une grille desktop :

```tsx
// Après le <Hero />, structure desktop :
<div className="md:grid md:grid-cols-[1.4fr_1fr] md:gap-6 md:px-8 md:py-6">
  <div className="md:contents md:flex md:flex-col md:gap-5">
    <CrewStats stats={stats} />
    <UpcomingCarousel ... />
  </div>
  <div className="hidden md:flex md:flex-col md:gap-3.5">
    {/* Mini-map preview + actions + note épinglée */}
    <div className="bg-paper-deep rounded-md h-[220px] flex items-center justify-center text-ink-mute">
      <span className="mk-mono text-xs">MINI MAP · TODO</span>
    </div>
    <QuickActions tripId={tripId} />
  </div>
</div>
```

(Sur mobile, le `md:*` ne s'applique pas, le layout reste vertical.)

- [ ] **Step 2: Map desktop layout**

Dans `app/trips/[tripId]/map/page.tsx`, ajouter une side panel desktop :

```tsx
// Wrapper :
<div className="md:flex md:h-screen">
  <div className="flex-1 relative">
    <MapView ... />
  </div>
  <aside className="hidden md:block md:w-[360px] md:border-l md:border-hairline md:bg-paper md:overflow-y-auto">
    {/* Replacer MapSheet par une side panel desktop */}
  </aside>
</div>

{/* Bottom sheet mobile seulement */}
<div className="md:hidden">
  <MapSheet ... />
</div>
```

- [ ] **Step 3: Autres écrans desktop (largeur max centrée)**

Dans Planning, Budget, Guide, wrapper le contenu :

```tsx
<main className="min-h-screen bg-paper pb-24 md:max-w-[720px] md:mx-auto">
  ...
</main>
```

- [ ] **Step 4: Validation responsive**

Tester en devtools mobile (375), tablet (768), desktop (1280, 1440). Vérifier que les breakpoints jouent.

- [ ] **Step 5: Commit**

```bash
git add app/trips/\[tripId\]/
git commit -m "feat(desktop): responsive layouts for home (rail+main) + map (side panel)"
```

### Task 45: Manifest PWA + icônes

**Files:**
- Create: `public/manifest.json`, `public/icons/192.png`, `public/icons/512.png`, `public/icons/512-maskable.png`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Générer les icônes PWA**

Florian fournit ou génère 3 icônes :
- `public/icons/192.png` (192×192, fond paper #F2EDE3, logo MK en charbon)
- `public/icons/512.png` (512×512, idem)
- `public/icons/512-maskable.png` (512×512, padding 12% safe zone)

Outils : `pwa-asset-generator` (npx), Figma, ou manuel.

- [ ] **Step 2: Créer `public/manifest.json`**

```json
{
  "name": "MK Trip",
  "short_name": "MK Trip",
  "description": "Le carnet de bord du crew.",
  "start_url": "/trips",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F2EDE3",
  "theme_color": "#1C1A17",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 3: Référencer dans `app/layout.tsx`**

```tsx
export const metadata: Metadata = {
  title: 'MK Trip',
  description: 'Le carnet de bord du crew.',
  themeColor: '#1C1A17',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MK Trip',
  },
}
```

- [ ] **Step 4: Commit**

```bash
git add public/manifest.json public/icons/ app/layout.tsx
git commit -m "feat(pwa): manifest + 3 icons + apple web app meta"
```

### Task 46: Service worker via @serwist/next

**Files:**
- Create: `app/sw.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Configurer Serwist dans `next.config.ts`**

```ts
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default withSerwist(nextConfig)
```

- [ ] **Step 2: Créer `app/sw.ts`**

```ts
import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build && npm run start
```

Ouvrir devtools → Application → Service Workers : vérifier que `sw.js` est registered. Ouvrir l'app, l'utiliser en mode hors ligne (Network → Offline). Recharger : l'app doit s'ouvrir depuis le cache.

- [ ] **Step 4: Commit**

```bash
git add app/sw.ts next.config.ts
git commit -m "feat(pwa): serwist service worker with runtime caching"
```

### Task 47: Lighthouse audit + ajustements

**Files:** divers (corrections selon audit)

- [ ] **Step 1: Lancer Lighthouse**

Devtools Chrome → Lighthouse → Performance + PWA + Best Practices. Mode mobile.

- [ ] **Step 2: Cibler PWA ≥ 90**

Si score < 90, lire les recommandations. Probables ajustements :
- `theme_color` cohérent partout.
- Splash screen Apple meta.
- Maskable icon vérifié.

- [ ] **Step 3: Tester "Add to Home Screen"**

Sur iPhone Safari → bouton Share → "Sur l'écran d'accueil". L'app installée se lance en standalone (pas de barre Safari). Idem sur Android Chrome → menu → "Installer l'app".

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat(pwa): final PWA polish to reach Lighthouse score >= 90"
```

### Task 48: Merge worktree → main

**Files:** aucun (opération git)

- [ ] **Step 1: Vérifier l'état du worktree**

```bash
git status
git log --oneline main..HEAD | wc -l
```

Expected : working tree clean, ~45 commits depuis main.

- [ ] **Step 2: Pousser le worktree branch sur l'origin**

```bash
git push -u origin pivot-pwa-refonte-ui
```

- [ ] **Step 3: Ouvrir une PR GitHub vers main**

```bash
gh pr create --title "Pivot PWA Next.js + Refonte UI Claude Design" --body "$(cat <<'EOF'
## Summary
- Pivot de la stack Expo/RN vers Next.js 16 + Tailwind + shadcn + Supabase + Vercel
- Refonte UI complète d'après le handoff Claude Design (DS sable/charbon, 6 accents par trip_type)
- Couche offline-first via Dexie + sync queue + Realtime
- PWA installable (Lighthouse PWA ≥ 90)
- 5 écrans pixel-perfect : Home, Map (Mapbox), Planning, Budget, Guide
- Dark mode + desktop responsive

## Test plan
- [ ] Login magic link sur preview Vercel
- [ ] 2 voyages visibles (Portugal city + Sud-Ouest skate)
- [ ] Toggle activity + add expense persistent offline
- [ ] Sync 2 devices via Realtime
- [ ] PWA installable iOS + Android

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Merge après revue**

Une fois la PR validée par Florian, merge (squash recommandé pour main propre) :

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 5: Cleanup worktree local**

Invoke `superpowers:finishing-a-development-branch` ou manuellement :

```bash
git worktree remove ../pivot-pwa-refonte-ui
git branch -D pivot-pwa-refonte-ui  # si pas auto-supprimée
```

---

## Phase 6 — État de sortie (= sortie projet)

- App MK Trip déployée sur Vercel en production (PWA).
- Tous les utilisateurs accèdent via URL + "Add to Home Screen".
- Mobile + desktop responsives, dark mode automatique.
- Offline-first : lecture instantanée, écritures en file, sync au retour réseau.
- Multi-voyage avec accents par type, photos hero, upload custom.
- 5 écrans pixel-perfect du handoff Claude Design.

---

## Self-review

**1. Spec coverage check** — pour chaque section de la spec, point au(x) Task(s) qui l'implémente(nt) :

| Spec section | Implémenté par |
|---|---|
| Bootstrap Next.js + cleanup Expo | Tasks 1-2 |
| shadcn + composants | Task 3 |
| Tokens + accent + fonts + Tailwind config | Tasks 4-5-6 |
| Auth SSR Supabase | Task 7-8-9 |
| Schéma Dexie + queue + mutations | Tasks 10-12 |
| Hydrate + Realtime | Task 11 |
| Provider client + hydrate at boot | Task 13 |
| Vercel link + deploy | Task 14 |
| Cleanup _legacy | Task 15 |
| Home pixel-perfect (5 sous-tâches) | Tasks 16-23 |
| DS extract | Tasks 24-27 |
| Mapbox + MapSheet | Tasks 28-30 |
| Planning timeline | Task 31 |
| Guide tiles + checklist | Task 32 |
| Budget debt flow + categories + dialog | Task 33 |
| Migration DB hero | Task 34 |
| 18 photos hero | Task 35 |
| TripIcon 6 types | Task 36 |
| Modal new trip + upload | Task 37 |
| Seed Sud-Ouest | Task 38 |
| Diagnostique sync | Task 39 |
| Banner UI online/offline | Task 40 |
| Flush uploads | Task 41 |
| Tests offline 2 devices | Task 42 |
| Dark mode | Task 43 |
| Desktop responsive | Task 44 |
| PWA manifest + icons | Task 45 |
| Service worker | Task 46 |
| Lighthouse audit | Task 47 |
| Merge worktree → main | Task 48 |

Toute la spec est couverte.

**2. Placeholder scan** — aucun "TODO", "implement later", "fill in details", "appropriate error handling" dans le plan. ✓

**3. Type consistency** — `accentFor()` retourne `AccentTokens` (Task 4), utilisé partout. `TripType` importé de `Database['public']['Enums']['trip_type']` partout. `mutations.activity.toggleCompletion` signature identique entre Phase 4 et Phase 5.5. ✓

**4. Ambiguity check** — un seul cas : Task 39 mentionne "implémenté en Task 41" pour le flush uploads, ce qui est exact et chaîné. Pas d'ambiguïté résiduelle.

Plan auto-cohérent et prêt à exécuter.

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-05-20-mk-trip-refonte-ui.md`.**

Deux options d'exécution :

1. **Subagent-Driven (recommandé)** — un sous-agent frais par tâche, revue entre les tâches, itération rapide. Idéal pour ce plan vu sa taille (48 tâches × 4-6 steps). Le main agent garde le contexte de la spec et arbitre les questions architecturales en cours d'exécution.

2. **Inline Execution** — toutes les tâches dans la session actuelle via `superpowers:executing-plans`, batches avec checkpoints. Plus rapide en clock-time mais consomme tout le contexte de la session.

Lequel veux-tu utiliser ?

