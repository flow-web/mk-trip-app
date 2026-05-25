# Features restantes — Spec consolidée

> Date : 2026-05-25
> Statut : validé
> 4 features : Votes de groupe, Budget prévisionnel, Check-in spots, Import tickets

---

## Feature 1 — Votes de groupe

Sondages rapides dans un voyage pour décider à plusieurs (resto, activité, destination du jour).

### Schema Supabase

**Table `polls`**
- `id` uuid PK
- `trip_id` uuid FK → trips
- `question` text (1-200 chars)
- `created_by` uuid FK → profiles
- `closed` boolean default false
- `created_at`, `updated_at`

**Table `poll_options`**
- `id` uuid PK
- `poll_id` uuid FK → polls
- `label` text (1-100 chars)
- `position` int

**Table `poll_votes`**
- `poll_id` uuid + `user_id` uuid = PK composée
- `option_id` uuid FK → poll_options
- `voted_at` timestamptz

RLS : trip members only. Un vote par personne par sondage.

### Dexie

Ajouter tables `polls`, `poll_options`, `poll_votes` en version 4.

### Mutations

- `mutations.poll.create(question, options[])` — crée poll + options
- `mutations.poll.vote(pollId, optionId)` — enregistre ou change le vote
- `mutations.poll.close(pollId)` — ferme le sondage

### UI

- Bouton "📊 Sondage" dans le chat ou page dédiée accessible depuis la nav
- Dialog de création : question + 2-4 options
- Affichage : barre de progression par option, nombre de votes, indicateur du choix de l'user
- Résultat en temps réel via Dexie live query

### Page

`app/trips/[tripId]/polls/page.tsx` — liste des sondages du voyage. Accessible via un lien dans la page Home du trip.

---

## Feature 2 — Budget prévisionnel

Estimer les coûts avant le voyage et comparer au réel pendant.

### Approche

Pas de nouvelle table. On ajoute un champ `estimated_cost` (bigint, centimes) aux spots existants. Le budget prévisionnel = somme des estimated_cost des spots du voyage. Comparaison avec `trip.total_budget` et le total réel des expenses.

### Schema

Migration : `ALTER TABLE public.spots ADD COLUMN estimated_cost bigint DEFAULT 0;`

### UI dans la page Budget

Nouvelle section "PRÉVISIONNEL" entre le total et les dettes :
- Barre : budget total → estimé → dépensé
- Par catégorie : estimé vs réel
- Alerte visuelle si estimé > budget

### Saisie de l'estimation

Dans le `MapSpotDetailSheet` : champ "Coût estimé" éditable (input numérique). Mutation `mutations.spot.update(id, { estimated_cost })`.

---

## Feature 3 — Check-in spots

"Je suis arrivé !" en un tap sur un spot planifié.

### Schema Supabase

**Table `spot_checkins`**
- `spot_id` uuid + `user_id` uuid = PK composée
- `checked_in_at` timestamptz default now()

RLS : trip members via spots → trips. Self-only pour insert/delete.

### Dexie

Table `spot_checkins` en version 4 (avec les polls).

### Mutations

- `mutations.spot.checkin(spotId, userId)` — insert
- `mutations.spot.uncheckIn(spotId, userId)` — delete

### UI

- `MapSpotDetailSheet` : bouton "📍 Je suis là !" qui toggle le check-in
- Sur la carte : spots avec check-in ont un contour vert / badge check
- Dans `MapSpotSheet` (liste) : indicateur visuel "✓" à côté du nom

---

## Feature 4 — Import tickets (MVP)

Upload photo ou PDF de billet d'avion/train/hôtel → extraction IA → création d'activité dans le planning.

### Endpoint : `POST /api/tickets/extract`

Même pattern que `/api/expenses/ocr` :
- Auth + rate limit
- Input : `FormData` avec `file` (image ou PDF, max 5MB)
- AI Gateway (claude-haiku) avec prompt d'extraction
- Output : `{ type, departure, arrival, date, time, carrier, reference, passengers }`

### Schema Zod

```typescript
{
  type: 'flight' | 'train' | 'hotel' | 'car_rental' | 'other',
  departure: string,       // ville/aéroport départ
  arrival: string,         // ville/aéroport arrivée
  date: string,            // YYYY-MM-DD
  time: string | null,     // HH:MM
  end_date: string | null, // pour hôtels (date de checkout)
  carrier: string | null,  // compagnie
  reference: string | null,// n° de résa
  passengers: number,      // nombre de passagers
}
```

### UI

- Bouton "📄 Importer un billet" dans la page Planning (à côté du +)
- Upload → spinner → résultat affiché dans un dialog de confirmation
- L'user valide → création d'une activité avec les infos extraites (title = "Vol Paris → Lisbonne", subtitle = "EasyJet · ABCD12", time, etc.)
- L'activité est assignée au jour correspondant (match par date) ou au premier jour si pas de match

---

## Fichiers (consolidé)

### Migrations
- `supabase/migrations/20260525100000_polls.sql`
- `supabase/migrations/20260525200000_spot_estimated_cost.sql`
- `supabase/migrations/20260525300000_spot_checkins.sql`

### Dexie
- `lib/db/index.ts` — version 4 : polls, poll_options, poll_votes, spot_checkins

### Nouveaux fichiers
- `app/trips/[tripId]/polls/page.tsx`
- `components/polls/CreatePollDialog.tsx`
- `components/polls/PollCard.tsx`
- `lib/ai/ticketExtractSchema.ts`
- `app/api/tickets/extract/route.ts`
- `components/planning/ImportTicketDialog.tsx`

### Fichiers modifiés
- `lib/db/schema.ts` — types LocalPoll, LocalPollOption, LocalPollVote, LocalSpotCheckin
- `lib/db/mutations.ts` — mutations poll.*, spot.checkin/update
- `app/trips/[tripId]/budget/page.tsx` — section prévisionnel
- `components/map/MapSpotDetailSheet.tsx` — coût estimé + check-in
- `components/map/MapSpotSheet.tsx` — indicateur check-in
- `app/trips/[tripId]/planning/page.tsx` — bouton import ticket
