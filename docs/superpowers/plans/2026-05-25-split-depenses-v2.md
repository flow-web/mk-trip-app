# Split Dépenses v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the expense system with custom splits, OCR receipt scanning, expense editing, and settlement tracking.

**Architecture:** Extends existing `expenses` + `expense_splits` tables. No new Dexie tables. New API route for OCR via AI Gateway (same pattern as `/api/spots/suggest`). Refactors `AddExpenseDialog` into `ExpenseDialog` supporting create/edit modes. Settlements reuse the expenses table with a new `'settlement'` category enum value.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), Dexie (offline-first), Vercel AI SDK + AI Gateway (vision model), Zod validation, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-05-25-split-depenses-v2-design.md`

---

## Task 1: Supabase migration — add `settlement` to expense_category enum

**Files:**
- Create: `supabase/migrations/20260525000000_settlement_category.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add 'settlement' to expense_category enum for tracking reimbursements
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'settlement';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260525000000_settlement_category.sql
git commit -m "feat(db): add 'settlement' to expense_category enum"
```

- [ ] **Step 3: Apply on Supabase remote**

Run this SQL in the Supabase Dashboard SQL Editor (same workflow as previous migrations):
```sql
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'settlement';
```

---

## Task 2: Add `mutations.expense.update` with split replacement

**Files:**
- Modify: `lib/db/mutations.ts`
- Create: `lib/db/__tests__/mutations-expense.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/db/__tests__/mutations-expense.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { mutations } from '@/lib/db/mutations'

