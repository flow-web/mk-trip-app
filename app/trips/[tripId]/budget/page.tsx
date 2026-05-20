'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bed,
  Flame,
  Fuel,
  Plus as ActivityIcon,
  ShoppingBag,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { computeDebts } from '@/lib/utils/split-debt'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { DebtFlow } from '@/components/budget/DebtFlow'
import { CategoryTiles } from '@/components/budget/CategoryTiles'
import { ExpenseRow } from '@/components/budget/ExpenseRow'
import { AddExpenseDialog } from '@/components/budget/AddExpenseDialog'

const CAT_ICON: Record<string, { Icon: LucideIcon; color: string }> = {
  food: { Icon: UtensilsCrossed, color: '#1E3A5C' },
  transport: { Icon: Fuel, color: '#1C1A17' },
  hotel: { Icon: Bed, color: '#C75A20' },
  activity: { Icon: ActivityIcon, color: '#5A6E3E' },
  drink: { Icon: Wine, color: '#B14E32' },
  shopping: { Icon: ShoppingBag, color: '#7A6F60' },
  other: { Icon: Flame, color: '#3D362C' },
}

const AVATAR_PALETTE = ['#C75A20', '#5A6E3E', '#1E3A5C', '#B14E32', '#3D362C']

export default function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const expenses =
    useLiveQuery(() => db.expenses.where({ trip_id: tripId }).toArray(), [tripId]) ??
    []
  const splits = useLiveQuery(() => db.expense_splits.toArray(), []) ?? []
  const members =
    useLiveQuery(
      () => db.trip_members.where({ trip_id: tripId }).toArray(),
      [tripId],
    ) ?? []
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type)
  const totalCents = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const budget = trip.total_budget ? trip.total_budget * 100 : 0
  const pct = budget ? Math.round((totalCents / budget) * 100) : 0

  const profMap = new Map(profiles.map((p) => [p.id, p]))
  const initialsFor = (id: string) =>
    (profMap.get(id)?.display_name ?? 'XX').slice(0, 2).toUpperCase()
  const nameFor = (id: string) => profMap.get(id)?.display_name ?? '—'
  const colorFor = (id: string) => {
    const idx = [...profMap.keys()].indexOf(id)
    return AVATAR_PALETTE[(idx >= 0 ? idx : 0) % AVATAR_PALETTE.length]
  }

  const debts = computeDebts(
    expenses.map((e) => ({ id: e.id, payer_id: e.payer_id, amount: e.amount })),
    splits.map((s) => ({
      expense_id: s.expense_id,
      user_id: s.user_id,
      share: Number(s.share),
    })),
  ).map((d) => ({
    fromInitials: initialsFor(d.from),
    fromName: nameFor(d.from),
    fromColor: colorFor(d.from),
    toInitials: initialsFor(d.to),
    toName: nameFor(d.to),
    toColor: colorFor(d.to),
    amountCents: d.amount,
  }))

  const byCat = new Map<string, number>()
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)
  }
  const tiles = [...byCat.entries()].map(([cat, val]) => ({
    name: cat,
    Icon: CAT_ICON[cat]?.Icon ?? Flame,
    color: CAT_ICON[cat]?.color ?? '#1C1A17',
    valueCents: val,
    pct: totalCents ? Math.round((val / totalCents) * 100) : 0,
  }))

  const sortedExpenses = expenses
    .slice()
    .sort((a, b) => +new Date(b.spent_at) - +new Date(a.spent_at))

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-32">
      <div className="pt-12 px-5">
        <TripSwitcher
          tone="light"
          tripName={trip.name}
          tripType={trip.trip_type}
          sublabel={trip.destination ?? undefined}
        />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">BUDGET · TOTAL DÉPENSÉ</Eyebrow>
        <div className="flex items-baseline justify-between mt-1.5">
          <div className="mk-display text-5xl">
            {Math.floor(totalCents / 100)}
            <span className="text-3xl text-ink-mute dark:text-ink-mute-dark">
              ,{(totalCents % 100).toString().padStart(2, '0')} €
            </span>
          </div>
          <div className="text-right">
            {budget > 0 && (
              <div className="mk-mono text-[11px] text-ink-mute dark:text-ink-mute-dark">
                BUDGET {(budget / 100).toFixed(0)} €
              </div>
            )}
            {budget > 0 && (
              <div
                className="mk-mono text-xs font-semibold"
                style={{ color: accent.base }}
              >
                {pct} % consommé
              </div>
            )}
          </div>
        </div>
        {budget > 0 && (
          <div className="mt-3 h-1.5 bg-sand dark:bg-sand-dark rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: accent.base,
              }}
            />
          </div>
        )}

        <div className="mt-7">
          <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">QUI DOIT QUOI À QUI</Eyebrow>
          <div className="mt-3">
            <DebtFlow lines={debts} />
          </div>
        </div>

        <div className="mt-7">
          <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">PAR CATÉGORIE</Eyebrow>
          <div className="mt-3">
            <CategoryTiles tiles={tiles} />
          </div>
        </div>

        <div className="mt-7">
          <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">DÉPENSES RÉCENTES</Eyebrow>
          <div className="mt-3">
            {sortedExpenses.map((e) => (
              <ExpenseRow
                key={e.id}
                payerInitials={initialsFor(e.payer_id)}
                payerColor={colorFor(e.payer_id)}
                label={e.note ?? e.category}
                category={e.category}
                amountCents={e.amount}
                splitsCount={
                  splits.filter((s) => s.expense_id === e.id).length
                }
                when={new Date(e.spent_at).toLocaleDateString('fr')}
              />
            ))}
          </div>
        </div>
      </div>

      <AddExpenseDialog
        tripId={tripId}
        currency={trip.currency ?? 'EUR'}
        members={members.map((m) => ({
          user_id: m.user_id,
          display_name: profMap.get(m.user_id)?.display_name ?? 'XX',
        }))}
      />
    </main>
  )
}
