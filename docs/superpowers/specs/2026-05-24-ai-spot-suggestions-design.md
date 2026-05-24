# Spec — Sous-projet B · Suggestions IA spots

- **Date** : 2026-05-24
- **Statut** : Design validé · prêt pour plan d'implémentation
- **Auteur** : Florian (brainstorming Claude + user)
- **Roadmap parent** : roadmap "Wanderlog features" (sous-projets A-F, voir mémoire projet) — ce spec couvre le sous-projet **B**, deuxième de la série après A (Map Shell)
- **Branche dev** : `feat/ai-spot-suggestions` (branchée depuis `feat/map-shell-v2`)

## 1. Contexte & objectif

Après le sous-projet A qui a posé le shell carte immersif, B introduit l'IA dans MK Trip via Vercel AI Gateway. La feature : un panel de **suggestions de spots contextualisées** (par destination, type de voyage, jour cible, prompt user) que l'utilisateur peut accepter en bulk pour peupler son voyage.

C'est aussi la **première vraie UI d'ajout de spot** dans l'app (les spots venaient jusqu'ici de fixtures démo et scripts seed). L'ajout manuel libre reste hors-scope d'un futur sous-projet — B propose un chemin IA-only pour MVP.

**Objectif** : qu'un user qui crée un nouveau voyage Lisbonne ait 8 suggestions pertinentes à valider en moins de 5 secondes, sans saisir un seul nom de spot.

## 2. Décisions de design (toutes actées)

| # | Décision |
|---|---|
| Scope | 3 triggers one-shot (auto-mount vide, bouton sheet, bouton jour vide) + tweak prompt simple |
| Chat conversationnel | **Hors-scope** — sous-projet futur B2 si validation produit OK |
| Grounding | **Mapbox Search Forward Geocoding** (free tier 100k/mois, token `NEXT_PUBLIC_MAPBOX_TOKEN` déjà en place) |
| Modèle | `anthropic/claude-haiku-4-5` via Vercel AI Gateway (default string `provider/model`) |
| Output | Structured via `generateObject` + Zod schema |
| Count par batch | 8 suggestions |
| Diversité catégories | Naturelle — demandée à l'IA dans le prompt, pas de hard quota |
| Accept flow | Multi-select avec checkboxes + bouton bulk "Ajouter N spots" |
| Cache serveur | **Pas pour MVP** — chaque appel est frais. Cache si volume justifie. |
| Streaming UI | **Pas pour MVP** — batch complet (~2-3s) avec spinner |

## 3. Architecture

### 3.1 Endpoint serveur

**Route** : `POST /api/spots/suggest`
**Runtime** : Vercel Function par défaut (Fluid Compute)

**Request body** :
```ts
{
  tripId: string
  destination: string
  tripType: 'city_break' | 'road_trip' | 'sport' | 'hike' | 'beach' | 'other'
  dayId?: string          // si trigger jour vide → contextualise
  promptHint?: string     // tweak user, max 200 chars, échappé
  excludeSpotIds: string[] // pour éviter doublons avec spots existants
}
```

**Response** :
```ts
{
  suggestions: Array<{
    id: string                 // UUID temp côté serveur (non persisté tant que pas accepté)
    name: string
    category: SpotCategory     // contraint enum
    description: string        // 1-2 phrases
    lat: number
    lng: number
    address: string
    mapbox_verified: boolean   // true si grounding Mapbox a trouvé une correspondance
  }>
}
```

### 3.2 Pipeline serveur (3 étapes)

```
1. Vercel AI SDK · generateObject({
     model: 'anthropic/claude-haiku-4-5',
     schema: suggestSpotsSchema (Zod),
     prompt: buildPrompt(destination, tripType, dayId, promptHint, excludeSpotIds)
   })
   → 8 suggestions { name, category, description, address }

2. Pour chaque suggestion en parallèle (Promise.all) :
   mapboxGeocode(name + ", " + address)
   → { lat, lng, verified: true } si match Mapbox
   → garde coords IA + verified: false sinon

3. Compose et retourne le JSON final
```

### 3.3 Architecture client

Nouveau composant `AISuggestionsPanel` rendu en **overlay Vaul drawer** au-dessus de `MapSpotSheet`, même pattern que `MapSpotDetailSheet` du sous-projet A.

State local du panel :
- `loading: boolean`
- `error: string | null`
- `suggestions: AISuggestion[]`
- `selectedIds: Set<string>`
- `promptHint: string`

## 4. Comportement par trigger

### Trigger 1 — Auto-mount voyage vide
- **Détection** : `spots.length === 0` au mount de `MapShell`
- `AISuggestionsPanel` s'ouvre **automatiquement** à mid-snap, par-dessus le `MapSpotSheet` (en peek "0 spot")
- Dismissible via bouton ✕
- **One-shot par voyage** : flag `ai_suggestions_dismissed: true` ajouté en Dexie sur la row `trips` (champ local non synchronisé) pour ne pas re-ouvrir au prochain mount

