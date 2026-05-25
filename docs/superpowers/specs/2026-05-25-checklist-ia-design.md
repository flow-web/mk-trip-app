# Checklist IA — Spec

> Date : 2026-05-25
> Statut : validé

## Contexte

La page Guide affiche déjà une checklist via `ChecklistGroup`. Les tables `checklist_items` et `checklist_completions` existent (schema Dexie v1, Supabase migration initiale). Les mutations `checklist.create` et `checklist.toggle` fonctionnent. Il manque la génération IA.

## Feature

Bouton "✨ Générer ma checklist" dans la page Guide. L'IA génère 10-15 items de checklist personnalisés selon destination, type de voyage, durée et saison. L'user sélectionne les items qu'il veut garder.

## Endpoint : `POST /api/checklist/suggest`

Même pattern que `/api/spots/suggest` :
- Auth Supabase obligatoire
- Rate limit : `checkRateLimit(`checklist:${user.id}`)` + `checkGlobalRateLimit(100)`
- Modèle : `anthropic/claude-haiku-4-5` via `gateway()`

### Input (JSON)

```typescript
{
  tripId: string       // uuid
  destination: string  // "Lisbonne, Portugal"
  tripType: string     // 'city_break' | 'road_trip' | 'sport' | 'hike' | 'beach' | 'other'
  durationDays: number // nombre de jours du voyage
  season: string       // 'spring' | 'summer' | 'autumn' | 'winter'
  excludeLabels: string[] // labels existants pour déduplication
}
```

### Output (JSON)

```typescript
{
  items: Array<{
    label: string              // "Crème solaire SPF50"
    category: 'clothing' | 'gear' | 'docs' | 'other'
  }>
}
```

### Prompt

Contexte : destination + type voyage + durée + saison. Instructions :
- Générer 12 items pratiques et spécifiques (pas générique "vêtements")
- Répartir entre les 4 catégories (clothing, gear, docs, other)
- Adapter au type de voyage (hike → bâtons, sport → équipement spécifique, beach → maillot)
- Adapter à la saison et destination
- Exclure les labels déjà présents (`excludeLabels`)

## UI

### Panel de suggestions : `ChecklistSuggestPanel`

Overlay/section qui apparaît au clic du bouton. Affiche les items suggérés avec :
- Checkbox par item (tous cochés par défaut)
- Label + badge catégorie
- Bouton "Ajouter les N sélectionnées" en bas
- Bouton "Annuler" / fermer
- État loading avec skeleton

### Intégration dans la page Guide

- Si `checklistItems.length === 0` : bouton prominent "✨ Générer ma checklist" centré
- Si `checklistItems.length > 0` : bouton discret "✨ Compléter" après la liste
- Le bouton ouvre `ChecklistSuggestPanel`
- À la validation : `mutations.checklist.create()` pour chaque item sélectionné, position auto-incrémentée
- Après ajout : le panel se ferme, la checklist se met à jour via Dexie live query

## Fichiers

### Nouveaux
- `app/api/checklist/suggest/route.ts`
- `lib/ai/suggestChecklistSchema.ts`
- `lib/ai/suggestChecklistPrompt.ts`
- `components/guide/ChecklistSuggestPanel.tsx`

### Modifiés
- `app/trips/[tripId]/guide/page.tsx` — ajout bouton + wiring panel

### Inchangés
- `lib/db/mutations.ts` — `checklist.create` existe déjà
- `components/guide/ChecklistGroup.tsx` — pas de changement
- `lib/ai/rateLimit.ts` — réutilisé tel quel

## Hors scope
- Génération auto à la création du voyage
- Édition/suppression d'items individuels
- Réorganisation drag-drop des items (sous-projet C)
