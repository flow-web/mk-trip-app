'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Category = Database['public']['Enums']['expense_category']

type Member = { user_id: string; display_name: string }

interface Props {
  tripId: string
  currency: string
  members: Member[]
}

export function AddExpenseDialog({ tripId, currency, members }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Category>('food')

  async function onSubmit() {
    const cents = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!cents || cents <= 0) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const share = members.length > 0 ? 1 / members.length : 1
    await mutations.expense.create(
      {
        trip_id: tripId,
        payer_id: user.id,
        amount: cents,
        currency,
        category,
        note: note || null,
        spent_at: new Date().toISOString(),
        split_mode: 'equal',
      },
      members.map((m) => ({ user_id: m.user_id, share })),
    )
    setOpen(false)
    setAmount('')
    setNote('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="fixed bottom-[88px] left-5 right-5 h-12 rounded-pill bg-ink text-white flex items-center justify-center gap-2 shadow-card font-semibold">
        <Plus className="w-4 h-4" strokeWidth={2} />
        Ajouter une dépense
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg p-6">
        <div className="mk-eyebrow text-ink-mute">NOUVELLE DÉPENSE</div>
        <h2 className="mk-display text-3xl mt-2">Combien ?</h2>
        <div className="mt-6 space-y-3">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="text-2xl mk-mono"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (ex: Plein essence)"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm"
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
        <Button type="button" onClick={onSubmit} className="w-full mt-6">
          Enregistrer
        </Button>
      </DialogContent>
    </Dialog>
  )
}