### Trigger 2 — Bouton "Suggérer" dans la sheet
- Bouton `✨ Suggérer` ajouté dans le header de `MapSpotSheet`
- Tap → ouvre `AISuggestionsPanel` (modal mode)
- Pas de `dayId` → suggestions ajoutées avec `day_id = null` (visibles en mode "Tous")

### Trigger 3 — Bouton sur jour vide
- Quand `selectedDayId !== 'all'` ET `visibleSpots.length === 0` pour ce jour
- `MapSpotSheet` affiche placeholder : `Aucun spot pour Jour X · [✨ Suggérer pour ce jour]`
- Tap → ouvre `AISuggestionsPanel` avec `dayId = selectedDayId` en prop
- Suggestions ajoutées avec `day_id = selectedDayId`

## 5. UI panel détaillé

```
┌─ "Suggestions IA pour Lisbonne · city break"             [✕]
├─ [optional] "Guide-moi : plus food rue, moins touristique..."  [↻]
├─ État loading: spinner + "Claude réfléchit..."
├─ État error: "Erreur · [Réessayer]"
├─ État results (liste scrollable, max-h adaptive) :
│   ┌─ ☐ 🍴 Time Out Market — Food hall iconique...  ✓ vérifié
│   ├─ ☐ 🏛 Castelo de São Jorge — Forteresse...     ✓ vérifié
│   ├─ ☐ 🌲 Jardim da Estrela — Parc tranquille...   ⚠ coords approx
│   └─ ... (8 items)
├─ État empty (filtré tout): "Aucune suggestion, change le prompt ?"
└─ Footer: [Annuler]                        [Ajouter 5 spots →]
```

- Checkbox par card · le bouton du footer affiche le count sélectionné
- Bouton désactivé si count=0
- Badge `✓` / `⚠` visuel de confiance grounding Mapbox (pas bloquant)
- Tweak prompt input + bouton ↻ → re-fetch avec `promptHint`

## 6. Acceptation = bulk insert (Dexie + sync queue)

```ts
async function acceptSelection(
  selected: AISuggestion[],
  dayId: string | null,
  tripId: string
) {
  for (const s of selected) {
    const id = crypto.randomUUID()
    await db.spots.add({
      id, trip_id: tripId, day_id: dayId,
      name: s.name, description: s.description,
      category: s.category, lat: s.lat, lng: s.lng,
      tags: [], created_at: nowIso(), updated_at: nowIso(),
    })
    enqueueSync('spots', 'insert', { id, ... })
  }
}
```

Réutilise le pattern offline-first existant. Les spots apparaissent immédiatement sur la carte (optimistic via Dexie reactive query) et sont synchronisés en arrière-plan.

## 7. Composants à créer / modifier

### Nouveaux
- `app/api/spots/suggest/route.ts` — endpoint POST
- `lib/ai/suggestSpotsPrompt.ts` — fonction pure `buildPrompt(...)` testable
- `lib/ai/suggestSpotsSchema.ts` — Zod schema pour structured output
- `lib/ai/mapboxGeocode.ts` — wrapper Mapbox Search Forward Geocoding
- `components/ai/AISuggestionsPanel.tsx` — composant principal
- `components/ai/AISuggestionCard.tsx` — card cliquable avec checkbox

### Modifications
- `components/map/MapShell.tsx` — logique trigger 1 (auto-mount vide) + passer `dayId` au panel
- `components/map/MapSpotSheet.tsx` — bouton "Suggérer" (trigger 2) + placeholder "Suggérer pour ce jour" (trigger 3)
- `lib/db/schema.ts` ou `lib/db/index.ts` — ajouter champ local `ai_suggestions_dismissed?: boolean` sur `LocalTrip` (champ Dexie-only, non synchronisé)

### Aucune migration Supabase
Les tables `spots`, `trips` couvrent tout le besoin. Le flag dismissal est local-only.

## 8. Data flow

```
User trigger (auto-mount | bouton sheet | bouton jour vide)
   ↓
AISuggestionsPanel.fetch()
   ↓
POST /api/spots/suggest
   {tripId, destination, tripType, dayId?, promptHint?, excludeSpotIds}
   ↓
Server: generateObject(Haiku, schema) → 8 raw suggestions
   ↓
Server: Promise.all(suggestions.map(mapboxGeocode)) → coords vérifiées/flagged
   ↓
Response: {suggestions: [...]}
   ↓
Panel render with checkboxes
   ↓
User selects 3 + "Ajouter 3 spots"
   ↓
acceptSelection() → db.spots.add() × 3 + enqueueSync × 3
   ↓
Spots apparaissent immédiatement sur la carte (Dexie reactive)
   ↓
Background: sync queue flush → Supabase insert via existing pattern
```

