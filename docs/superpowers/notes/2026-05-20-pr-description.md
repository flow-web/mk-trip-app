# PR description — Pivot PWA Next.js + Refonte UI Claude Design

Branche : `worktree-pivot-pwa-refonte-ui` → `main` (47 commits)

À ouvrir via :

```
gh pr create --title "Pivot PWA Next.js + Refonte UI Claude Design" --body-file docs/superpowers/notes/2026-05-20-pr-description.md
```

(Quand la rate-limit GitHub sera levée. Sinon, copier-coller le contenu ci-dessous via l'UI GitHub.)

---

## Summary

- Pivot de la stack Expo/RN vers Next.js 16 + Tailwind + shadcn (base-nova) + Supabase + Vercel
- Refonte UI complète d'après le handoff Claude Design (DS sable/charbon, 6 accents par trip_type)
- Couche offline-first via Dexie + sync queue (depends_on temp_id → server_id + lock `_pending_mutation_id`) + Realtime
- PWA installable (manifest + service worker Serwist)
- 5 écrans : Home, Map (Mapbox), Planning, Budget, Guide
- Dark mode (class) + desktop responsive

## Phases

1. **Bootstrap** — Next 16, tokens, fonts, Tailwind, shadcn base-nova, Supabase SSR + magic link, Dexie + queue + Realtime
2. **Home** — pixel-perfect handoff (hero + carousel + stats + actions + nav)
3. **DS extract** — composants réutilisables (`components/design`, `components/home`)
4. **Map / Planning / Guide / Budget** — 4 écrans pixel-perfect, mutations Dexie + sync
5. **Variantes** — migration hero, 6 TripIcons SVG, modal new trip, seed Sud-Ouest skate
6. **5.5 — Offline robustness** — diagnostic page, banner, flush uploads, tests scénarios
7. **6 — Dark + Desktop + PWA** — toggle dark, sweep classes, layouts desktop, manifest, SW Serwist

## Actions Florian requises avant merge

- [ ] Appliquer la migration `supabase/migrations/20260520_refonte_hero.sql` sur Supabase
- [ ] Déposer 18 photos hero dans `public/heroes/<type>/{1,2,3}.jpg` (~1600 px, < 250 KB)
- [ ] Déposer 3 icônes PWA dans `public/icons/{192,512,512-maskable}.png`
- [ ] Lancer `npm run seed:sudouest -- florianmeissel.pro1@gmail.com` (avec `SUPABASE_SERVICE_ROLE_KEY` set)
- [ ] Configurer `NEXT_PUBLIC_MAPBOX_TOKEN` côté Vercel
- [ ] Configurer Supabase Auth Redirect URLs (cf. `docs/setup-supabase-auth.md`)
- [ ] `vercel link` + `vercel env add` (Task 14 différée)

## Test plan

- [ ] Magic link login sur preview Vercel → `/trips`
- [ ] 2 voyages visibles (Portugal city / Sud-Ouest skate) avec accents différents
- [ ] Toggle activity sur `/planning` persiste après reload
- [ ] Ajout dépense sur `/budget` offline → sync au retour réseau (voir `/settings/sync`)
- [ ] Sync 2 devices via Realtime
- [ ] PWA installable iOS Safari + Android Chrome (après icônes + SW généré via `next build --no-turbopack`)
- [ ] Lighthouse mobile : PWA ≥ 90, Perf ≥ 80

## Docs

- `docs/superpowers/specs/2026-05-20-mk-trip-refonte-ui-design.md` — spec complète
- `docs/superpowers/plans/2026-05-20-mk-trip-refonte-ui.md` — plan 48 tasks
- `docs/superpowers/notes/2026-05-20-offline-tests.md` — checklist tests offline
- `docs/superpowers/notes/2026-05-20-lighthouse.md` — checklist audit Lighthouse

## Notes

- `middleware.ts` → warning Next 16.2.6 conseille de renommer en `proxy.ts`. À traiter en follow-up.
- Serwist 9 ne supporte pas encore Turbopack pour le bundling SW : `next build --no-turbopack` requis pour générer `public/sw.js` (le code TS lui-même compile).
- Composite-PK deletes (`activity_completions`, `checklist_completions`, `expense_splits`) ont un TODO Phase 5.5 dans `lib/db/mutations.ts` (le row_id passé au server delete ne couvre pas les composite keys).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
