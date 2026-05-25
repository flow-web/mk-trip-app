# Split Dépenses v2 — Spec

> Date : 2026-05-25
> Auteur : Opus (brainstorming avec le fondateur)
> Statut : validé, prêt pour plan d'implémentation

## Contexte

Le système budget existe déjà : `expenses` + `expense_splits` en base, algorithme de dettes (`computeDebts`), page budget avec total/catégories/dettes/liste, formulaire d'ajout basique (montant + note + catégorie, split equal entre tous les membres).

Quatre manques bloquent l'usage réel en voyage :
1. Pas de custom split (tout le monde paie toujours tout)
2. Pas de photo ticket / OCR
3. Pas de modification de dépense
4. Pas de suivi des remboursements

## Scope

### Feature 1 — Custom Split

**Objectif :** Choisir qui participe à une dépense et avec quelle part.

**Deux modes :**

- **Mode simple (défaut)** : toggle inclus/exclu par membre. Les membres inclus se partagent à parts égales. Couvre le cas "Tom n'était pas au resto".
- **Mode avancé** : accessible via bouton "Parts custom". Chaque membre inclus a un champ montant ou pourcentage. Le total doit matcher le montant de la dépense — indicateur visuel d'erreur si écart.

**UI dans le formulaire :**

Sous le select catégorie, section "Qui participe ?" :
- Liste des membres du trip avec avatar + nom + toggle (inclus par défaut)
- Compteur "÷ N" dynamique
- Bouton discret "Parts custom →" qui bascule les toggles en champs montant
- En mode custom : affichage du total splits vs montant dépense, alerte si diff > 0.01€

**Impact schema :** Aucun — `split_mode` ('equal' | 'custom') et `share` (numeric 0-1 ou montant absolu ?) existent déjà. Convention : `share` reste un ratio 0→1 en mode equal, en mode custom on calcule le ratio = montant_membre / montant_total avant stockage.

**Impact `computeDebts` :** Aucun — l'algo utilise déjà `share` comme ratio, les shares custom fonctionnent identiquement.

### Feature 2 — OCR Ticket (AI Gateway)

**Objectif :** Photographier un ticket de caisse, extraire montant + catégorie + note automatiquement.

**Architecture :**

```
Camera/galerie → upload image → POST /api/expenses/ocr
  → AI Gateway (vision model, ex: claude-sonnet-4-6)
  → JSON { amount, category, note, confidence }
  → pré-remplir le formulaire → user valide et ajuste
```

**Endpoint API : `POST /api/expenses/ocr`**

