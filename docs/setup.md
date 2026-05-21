# MK Trip — Setup dev

## Prérequis

- Node 20+
- Compte Expo (`npx eas-cli login`)
- Compte Supabase avec un projet `MK Trip` provisionné
- Android device ou émulateur (iOS optionnel)

## Première installation

1. `npm install` (le `.npmrc` du projet active `legacy-peer-deps` pour la beta v3 de Legend State)
2. Copier `.env.example` vers `.env.local` et remplir les valeurs depuis le dashboard Supabase :
   - `EXPO_PUBLIC_SUPABASE_URL` (Settings → API → Project URL)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Settings → API → anon public — la clé publique est sécurisée par RLS, pas un secret)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role — **secret**, ne JAMAIS la committer, ne jamais préfixer `EXPO_PUBLIC_`)
   - `SUPABASE_PROJECT_REF` (le sous-domaine de l'URL projet : `https://<ref>.supabase.co`)
3. EAS dev build (une seule fois, et à refaire seulement quand on ajoute un module natif) :
   ```bash
   npx eas-cli login
   npx eas-cli init           # si pas déjà fait
   npx eas-cli build --profile development --platform android
   ```
4. Installer l'APK retourné sur le device Android, puis :
   ```bash
   npx expo start --dev-client
   ```

## Configuration Supabase post-création

Dans le dashboard Supabase de MK Trip :

- **Authentication → URL Configuration**
  - Site URL : `mktrip://`
  - Redirect URLs (ajouter) : `mktrip://auth-callback`, `mktrip://*`
- **Database → SQL Editor** : appliquer la migration `supabase/migrations/20260520000000_initial.sql` (copier-coller le contenu, run)

## Seed du voyage démo Portugal

1. Se connecter une fois via l'app (login magic link) pour créer le user dans `auth.users`
2. Lancer le seed :
   ```bash
   npm run seed:portugal -- ton-email@example.com
   ```
3. Le script print le `Trip ID` et le `join_code` (`MKT-XXXX`) — utilisable pour rejoindre depuis un autre device

## Régénération des types TypeScript

Après une modification du schéma DB :

```powershell
$env:SUPABASE_PROJECT_REF='<ref>'
npx supabase login            # une seule fois
npx supabase gen types typescript --project-id $env:SUPABASE_PROJECT_REF > lib/types.ts
```

(Le stub actuel `lib/types.ts` est `export type Database = any` — la regen remplace par les vrais types.)

## Architecture express

- **Auth** : Supabase magic link, deep link `mktrip://auth-callback`, profile auto-créé au premier login
- **Data** : tout passe par Legend State v3 beta (`store/*.ts`) qui sync avec Supabase via le plugin officiel + persiste local en SQLite via `expo-sqlite/kv-store`
- **Multi-voyage** : `(trips)/index.tsx` (liste), `(trips)/new.tsx` (créer), `(trips)/join.tsx` (rejoindre via code), `(trips)/[tripId]/(tabs)/*` (le voyage actif)
- **RLS** : un user voit/édite uniquement les trips dont il est membre (table `trip_members` + helper `is_trip_member()`)

## Tests

Pas de Jest/Detox dans le SP1. Tests manuels documentés dans `docs/superpowers/plans/notes-manual-tests.md` (créé lors de la phase H1).
