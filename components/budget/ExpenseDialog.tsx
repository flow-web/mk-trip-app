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
    try {
      await mutations.expense.delete(expense.id)
      setOpen(false)
    } catch {
      setDeleting(false)
    }
  }

  function toggleMember(userId: string) {
    setMemberSplits((prev) =>
      prev.map((m) =>
        m.user_id === userId ? { ...m, included: !m.included } : m,
      ),
    )
  }

  function setMemberCustomAmount(userId: string, val: string) {
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
                    onChange={(e) => setMemberCustomAmount(m.user_id, e.target.value)}
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
