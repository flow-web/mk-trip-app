# Spec — Sous-projet A · Refonte écran Map (carte centrale)

- **Date** : 2026-05-22
- **Statut** : Design validé · prêt pour plan d'implémentation
- **Auteur** : Florian (brainstorming Claude + user)
- **Roadmap parent** : roadmap "Wanderlog features" (6 sous-projets A-F, voir mémoire projet) — ce spec couvre le sous-projet **A**, premier de la série

## 1. Contexte & objectif

Après benchmark Wanderlog (2026-05-22), décision de transformer l'écran Map de MK Trip en hub immersif "à la Wanderlog" : la carte devient l'écran principal du voyage, avec liste des spots en bottom sheet glissable et filtre par jour. **On ne touche pas** à la navigation globale (bottom tabs Home / Map / Planning / Budget / Guide), ni aux autres écrans — scope serré pour livrer en ~1 semaine et limiter les régressions.

**Objectif** : que l'écran Map d'un voyage donne immédiatement l'effet "vue d'ensemble spatiale" + "drill-down par jour", sans changer le mental model utilisateur sur le reste de l'app.

## 2. Décisions de design (toutes actées)

| # | Décision |
|---|---|
| Layout | Carte immersive plein écran + overlays contextuels (option C du brainstorming) |
| Nav globale | **Inchangée** — bottom tabs actuelles conservées |
| Vue carte par défaut | Tous les spots du voyage visibles (mode "Tous") |
| Pins — couleur | = jour (palette fixe de 8 couleurs distinctes, indépendante de l'accent voyage, cycle au-delà de 8 jours) |
| Pins — icône | = catégorie (7 cats existantes) au centre du pin |
| Tracés inter-spots | Lignes droites, color-codées par jour, **visibles uniquement quand un jour est sélectionné** |
| Clic sur pin/item | Ouvre un bottom sheet détail spot (overlay) à mi-hauteur, glissable |
| Routing réel | **Renvoyé au sous-projet D** (Mapbox Directions) |

## 3. Architecture de l'écran

Le shell de la tab Map (`app/trips/[tripId]/map/page.tsx` ou équivalent) se compose de 3 couches superposées :

| Layer | Z-index | Contenu |
|---|---|---|
| Map canvas | 0 | Mapbox GL plein écran, `fitBounds` sur tous les spots au mount, style dark cohérent |
| Day filter dock | 20 | Pastilles flottantes haut-centre : `Tous · J1 · J2 · J3…` |
| Bottom sheet liste | 30 | Sheet draggable 3 snap points (`peek 18% / mid 50% / full 95%`), liste des spots filtrés |
| Bottom sheet détail | 40 | Overlay au-dessus du sheet liste quand un spot est sélectionné |

**Overlap behavior** : carte reste interactive sur la portion visible quand le sheet est ouvert. Le day dock s'efface quand sheet > `mid` pour laisser place au contenu.

## 4. Affichage des spots

### 4.1 Pins
- Couleur = jour. Palette **fixe** de 8 couleurs distinctes définies dans `lib/map/dayColors.ts`, **indépendante de l'accent voyage** (cohérence cross-voyages). Cycle au-delà du 8e jour.
- Icône au centre = catégorie (`food`, `culture`, `nightlife`, `nature`, `accommodation`, `activity`, `sport`).
- Pin sélectionné : `scale 1.3` + `ring blanc 2px`.
- Rendu via **Mapbox layers natifs** (`circle` + `symbol` data-driven styling) — pas de markers React individuels (perf).

### 4.2 Tracés inter-spots
- Une `LineString` par jour, couleur = jour (même palette que pins).
- Opacité 0.6, largeur 3px.
- Visible **uniquement** quand un jour est sélectionné dans le dock (`selectedDayId !== 'all'`).
- Ligne droite entre spots dans l'ordre de leur `time` (champ `activities.time` existant). Pas de routing API.

## 5. Interactions clés

| Action user | Comportement |
|---|---|
| Mount écran Map | Fetch spots → `fitBounds` global (padding 50px) → sheet `peek` → dock = "Tous" |
| Clic pastille jour | Filtre spots, recentre carte (`fitBounds` jour, padding 50px), affiche tracé jour, met à jour liste sheet |
| Clic "Tous" | Reset : tous spots, fitBounds global, cache tracés |
| Clic pin sur carte | Animation pin (`scale + ring`), `flyto` léger, ouvre sheet détail (`mid`) |
| Clic item liste sheet | Identique à clic pin |
| Drag sheet vers haut | Snap `mid` → snap `full`, carte reste interactive |
| Swipe down sheet détail | Ferme overlay, revient au sheet liste |
| Tap "Marquer visité" | Toggle `activity_completions`, optimistic UI via Dexie + sync queue existant |
| Long press carte (zone vide) | **Hors scope A** (futur sous-projet création spot) |

## 6. Composants à créer / modifier

### Nouveaux (`components/map/`)
- `MapShell.tsx` — orchestrateur : holds Mapbox map ref, state `{ selectedDayId, selectedSpotId, sheetSnap }`
- `MapDayDock.tsx` — pastilles flottantes day filter
- `MapSpotPin.tsx` — config Mapbox layer (circle + symbol avec sprite sheet icônes)
- `MapSpotSheet.tsx` — bottom sheet liste spots (lib candidate : `vaul` ; plan B si instable sur iOS PWA : `react-spring-bottom-sheet` ou implémentation maison `framer-motion`)
- `MapSpotDetailSheet.tsx` — overlay sheet détail
- `lib/map/dayColors.ts` — palette + fonction `getDayColor(dayIndex, totalDays)`

### Modifications
- `app/trips/[tripId]/map/page.tsx` — remplace contenu par `<MapShell tripId={…} />`
- Hook fetch spots existant — vérifier qu'il renvoie `dayId` sur chaque spot (sinon ajouter join)
- `components/spots/SpotCard.tsx` (si existant) — potentiellement réutilisable dans le SpotDetailSheet

### Pas de migration Supabase
Les tables `spots`, `days`, `activity_completions` couvrent déjà tout le besoin.

## 7. Data flow

```
useTripSpots(tripId)
  → spots avec { id, dayId, category, lat, lng, title, time, ... }
       ↓
MapShell state: { selectedDayId: 'all' | dayId, selectedSpotId: spotId | null }
       ↓
Computed:
  visibleSpots = selectedDayId === 'all' ? all : filter(dayId === selectedDayId)
  visibleLines = selectedDayId === 'all' ? [] : [lineForDay(selectedDayId)]
       ↓
Mapbox layers: circle (pins) + symbol (icons) + line (tracés)
Sheet liste: visibleSpots triés par time
```

**Offline-first** : pas de changement, réutilise le pattern Dexie + sync queue existant pour les mutations (toggle visited).

## 8. Hors-scope explicite

| Item | Renvoyé à |
|---|---|
| Routing réel Mapbox Directions | Sous-projet D |
| Drag-drop réordonnancement | Sous-projet C |
| Suggestions IA de spots | Sous-projet B |
| Long-press carte = ajouter spot | Sous-projet futur (UX création) |
| Refonte écrans Home / Planning / Budget / Guide | Inchangé |
| Refonte bottom tabs / nav globale | Inchangé |
| Optimisation auto ordre spots (TSP) | Sous-projet D |
| Photos auto-fetchées (Google Places) | Sous-projet futur |
| Import tickets avion | Sous-projet F |

## 9. Testing

| Niveau | Stratégie |
|---|---|
| Unit | `dayColors.ts` (palette déterministe pour N jours), filtres `visibleSpots`/`visibleLines` |
| Composant | `MapDayDock` (rendu + clic émet bon event), `MapSpotDetailSheet` (open/close + toggle visited) |
| E2E Playwright | (1) ouvrir voyage → fitBounds correct sur tous spots · (2) filtrer J2 → tracé visible + liste filtrée · (3) clic pin → sheet détail s'ouvre avec bonnes data · (4) toggle visited persiste après refresh |
| Manuel | Palette jours sur voyages 1 / 3 / 7 / 14 jours · perf voyage 50+ spots · iOS Safari PWA sheet draggable · Android Chrome |

## 10. Acceptance criteria

1. L'écran Map du voyage démo Lisbonne charge en < 2s sur mobile 4G et affiche tous les spots.
2. Le day dock filtre correctement et anime le recentrage carte (fitBounds avec padding 50px).
3. Les pins ont la bonne couleur (= jour) et icône (= catégorie).
4. Cliquer un pin OU un item de liste ouvre le même sheet détail.
5. "Marquer visité" met à jour `activity_completions` et l'UI reflète le changement offline (Dexie).
6. Le sheet est draggable fluide entre 3 snap points sur iOS Safari et Android Chrome (60fps perceptible).
7. Aucune régression visuelle ou fonctionnelle sur Home / Planning / Budget / Guide.

## 11. Risques connus & mitigations

| Risque | Mitigation |
|---|---|
| Perf carte avec 50+ pins React individuels | Layers Mapbox natifs (circle + symbol), pas de markers React |
| Palette jour illisible au-delà de 10 jours | Cycle de 8 couleurs distinctes max, on accepte la répétition au-delà |
| Sheet `vaul` instable sur PWA iOS | Plan B : `react-spring-bottom-sheet` ou implémentation maison `framer-motion` |
| Régression du fetch spots existant | Wrapper derrière un feature flag env var (`NEXT_PUBLIC_MAP_SHELL_V2=true`) le temps de valider en preview |
| Sprite sheet icônes catégories pas prêt | Fallback : symboles texte (emoji) en attendant, swap quand sprite généré |

## 12. Estimation

- **Effort** : ~5-7 jours de dev (1 semaine)
- **Dépendances bloquantes** : aucune (Mapbox déjà intégré, tables Supabase OK, sync offline OK)
- **Livrable** : preview Vercel fonctionnelle sur voyage démo Lisbonne avant merge prod
