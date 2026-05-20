# Lighthouse audit — Phase 6

Checklist d'audit Lighthouse à passer après que les actions ci-dessous soient effectuées.

## Pré-requis avant audit

- [ ] **18 photos hero** placées dans `public/heroes/{sport,hike,beach,city_break,road_trip,other}/{1,2,3}.jpg`
- [ ] **3 icônes PWA** placées dans `public/icons/{192.png,512.png,512-maskable.png}`
- [ ] **Migration `20260520_refonte_hero.sql`** appliquée sur Supabase
- [ ] **Token Mapbox** présent dans `.env.local` et Vercel env
- [ ] **Build prod servi en local** avec webpack pour générer `public/sw.js` :
  ```
  npm run build --no-turbopack
  npm run start
  ```
  Ou en `next dev` les SW est désactivé via `disable: true`.

## Lancer l'audit

1. Chrome devtools → Lighthouse → Mode **Mobile**.
2. Cocher : Performance, Best Practices, PWA, Accessibility, SEO.
3. Run.

## Cibles

| Catégorie | Cible | Notes |
|---|---|---|
| PWA | ≥ 90 | Nécessite manifest, SW enregistré, icônes maskable, theme color, viewport. |
| Performance | ≥ 80 | Photo hero lazy + `next/image` priority. Bricolage en variable font. |
| Accessibility | ≥ 90 | Vérifier les `aria-label` sur boutons icon-only (TripIcon, Bell). |
| Best Practices | ≥ 90 | HTTPS + pas de console errors. |
| SEO | ≥ 90 | `description` meta + `lang="fr"` ✓. |

## Probables ajustements après audit

- [ ] Aria-labels manquants sur `<button>` icon-only (Bell, Plus, NavigationControl).
- [ ] Ajouter `<noscript>` fallback pour les écrans 100 % client.
- [ ] Tester maskable icon dans https://maskable.app/.
- [ ] Apple splash screen meta (différentes tailles d'écran iOS) — optionnel mais recommandé.
- [ ] `loading="lazy"` sur images non-hero.

## Test "Add to Home Screen"

- [ ] **iOS Safari** : bouton Share → "Sur l'écran d'accueil". L'app installée se lance en standalone (pas de barre Safari).
- [ ] **Android Chrome** : menu → "Installer l'application". L'icône apparaît au launcher.
- [ ] **Desktop Chrome** : icône d'installation dans la barre d'URL.

## Résultats

Date du run : **____________**

| Catégorie | Score | Notes |
|---|---|---|
| PWA | __ / 100 | |
| Performance | __ / 100 | |
| Accessibility | __ / 100 | |
| Best Practices | __ / 100 | |
| SEO | __ / 100 | |
