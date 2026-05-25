# Drag-drop activités — Spec

> Date : 2026-05-25
> Statut : validé

## Contexte

La page Planning affiche les activités d'un jour triées par `position`. Pas de lib drag-drop installée. Mutations activity limitées à `toggleCompletion`. Le champ `position` existe mais n'est pas mutable.

## Feature

Drag-drop pour réordonner les activités au sein d'un jour et déplacer entre jours.

### Intra-jour

Sortable list verticale dans le Timeline. Au drop → batch update des positions.

### Inter-jour

Pendant un drag, les boutons de la WeekStrip deviennent des drop zones. Survol d'un autre jour → highlight visuel. Drop sur un jour différent → change `day_id` + recalcule positions.

## Lib

`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Compatible touch (long press natif), React 19, léger.

## Mutations

### `mutations.activity.reorder(dayId, orderedIds[])`

Batch update des positions pour toutes les activités d'un jour :
```typescript
for (let i = 0; i < orderedIds.length; i++) {
  await localUpdate('activities', orderedIds[i], { position: i })
}
```

### `mutations.activity.moveToDay(activityId, newDayId, position)`

Change le `day_id` de l'activité et insère à la position donnée :
```typescript
await localUpdate('activities', activityId, { day_id: newDayId, position })
```

## UX

- Handle grip (icône GripVertical) à gauche de chaque TimelineEvent
- Item soulevé : ombre + scale légère via DragOverlay
- Placeholder : espace vide avec bordure dashed
- WeekStrip : jour cible surligné (accent color) pendant le survol inter-jour
- Touch : long press pour activer le drag (comportement natif dnd-kit)

## Fichiers

### Nouveaux
- `components/planning/SortableTimeline.tsx` — wrapper DnD avec sortable context

### Modifiés
- `components/planning/TimelineEvent.tsx` — ajouter drag handle
- `components/planning/WeekStrip.tsx` — droppable zones sur les jours
- `app/trips/[tripId]/planning/page.tsx` — DndContext + handlers
- `lib/db/mutations.ts` — reorder + moveToDay

### Dépendances
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

## Hors scope
- Création/suppression d'activités (feature séparée)
- Drag-drop de jours entiers
- Undo/historique des déplacements
