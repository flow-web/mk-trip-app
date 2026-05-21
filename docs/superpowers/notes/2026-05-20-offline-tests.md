# Tests offline — Phase 5.5

Checklist de validation manuelle. À cocher après chaque exécution. Tous les scénarios doivent passer avant de signer la phase.

## Scénario 1 — Mode avion + ajout dépense

1. DevTools Chrome → Network → **Offline**.
2. Ouvrir `/trips/<portugal_id>/budget`.
3. CTA "Ajouter une dépense" → remplir 12,50€ / "Test offline" / Bouffe → Enregistrer.
4. Recharger la page (toujours offline).

- [ ] La dépense apparaît dans "Dépenses récentes" (hydratée depuis Dexie).
- [ ] `useSyncStatus.queueLength` = 2 minimum (expense + split).
- [ ] Bandeau `SyncBanner` visible avec "Hors-ligne · 2 modifications en attente".
- [ ] `/trips/<id>/settings/sync` montre les 2 entrées `pending`.
- [ ] Repasser online → flush automatique → queue vide < 30 s.
- [ ] L'expense + split sont visibles côté Supabase Studio.

## Scénario 2 — Realtime 2 devices

1. Device A (laptop) sur `/trips/<id>/planning?day=1`.
2. Device B (téléphone) sur la même page, même user.
3. Sur A, toggle une activity via le cercle de la timeline.

- [ ] L'état "done" apparaît sur B en moins de 2 secondes (push Realtime).
- [ ] Recharger B : l'état persiste (DB confirmée).

## Scénario 3 — Dépendances offline (expense + splits)

1. Mode offline.
2. Ajouter une expense via `/budget` (le helper `mutations.expense.create` enqueue 1 expense puis N splits avec `depends_on`).
3. Ouvrir `/settings/sync`.

- [ ] L'entrée `expense` a un `id` (queue UUID).
- [ ] Chaque entrée `expense_split` a `depends_on: [<expenseQueueId>]`.
- [ ] Online : l'expense flushe d'abord, puis le splits utilisent le `server_id` retourné par l'expense.
- [ ] Pas de violation FK côté Supabase (logs propres).

## Scénario 4 — Lock Realtime (echo loop)

1. Device A toggle une activity. Le `_pending_mutation_id` est set localement.
2. Avant que la queue ne flushe (forcer la latence : throttle Network "Slow 3G"), Supabase pousse l'update via Realtime.

- [ ] La row Dexie de A **n'est pas** écrasée par le push remote.
- [ ] Une fois le flush A terminé, `_pending_mutation_id` est cleared, et toute mutation Realtime ultérieure sera appliquée.

## Scénario 5 — Upload photo offline

1. Mode offline.
2. `/trips/new` → uploader une photo de couverture, créer le voyage.
3. Vérifier `pending_uploads` dans `/settings/sync`.

- [ ] L'upload est `status: pending`, `attempts: 0`.
- [ ] Repasser online → `flushUploads()` upload sur le bucket `trip-covers`.
- [ ] `trip.hero_image_url` mis à jour avec l'URL publique Supabase.
- [ ] L'entrée `pending_uploads` est supprimée.

---

**Statut global :** À renseigner par Florian après run.

Date du run : **____________**

Tester : **____________**

Conclusion : **____________**