- Auth Supabase obligatoire (même pattern que `/api/spots/suggest`)
- Rate limit : 20 req/min par user
- Input : `FormData` avec champ `image` (JPEG/PNG, max 5 MB)
- Encode l'image en base64 pour le modèle vision
- Prompt système : extraire montant (en centimes), catégorie (parmi l'enum `expense_category`), note courte (nom du commerce / description)
- Output : `{ amount: number, category: string, note: string, confidence: number }`
- Si confidence < 0.5, retourner quand même mais le formulaire affichera un warning

**UI dans le formulaire :**

- Bouton camera/photo à côté du champ montant (icône Camera)
- Au clic : `<input type="file" accept="image/*" capture="environment">` (ouvre la caméra sur mobile, galerie sur desktop)
- Pendant l'analyse : skeleton/spinner sur les champs montant, note, catégorie
- Résultat : pré-remplissage des champs + toast "Ticket analysé" ou "Analyse incertaine, vérifie les champs"
- L'user peut modifier les valeurs avant d'enregistrer

**Pas de stockage de l'image** pour le MVP. L'image est envoyée, analysée, les champs sont remplis, l'image est jetée.

### Feature 3 — Edit Expense

**Objectif :** Modifier montant, note, catégorie, ou splits d'une dépense existante.

**Mutation : `mutations.expense.update`**

```typescript
mutations.expense.update = async (
  id: string,
  expense: Partial<Tables['expenses']['Update']>,
  splits?: Array<Omit<Tables['expense_splits']['Insert'], 'expense_id'>>
) => void
```

- Update optimiste dans Dexie
- Si `splits` fourni : supprimer les anciens splits, insérer les nouveaux (même pattern que create)
- Enqueue dans la sync queue (op: 'update')

**UI :**

- Clic sur un `ExpenseRow` dans la liste "Dépenses récentes" → ouvre le même formulaire (`AddExpenseDialog` renommé en `ExpenseDialog`) en mode édition
- Le formulaire est pré-rempli avec les valeurs actuelles
- Bouton "Enregistrer" (create) ou "Modifier" (edit) selon le mode
- Bouton "Supprimer" en rouge en bas en mode édition, avec confirmation

**Refactoring du dialog :**

`AddExpenseDialog` → `ExpenseDialog` avec prop `expense?: LocalExpense` :
- Si `expense` fourni → mode édition (pré-remplissage, update, bouton supprimer)
- Sinon → mode création (comportement actuel)

### Feature 4 — Settlement (Marquer comme réglé)

**Objectif :** Tracker les remboursements entre membres.

**Concept :** Un settlement est une dépense spéciale qui réduit une dette. Pas de nouveau type de table — on réutilise `expenses` avec la catégorie `'settlement'` (nouveau dans l'enum).

**Schema Supabase :**

Migration : ajouter `'settlement'` à l'enum `expense_category`.

```sql
ALTER TYPE public.expense_category ADD VALUE 'settlement';
```

**Logique :**

- Un settlement a `payer_id` = celui qui rembourse, `amount` = montant remboursé
- Le split a un seul bénéficiaire : la personne remboursée, avec `share = 1.0`
- `computeDebts` n'a pas besoin de changer — le settlement crée un crédit inversé qui annule naturellement la dette

**UI dans DebtFlow :**

- Bouton "Réglé" (icône Check) à droite de chaque ligne de dette
- Au clic : crée automatiquement un settlement expense (montant = dette, payer = débiteur, split = créditeur)
- L'`ExpenseRow` affiche les settlements avec state `'settled'` (déjà supporté : opacité réduite + barré)
- Filtre dans la liste : ne pas mélanger settlements et dépenses normales. Section séparée "Remboursements" en bas, ou toggle pour les afficher/masquer

**UX du bouton "Réglé" :**

- Tap → bottom sheet compact de confirmation : "Tom rembourse 45,00 € à Lina ?" + "Confirmer"
- Pas de dialog lourd — action rapide type "done"

## Fichiers impactés

### Nouveaux fichiers
- `app/api/expenses/ocr/route.ts` — endpoint OCR
- `lib/ai/expenseOcrSchema.ts` — schema Zod pour la réponse OCR
- `supabase/migrations/2026XXXX_settlement_category.sql` — ajout enum settlement

### Fichiers modifiés
- `components/budget/AddExpenseDialog.tsx` → renommé `ExpenseDialog.tsx`, ajout mode edit + custom split + OCR
- `components/budget/DebtFlow.tsx` → bouton "Réglé" par ligne
- `components/budget/ExpenseRow.tsx` → clickable (onClick prop)
- `app/trips/[tripId]/budget/page.tsx` → wiring edit + settlements section
- `lib/db/mutations.ts` → ajout `mutations.expense.update`
- `lib/db/schema.ts` — aucun changement (types déjà OK)

### Fichiers inchangés
- `lib/utils/split-debt.ts` — l'algo fonctionne déjà avec les shares custom et les settlements
- `lib/db/index.ts` — pas de nouvelle version Dexie nécessaire

## Hors scope (V2+)
- Multi-devise avec conversion automatique
- Intégration Revolut / Powens
- Export PDF des dépenses
- Stockage persistant des photos de tickets
- Undo/historique des modifications