describe('mutations.expense', () => {
  beforeEach(async () => {
    await db.expenses.clear()
    await db.expense_splits.clear()
    await db.sync_queue.clear()
  })

  it('update changes expense fields in Dexie', async () => {
    const { id } = await mutations.expense.create(
      {
        trip_id: 'trip-1',
        payer_id: 'user-1',
        amount: 5000,
        currency: 'EUR',
        category: 'food',
        note: 'Pizza',
        spent_at: new Date().toISOString(),
        split_mode: 'equal',
      },
      [{ user_id: 'user-1', share: 0.5 }, { user_id: 'user-2', share: 0.5 }],
    )

    await mutations.expense.update(id, { amount: 6000, note: 'Pasta' })

    const updated = await db.expenses.get(id)
    expect(updated!.amount).toBe(6000)
    expect(updated!.note).toBe('Pasta')
  })

  it('update replaces splits when new splits are provided', async () => {
    const { id } = await mutations.expense.create(
      {
        trip_id: 'trip-1',
        payer_id: 'user-1',
        amount: 9000,
        currency: 'EUR',
        category: 'food',
        note: null,
        spent_at: new Date().toISOString(),
        split_mode: 'equal',
      },
      [{ user_id: 'user-1', share: 0.5 }, { user_id: 'user-2', share: 0.5 }],
    )

    await mutations.expense.update(
      id,
      { split_mode: 'custom' },
      [{ user_id: 'user-1', share: 0.7 }, { user_id: 'user-2', share: 0.3 }],
    )

    const splits = await db.expense_splits.where({ expense_id: id }).toArray()
    expect(splits).toHaveLength(2)
    expect(splits.find(s => s.user_id === 'user-1')!.share).toBe(0.7)
    expect(splits.find(s => s.user_id === 'user-2')!.share).toBe(0.3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/db/__tests__/mutations-expense.test.ts`
Expected: FAIL — `mutations.expense.update` is not a function

- [ ] **Step 3: Implement `mutations.expense.update`**

In `lib/db/mutations.ts`, add inside the `expense` object after `delete`:

```typescript
    update: async (
      id: string,
      patch: Partial<Tables['expenses']['Update']>,
      newSplits?: Array<Omit<Tables['expense_splits']['Insert'], 'expense_id'>>,
    ) => {
      await localUpdate('expenses', id, patch)
      if (newSplits) {
        const oldSplits = await db.expense_splits.where({ expense_id: id }).toArray()
        for (const old of oldSplits) {
          await db.expense_splits.delete([old.expense_id, old.user_id] as any)
          await enqueue({
            op: 'delete',
            table: 'expense_splits',
            payload: { expense_id: old.expense_id, user_id: old.user_id },
            row_id: old.expense_id,
            composite_keys: { expense_id: old.expense_id, user_id: old.user_id },
          })
        }
        for (const split of newSplits) {
          await localInsert('expense_splits', { ...split, expense_id: id })
        }
        flush()
      }
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/db/__tests__/mutations-expense.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/mutations.ts lib/db/__tests__/mutations-expense.test.ts
git commit -m "feat(db): add mutations.expense.update with split replacement"
```

---

## Task 3: Refactor `AddExpenseDialog` → `ExpenseDialog` (create + edit + custom split)

**Files:**
- Rename: `components/budget/AddExpenseDialog.tsx` → `components/budget/ExpenseDialog.tsx`
- Modify: `app/trips/[tripId]/budget/page.tsx`

- [ ] **Step 1: Rename the file**

```bash
git mv components/budget/AddExpenseDialog.tsx components/budget/ExpenseDialog.tsx
```

- [ ] **Step 2: Rewrite `ExpenseDialog.tsx` with edit mode + custom split UI**

```tsx
// components/budget/ExpenseDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Camera, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { LocalExpense, LocalExpenseSplit } from '@/lib/db/schema'

type Category = Database['public']['Enums']['expense_category']

type Member = { user_id: string; display_name: string }

interface Props {
  tripId: string
  currency: string
  members: Member[]
  expense?: LocalExpense
  existingSplits?: LocalExpenseSplit[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type SplitMode = 'equal' | 'custom'

interface MemberSplit {
  user_id: string
  display_name: string
  included: boolean
  customAmount: string
}

export function ExpenseDialog({
  tripId,
  currency,
  members,
  expense,
  existingSplits,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const isEdit = !!expense
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([])
  const [ocrLoading, setOcrLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isEdit && expense) {
      setAmount((expense.amount / 100).toFixed(2).replace('.', ','))
      setNote(expense.note ?? '')
      setCategory(expense.category as Category)
      setSplitMode(expense.split_mode as SplitMode)
      setMemberSplits(
        members.map((m) => {
          const existing = existingSplits?.find((s) => s.user_id === m.user_id)
          return {
            user_id: m.user_id,
            display_name: m.display_name,
            included: !!existing,
            customAmount: existing
              ? ((expense.amount * Number(existing.share)) / 100)
                  .toFixed(2)
                  .replace('.', ',')
              : '',
          }
        }),
      )
    } else {
      setAmount('')
      setNote('')
      setCategory('food')
      setSplitMode('equal')
      setMemberSplits(
        members.map((m) => ({
          user_id: m.user_id,
          display_name: m.display_name,
          included: true,
          customAmount: '',
        })),
      )
    }
  }, [open, isEdit, expense, existingSplits, members])

  const includedMembers = memberSplits.filter((m) => m.included)
  const cents = Math.round(Number(amount.replace(',', '.')) * 100)

  const customTotal = memberSplits.reduce((sum, m) => {
    if (!m.included) return sum
    return sum + Math.round(Number(m.customAmount.replace(',', '.') || '0') * 100)
  }, 0)
  const customDiff = splitMode === 'custom' ? cents - customTotal : 0

  function buildSplits() {
    if (splitMode === 'equal') {
      const share = includedMembers.length > 0 ? 1 / includedMembers.length : 1
      return includedMembers.map((m) => ({ user_id: m.user_id, share }))
    }
    return includedMembers.map((m) => {
      const memberCents = Math.round(
        Number(m.customAmount.replace(',', '.') || '0') * 100,
      )
      return { user_id: m.user_id, share: cents > 0 ? memberCents / cents : 0 }
    })
  }

  async function handleOcr(file: File) {
    setOcrLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/expenses/ocr', { method: 'POST', body: form })
      if (!res.ok) throw new Error('OCR failed')
      const data = await res.json()
      if (data.amount) setAmount((data.amount / 100).toFixed(2).replace('.', ','))
      if (data.category) setCategory(data.category)
      if (data.note) setNote(data.note)
    } catch {
      // silent — user fills manually
    } finally {
      setOcrLoading(false)
    }
  }

  async function onSubmit() {
    if (!cents || cents <= 0) return
    if (splitMode === 'custom' && Math.abs(customDiff) > 1) return

    const splits = buildSplits()

    if (isEdit && expense) {
      await mutations.expense.update(
        expense.id,
        { amount: cents, note: note || null, category, split_mode: splitMode },
        splits,
      )
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await mutations.expense.create(
        {
          trip_id: tripId,
          payer_id: user.id,
          amount: cents,
          currency,
          category,
          note: note || null,
          spent_at: new Date().toISOString(),
          split_mode: splitMode,
        },
        splits,
      )
    }
    setOpen(false)
  }

  async function onDelete() {
    if (!expense) return
    setDeleting(true)
    await mutations.expense.delete(expense.id)
    setOpen(false)
    setDeleting(false)
  }

  function toggleMember(userId: string) {
    setMemberSplits((prev) =>
      prev.map((m) =>
        m.user_id === userId ? { ...m, included: !m.included } : m,
      ),
    )
  }

  function setCustomAmount(userId: string, val: string) {
    setMemberSplits((prev) =>
      prev.map((m) =>
        m.user_id === userId ? { ...m, customAmount: val } : m,
      ),
    )
  }

  const trigger = !isEdit ? (
    <DialogTrigger className="fixed bottom-[88px] left-5 right-5 h-12 rounded-pill bg-ink text-white flex items-center justify-center gap-2 shadow-card font-semibold">
      <Plus className="w-4 h-4" strokeWidth={2} />
      Ajouter une dépense
    </DialogTrigger>
  ) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-w-md md:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">
          {isEdit ? 'MODIFIER LA DÉPENSE' : 'NOUVELLE DÉPENSE'}
        </div>
        <h2 className="mk-display text-3xl mt-2">Combien ?</h2>
        <div className="mt-6 space-y-3">
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="text-2xl mk-mono flex-1"
              disabled={ocrLoading}
            />
            <label className="flex items-center justify-center w-12 h-12 rounded-sm border border-input bg-background cursor-pointer hover:bg-accent transition">
              <Camera className="w-5 h-5 text-ink-mute" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleOcr(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {ocrLoading && (
            <div className="text-xs text-ink-mute mk-mono animate-pulse">
              Analyse du ticket...
            </div>
          )}
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (ex: Plein essence)"
            disabled={ocrLoading}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm"
            disabled={ocrLoading}
          >
            <option value="food">Bouffe</option>
            <option value="transport">Transport</option>
            <option value="hotel">Hébergement</option>
            <option value="activity">Activité</option>
            <option value="drink">Boisson</option>
            <option value="shopping">Shopping</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Split section */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">
              QUI PARTICIPE ? · ÷ {includedMembers.length}
            </div>
            <button
              type="button"
              onClick={() =>
                setSplitMode((m) => (m === 'equal' ? 'custom' : 'equal'))
              }
              className="text-[11px] mk-mono underline text-ink-mute hover:text-ink transition"
            >
              {splitMode === 'equal' ? 'Parts custom →' : '← Parts égales'}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {memberSplits.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleMember(m.user_id)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
                    m.included
                      ? 'bg-ink text-white'
                      : 'bg-hairline text-ink-mute'
                  }`}
                >
                  {m.display_name.slice(0, 2).toUpperCase()}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    m.included ? '' : 'line-through text-ink-mute'
                  }`}
                >
                  {m.display_name}
                </span>
                {splitMode === 'custom' && m.included && (
                  <Input
                    value={m.customAmount}
                    onChange={(e) => setCustomAmount(m.user_id, e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-24 text-right mk-mono text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          {splitMode === 'custom' && Math.abs(customDiff) > 1 && (
            <div className="mt-2 text-xs text-red-600 mk-mono">
              Écart : {(customDiff / 100).toFixed(2)} €
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          className="w-full mt-6"
          disabled={!cents || (splitMode === 'custom' && Math.abs(customDiff) > 1)}
        >
          {isEdit ? 'Modifier' : 'Enregistrer'}
        </Button>

        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 transition py-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Suppression...' : 'Supprimer cette dépense'}
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Update budget page import and wire edit mode**

In `app/trips/[tripId]/budget/page.tsx`:

Replace the import:
```typescript
import { AddExpenseDialog } from '@/components/budget/AddExpenseDialog'
```
with:
```typescript
import { ExpenseDialog } from '@/components/budget/ExpenseDialog'
```

Add state for editing at the top of `BudgetPage`:
```typescript
const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null)
```

Add import:
```typescript
import { useState } from 'react'
import type { LocalExpense } from '@/lib/db/schema'
```

Make each `ExpenseRow` clickable — wrap the map inside "DÉPENSES RÉCENTES":
```tsx
{sortedExpenses.map((e) => (
  <button
    key={e.id}
    type="button"
    className="w-full text-left"
    onClick={() => setEditingExpense(e)}
  >
    <ExpenseRow
      payerInitials={initialsFor(e.payer_id)}
      payerColor={colorFor(e.payer_id)}
      label={e.note ?? e.category}
      category={e.category}
      amountCents={e.amount}
      splitsCount={splits.filter((s) => s.expense_id === e.id).length}
      when={new Date(e.spent_at).toLocaleDateString('fr')}
      state={e.category === 'settlement' ? 'settled' : undefined}
    />
  </button>
))}
```

Replace the `<AddExpenseDialog ... />` at the bottom with both dialogs:
```tsx
<ExpenseDialog
  tripId={tripId}
  currency={trip.currency ?? 'EUR'}
  members={members.map((m) => ({
    user_id: m.user_id,
    display_name: profMap.get(m.user_id)?.display_name ?? 'XX',
  }))}
/>

{editingExpense && (
  <ExpenseDialog
    tripId={tripId}
    currency={trip.currency ?? 'EUR'}
    members={members.map((m) => ({
      user_id: m.user_id,
      display_name: profMap.get(m.user_id)?.display_name ?? 'XX',
    }))}
    expense={editingExpense}
    existingSplits={splits.filter(
      (s) => s.expense_id === editingExpense.id,
    )}
    open={!!editingExpense}
    onOpenChange={(o) => { if (!o) setEditingExpense(null) }}
  />
)}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/budget/ExpenseDialog.tsx app/trips/[tripId]/budget/page.tsx
git commit -m "feat(budget): refactor ExpenseDialog with edit mode + custom split UI"
```

---

## Task 4: OCR endpoint via AI Gateway

**Files:**
- Create: `app/api/expenses/ocr/route.ts`
- Create: `lib/ai/expenseOcrSchema.ts`

- [ ] **Step 1: Create the Zod schema for OCR response**

```typescript
// lib/ai/expenseOcrSchema.ts
import { z } from 'zod'

export const expenseOcrSchema = z.object({
  amount: z
    .number()
    .int()
    .min(1)
    .describe('Total amount in cents (e.g. 1250 for €12.50)'),
  category: z
    .enum(['food', 'transport', 'hotel', 'activity', 'drink', 'shopping', 'other'])
    .describe('Best-matching expense category'),
  note: z
    .string()
    .max(120)
    .describe('Short description: merchant name or main items'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How confident 0-1 that the extraction is correct'),
})

export type ExpenseOcrResult = z.infer<typeof expenseOcrSchema>
```

- [ ] **Step 2: Create the API route**

```typescript
// app/api/expenses/ocr/route.ts
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'
import { expenseOcrSchema } from '@/lib/ai/expenseOcrSchema'

const MODEL_ID = 'anthropic/claude-haiku-4-5'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!checkGlobalRateLimit(100)) {
    return NextResponse.json({ error: 'rate_limited_global' }, { status: 429 })
  }
  if (!checkRateLimit(`ocr:${user.id}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('image')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_image' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  try {
    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: expenseOcrSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the total amount, category, and a short description from this receipt/ticket photo.
Amount must be in cents (e.g. €12.50 = 1250).
Category must be one of: food, transport, hotel, activity, drink, shopping, other.
Note should be the merchant name or a short description of the purchase.
If you cannot read the receipt clearly, set confidence below 0.5.`,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    })
    return NextResponse.json(object)
  } catch (e) {
    console.error('OCR error:', e)
    return NextResponse.json({ error: 'ocr_failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/ai/expenseOcrSchema.ts app/api/expenses/ocr/route.ts
git commit -m "feat(ai): OCR receipt endpoint via AI Gateway vision model"
```

---

## Task 5: Settlement — "Réglé" button in DebtFlow + settlement creation

**Files:**
- Modify: `components/budget/DebtFlow.tsx`
- Modify: `app/trips/[tripId]/budget/page.tsx`

- [ ] **Step 1: Add settlement callback to DebtFlow**

Rewrite `components/budget/DebtFlow.tsx`:

```tsx
// components/budget/DebtFlow.tsx
import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Avatar } from '@/components/design/Avatar'

interface Line {
  fromId: string
  fromInitials: string
  fromName: string
  fromColor: string
  toId: string
  toInitials: string
  toName: string
  toColor: string
  amountCents: number
}

interface Props {
  lines: Line[]
  onSettle?: (fromId: string, toId: string, amountCents: number) => void
}

export function DebtFlow({ lines, onSettle }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)

  return (
    <div className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark py-1">
      {lines.map((d, i) => (
        <div
          key={`${d.fromId}-${d.toId}-${i}`}
          className={`flex items-center gap-2 px-4 py-2.5 ${
            i ? 'border-t border-hairline dark:border-hairline-dark' : ''
          }`}
        >
          <Avatar name={d.fromInitials} bg={d.fromColor} size={28} />
          <span className="text-sm text-ink-soft dark:text-ink-soft-dark">
            {d.fromName}
          </span>
          <div className="flex-1 flex items-center relative">
            <div className="flex-1 border-t border-dashed border-hairline-strong dark:border-hairline-strong-dark" />
            <span className="mk-mono text-sm font-semibold absolute left-1/2 -translate-x-1/2 bg-white dark:bg-paper-dark-deep px-1.5">
              {(d.amountCents / 100).toFixed(2)} €
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-mute dark:text-ink-mute-dark -ml-1" />
          </div>
          <span className="text-sm text-ink-soft dark:text-ink-soft-dark text-right">
            {d.toName}
          </span>
          <Avatar name={d.toInitials} bg={d.toColor} size={28} />
          {onSettle && (
            <>
              {confirming === i ? (
                <button
                  type="button"
                  onClick={() => {
                    onSettle(d.fromId, d.toId, d.amountCents)
                    setConfirming(null)
                  }}
                  className="ml-1 px-2 py-1 text-[10px] mk-mono rounded bg-green-600 text-white"
                >
                  Confirmer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(i)}
                  className="ml-1 w-7 h-7 rounded-full flex items-center justify-center border border-hairline hover:bg-green-50 transition"
                  title="Marquer comme réglé"
                >
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {lines.length === 0 && (
        <div className="px-4 py-4 text-sm text-ink-mute dark:text-ink-mute-dark">
          Tout est réglé.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire settlement in budget page**

In `app/trips/[tripId]/budget/page.tsx`, add the settlement handler and update debts mapping.

Add handler inside `BudgetPage`:
```typescript
async function handleSettle(fromId: string, toId: string, amountCents: number) {
  await mutations.expense.create(
    {
      trip_id: tripId,
      payer_id: fromId,
      amount: amountCents,
      currency: trip.currency ?? 'EUR',
      category: 'settlement' as any,
      note: `Remboursement → ${nameFor(toId)}`,
      spent_at: new Date().toISOString(),
      split_mode: 'equal',
    },
    [{ user_id: toId, share: 1 }],
  )
}
```

Update the debts mapping to include `fromId` and `toId`:
```typescript
const debts = computeDebts(
  expenses.map((e) => ({ id: e.id, payer_id: e.payer_id, amount: e.amount })),
  splits.map((s) => ({
    expense_id: s.expense_id,
    user_id: s.user_id,
    share: Number(s.share),
  })),
).map((d) => ({
  fromId: d.from,
  fromInitials: initialsFor(d.from),
  fromName: nameFor(d.from),
  fromColor: colorFor(d.from),
  toId: d.to,
  toInitials: initialsFor(d.to),
  toName: nameFor(d.to),
  toColor: colorFor(d.to),
  amountCents: d.amount,
}))
```

Pass `onSettle` to `DebtFlow`:
```tsx
<DebtFlow lines={debts} onSettle={handleSettle} />
```

Separate settlements from regular expenses in the list:
```typescript
const regularExpenses = sortedExpenses.filter((e) => e.category !== 'settlement')
const settlements = sortedExpenses.filter((e) => e.category === 'settlement')
```

Render two sections instead of one:
```tsx
<div className="mt-7">
  <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">DÉPENSES RÉCENTES</Eyebrow>
  <div className="mt-3">
    {regularExpenses.map((e) => (
      <button key={e.id} type="button" className="w-full text-left"
        onClick={() => setEditingExpense(e)}>
        <ExpenseRow
          payerInitials={initialsFor(e.payer_id)}
          payerColor={colorFor(e.payer_id)}
          label={e.note ?? e.category}
          category={e.category}
          amountCents={e.amount}
          splitsCount={splits.filter((s) => s.expense_id === e.id).length}
          when={new Date(e.spent_at).toLocaleDateString('fr')}
        />
      </button>
    ))}
  </div>
</div>

{settlements.length > 0 && (
  <div className="mt-7">
    <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">REMBOURSEMENTS</Eyebrow>
    <div className="mt-3">
      {settlements.map((e) => (
        <ExpenseRow
          key={e.id}
          payerInitials={initialsFor(e.payer_id)}
          payerColor={colorFor(e.payer_id)}
          label={e.note ?? 'Remboursement'}
          category="settlement"
          amountCents={e.amount}
          splitsCount={1}
          when={new Date(e.spent_at).toLocaleDateString('fr')}
          state="settled"
        />
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/budget/DebtFlow.tsx app/trips/[tripId]/budget/page.tsx
git commit -m "feat(budget): settlement tracking with 'Réglé' button on debts"
```

---

## Task 6: Update demo data with custom splits and a settlement

**Files:**
- Modify: `lib/demo/fixtures.ts`

- [ ] **Step 1: Add variety to demo splits**

In the Lisbon demo data in `lib/demo/fixtures.ts`, change 1-2 expenses to have `split_mode: 'custom'` with unequal shares, and add a settlement expense at the end. This showcases all new features in the demo.

Find the `lisboaSplits` generation and modify it to use custom shares for 1 expense. Add a settlement expense to `lisboaExpenses`.

- [ ] **Step 2: Verify demo loads**

Start dev server, navigate to `/demo`, open a trip → Budget tab. Verify custom splits display correctly and settlement appears in "REMBOURSEMENTS" section.

- [ ] **Step 3: Commit**

```bash
git add lib/demo/fixtures.ts
git commit -m "feat(demo): add custom split and settlement examples to demo data"
```

---

## Task 7: Update Supabase types + final verification

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Regenerate Supabase types**

After applying the migration on the remote:
```bash
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > lib/supabase/types.ts
```

This adds `'settlement'` to the `expense_category` enum in the generated types, removing the need for `as any` cast in the settlement creation code.

- [ ] **Step 2: Remove `as any` cast**

In `app/trips/[tripId]/budget/page.tsx`, change:
```typescript
category: 'settlement' as any,
```
to:
```typescript
category: 'settlement',
```

- [ ] **Step 3: Full test suite**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Manual browser test**

Start dev server. Test the full flow:
1. `/trips/[id]/budget` — add expense with custom split (exclude 1 member)
2. Edit the expense — change amount and note
3. Click "Réglé" on a debt → confirm → see settlement in remboursements
4. OCR: take a photo of a receipt → verify pre-fill (requires AI_GATEWAY_API_KEY in .env.local)

- [ ] **Step 6: Commit + push**

```bash
git add -A
git commit -m "feat(budget): split dépenses v2 — custom split, OCR, edit, settlement"
git push origin main
```