## 9. Hors-scope explicite

| Item | Renvoyé à |
|---|---|
| Chat conversationnel full (multi-tour, historique) | B2 ultérieur |
| Édition manuelle d'une suggestion avant ajout | Sous-projet UI ajout spot |
| Photos auto (Google Places, Unsplash) | Sous-projet futur |
| Suggestions à partir d'autres signaux (météo, événements, agenda) | Sous-projet futur |
| IA qui "apprend" des préférences user au fil des voyages | Sous-projet futur |
| Suggestion d'itinéraires complets multi-jours | Sous-projet D (routing) |
| Cache serveur | Optim post-MVP |
| Streaming UI (suggestions arrivant une par une) | Polish post-MVP |

## 10. Testing

| Niveau | Stratégie |
|---|---|
| Unit | `suggestSpotsPrompt.ts` (prompt construit selon inputs), `suggestSpotsSchema.ts` (Zod parse valide/invalide), `mapboxGeocode.ts` (parsing response avec fetch mock) |
| API route | `app/api/spots/suggest/route.ts` testé avec MSW : AI Gateway + Mapbox mockés → output JSON conforme |
| Composant | `AISuggestionsPanel` (états loading/error/results/empty, multi-select, bouton count), `AISuggestionCard` (rendu + checkbox toggle) |
| E2E Playwright | (1) trigger auto-mount voyage vide → panel ouvre · (2) bouton "Suggérer" sheet → panel ouvre · (3) multi-select + ajout → spots sur carte · (4) tweak prompt → re-fetch · (5) dismiss persiste après reload |
| Manuel | Qualité réelle sur 3-4 destinations variées (Lisbonne, Tokyo, Bretagne) · cohérence catégories · grounding Mapbox badge ✓/⚠ · perf (latence < 4s acceptable) |

## 11. Acceptance criteria

1. Sur le voyage démo Lisbonne, vider les spots → recharger → panel s'ouvre auto en mid-snap avec 8 suggestions Lisbonne pertinentes
2. Bouton "Suggérer" depuis sheet remplie ouvre le panel avec 8 nouvelles suggestions sans doublons (`excludeSpotIds` respecté)
3. Sur un jour vide via day filter → placeholder + bouton "Suggérer pour ce jour" → panel ouvre, suggestions ajoutées avec `day_id` du jour sélectionné
4. Multi-select de 3 suggestions + bouton → les 3 spots apparaissent immédiatement sur la carte (optimistic Dexie) et persistent après reload
5. Tweak prompt "plus food de rue" → re-fetch produit suggestions plus typées food
6. Au moins 6/8 suggestions ont `mapbox_verified: true` sur une destination courante
7. Latence end-to-end < 4s sur 4G mobile
8. Aucune régression sur sous-projet A (carte, sheet, day filter)
9. Coût IA mesurable : ~$0.001 par batch (Haiku, ~500 tokens output) — soit ~1000 batches pour $1

## 12. Risques connus & mitigations

| Risque | Mitigation |
|---|---|
| Hallucination noms de lieux (Mapbox ne trouve pas) | Badge `⚠` + flag `mapbox_verified: false` · acceptable si <2/8 par batch · monitoring logs |
| Coût AI Gateway dérape | Rate limit Vercel Function : max 10 req/min par user (clé `tripId+userId`) · alarmes coût AI Gateway dashboard |
| Latence > 5s | Spinner clair + bouton "Annuler" qui abort la request · fallback `openai/gpt-4o-mini` si Haiku timeout |
| Mapbox Geocoding rate limit (60 req/min côté forward) | 8 calls parallèles par batch = très en-deçà · throttle global plus tard si besoin |
| Suggestions répétitives entre batches | `excludeSpotIds` dans le prompt + seed varié à chaque appel |
| Catégories prédites ≠ enum Supabase | Schema Zod contraint à l'enum exact · fallback `'activity'` si invalide |
| Panel auto-ouvre intrusif sur voyages vides | Flag `ai_suggestions_dismissed` par voyage en Dexie · one-shot |
| Prompt injection via `promptHint` | Échappement standard côté serveur · prompt structuré avec délimiteurs |

## 13. Estimation

- **Effort** : ~4-5 jours de dev focused
- **Dépendances bloquantes** : aucune — AI Gateway accessible via Vercel + Mapbox token déjà en place
- **Pré-requis** : sous-projet A mergé idéalement (la sheet/shell sont consommés). Si pas mergé, on dev sur la branche A (`feat/ai-spot-suggestions` est branchée depuis `feat/map-shell-v2` pour permettre les deux modes).
- **Livrable** : preview Vercel + 8 suggestions sur voyage démo Lisbonne fonctionnelles
