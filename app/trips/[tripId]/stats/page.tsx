'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { MapPin, Calendar, Users, Wallet, Route, CheckCircle } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: string
}

function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-ink-mute">{icon}</div>
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark text-[10px]">{label}</div>
      </div>
      <div className="mk-display text-3xl" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && (
        <div className="mk-mono text-[11px] text-ink-mute dark:text-ink-mute-dark mt-1">{sub}</div>
      )}
    </div>
  )
}

export default function StatsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days = useLiveQuery(
    () => db.days.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []
  const spots = useLiveQuery(
    () => db.spots.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []
  const expenses = useLiveQuery(
    () => db.expenses.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []
  const members = useLiveQuery(
    () => db.trip_members.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []
  const activities = useLiveQuery(async () => {
    const dayIds = days.map((d) => d.id)
    if (!dayIds.length) return []
    return db.activities.where('day_id').anyOf(dayIds).toArray()
  }, [days]) ?? []
  const completions = useLiveQuery(
    () => db.activity_completions.toArray(), [],
  ) ?? []
  const checkins = useLiveQuery(
    () => db.spot_checkins.toArray(), [],
  ) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  const totalExpenseCents = expenses
    .filter((e) => (e.category as string) !== 'settlement')
    .reduce((s, e) => s + e.amount, 0)
  const perPersonCents = members.length > 0
    ? Math.round(totalExpenseCents / members.length)
    : totalExpenseCents

  const completedActivities = new Set(completions.map((c) => c.activity_id))
  const completionRate = activities.length > 0
    ? Math.round((completedActivities.size / activities.length) * 100)
    : 0

  const checkedInSpots = new Set(checkins.map((c) => c.spot_id))
  const spotCategories = new Map<string, number>()
  for (const s of spots) {
    spotCategories.set(s.category, (spotCategories.get(s.category) ?? 0) + 1)
  }
  const topCategory = [...spotCategories.entries()].sort((a, b) => b[1] - a[1])[0]

  const expenseCategories = new Map<string, number>()
  for (const e of expenses) {
    if ((e.category as string) === 'settlement') continue
    expenseCategories.set(e.category, (expenseCategories.get(e.category) ?? 0) + e.amount)
  }
  const topExpenseCategory = [...expenseCategories.entries()].sort((a, b) => b[1] - a[1])[0]

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <TripSwitcher
          tone="light"
          tripName={trip.name}
          tripType={trip.trip_type}
          sublabel={trip.destination ?? undefined}
        />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">STATISTIQUES</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          Le voyage<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>
            en chiffres.
          </span>
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="DURÉE"
            value={`${days.length}`}
            sub={`jour${days.length > 1 ? 's' : ''}`}
            accent={accent.base}
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="CREW"
            value={`${members.length}`}
            sub={`membre${members.length > 1 ? 's' : ''}`}
          />
          <StatCard
            icon={<MapPin className="w-4 h-4" />}
            label="SPOTS"
            value={`${spots.length}`}
            sub={`${checkedInSpots.size} visité${checkedInSpots.size > 1 ? 's' : ''}`}
          />
          <StatCard
            icon={<Route className="w-4 h-4" />}
            label="ACTIVITÉS"
            value={`${activities.length}`}
            sub={`${completionRate}% complétées`}
          />
          <StatCard
            icon={<Wallet className="w-4 h-4" />}
            label="DÉPENSÉ"
            value={`${(totalExpenseCents / 100).toFixed(0)}€`}
            sub={`${(perPersonCents / 100).toFixed(0)}€ / pers.`}
            accent={accent.base}
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="TOP CATÉGORIE"
            value={topCategory ? topCategory[0] : '—'}
            sub={topCategory ? `${topCategory[1]} spot${topCategory[1] > 1 ? 's' : ''}` : ''}
          />
        </div>

        {topExpenseCategory && (
          <div className="mt-6 bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-4">
            <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark text-[10px] mb-2">
              PLUS GROS POSTE DE DÉPENSE
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display font-bold text-lg capitalize">{topExpenseCategory[0]}</span>
              <span className="mk-mono text-base font-semibold">
                {(topExpenseCategory[1] / 100).toFixed(0)} €
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
