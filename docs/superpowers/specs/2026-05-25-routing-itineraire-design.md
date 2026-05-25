# Routing itinéraire — Spec

> Date : 2026-05-25
> Statut : validé

## Contexte

L'écran Map Shell (sous-projet A) affiche des lignes droites entre les spots d'un jour via `computeDayLines()`. Mapbox GL et @turf/turf sont installés. Le token Mapbox est public (`NEXT_PUBLIC_MAPBOX_TOKEN`).

## Features

### 1. Tracés routiers réels

Remplacer les lignes droites par de vrais tracés via Mapbox Directions API. Appel côté client (token public). L'API retourne un GeoJSON LineString + durée + distance.

**Hook : `useRouteLines(spots, dayId, profile)`**

- Input : spots du jour (avec lat/lng), profil transport (`driving` | `walking` | `cycling`)
- Appelle `https://api.mapbox.com/directions/v5/mapbox/{profile}/{coords}` avec `geometries=geojson&overview=full`
- Output : `{ coordinates: [lng, lat][], duration: number, distance: number } | null`
- Cache les résultats pour éviter les appels redondants (même spots, même profil → pas de refetch)
- Fallback : si l'API échoue ou < 2 spots, retourne les lignes droites existantes

### 2. Sélecteur de transport par jour

Toggle voiture/marche/vélo dans le MapShell, visible quand un jour est sélectionné.

**Modes :**
- `driving` — icône voiture (défaut)
- `walking` — icône piéton
- `cycling` — icône vélo

**Stockage :** Champ local `transport_mode` ajouté à `LocalDay` (Dexie-only, pas de migration Supabase). Défaut : `'driving'`.

**UI :** 3 boutons icônes compacts dans le MapDayDock ou à côté, le mode actif est surligné.

### 3. Métriques du trajet

Afficher durée et distance totales du jour sous le day dock ou dans la bottom sheet.

- Durée : formatée en "Xh Xmin"
- Distance : formatée en "X km" ou "X m" si < 1km

### 4. Optimisation TSP

Bouton "Optimiser l'ordre" dans la bottom sheet quand un jour a 3+ spots.

**Mapbox Optimization API :**
- `https://api.mapbox.com/optimized-trips/v1/mapbox/{profile}/{coords}`
- Retourne l'ordre optimal des waypoints
- Au clic : appelle l'API → récupère l'ordre → met à jour les positions des spots via `mutations.spot.reorder(dayId, orderedIds[])`

**Mutation à créer :** `mutations.spot.reorder(dayId, orderedIds[])` — même pattern que `activity.reorder`.

## Architecture

```
MapShell
  ├── useRouteLines(visibleSpots, selectedDayId, transportMode)
  │     └── fetch Mapbox Directions API
  ├── MapView (reçoit routeLines au lieu de straightLines)
  ├── MapDayDock + TransportModeToggle
  └── MapSpotSheet
        └── bouton "Optimiser l'ordre" (3+ spots)
              └── optimizeRoute() → mutations.spot.reorder()
```

## Fichiers

### Nouveaux
- `lib/map/useRouteLines.ts` — hook Mapbox Directions + cache
- `lib/map/optimizeRoute.ts` — appel Mapbox Optimization API
- `components/map/TransportModeToggle.tsx` — sélecteur voiture/marche/vélo

### Modifiés
- `components/map/MapShell.tsx` — wiring useRouteLines + transport mode + métriques
- `components/map/MapView.tsx` — recevoir routeLines (même format GeoJSON, pas de changement majeur)
- `components/map/MapSpotSheet.tsx` — bouton optimiser
- `lib/db/schema.ts` — ajouter `transport_mode?: string` à `LocalDay`
- `lib/db/mutations.ts` — ajouter `mutations.spot.reorder`

### Inchangés
- `lib/map/spotFilters.ts` — `computeDayLines` reste comme fallback pour le mode offline/erreur

## Limites Mapbox Directions API (free tier)
- 100 000 requêtes/mois gratuites
- Max 25 waypoints par requête (largement suffisant pour un jour de voyage)
- Optimization API : 100 000 requêtes/mois gratuites, max 12 waypoints

## Hors scope
- Navigation turn-by-turn en temps réel
- Estimation coût carburant/péages
- Modes de transport multimodaux (transit)
- Stockage persistant des tracés (recalculés à chaque mount)
