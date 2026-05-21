'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { defaultHeroFor } from '@/lib/design/hero'
import { Hero } from '@/components/design/Hero'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { UpcomingCarousel } from '@/components/home/UpcomingCarousel'
import { CrewStats } from '@/components/home/CrewStats'
import { QuickActions } from '@/components/home/QuickActions'
import type { Database } from '@/lib/supabase/types'

type Trip = Database['public']['Tables']['trips']['Row']

function formatRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' })
  return `${fmt.format(s)} → ${fmt.format(e)}`
}

export function HomeClient({
  initialTrip,
  tripId,
}: {
  initialTrip: Trip
  tripId: string
}) {
  const trip = useLiveQuery(() => db.trips.get(tripId)) ?? initialTrip
  const accent = accentFor(trip.trip_type)
  const heroUrl =
    trip.hero_image_url ?? defaultHeroFor(trip.id, trip.trip_type)

  const today = new Date().toISOString().slice(0, 10)

  const todayActivities = useLiveQuery(async () => {
    const days = await db.days.where({ trip_id: tripId }).toArray()
    const todayDay = days.find((d) => d.date === today)
    if (!todayDay) return []
    return db.activities.where({ day_id: todayDay.id }).sortBy('position')
  }, [tripId, today]) ?? []

  const completedActivityIds = useLiveQuery(async () => {
    const ids = todayActivities.map((a) => a.id)
    if (!ids.length) return new Set<string>()
    const comps = await db.activity_completions
      .where('activity_id')
      .anyOf(ids)
      .toArray()
    return new Set(comps.map((c) => c.activity_id))
  }, [todayActivities]) ?? new Set<string>()

  const recentExpense = useLiveQuery(async () => {
    const list = await db.expenses.where({ trip_id: tripId }).sortBy('spent_at')
    return list[list.length - 1]
  }, [tripId])

  const nextActivity = todayActivities.find((a) => !completedActivityIds.has(a.id))
  const remainingCount = todayActivities.filter(
    (a) => !completedActivityIds.has(a.id),
  ).length

  const expenses = useLiveQuery(
    () => db.expenses.where({ trip_id: tripId }).toArray(),
    [tripId],
  ) ?? []
  const days = useLiveQuery(
    () => db.days.where({ trip_id: tripId }).toArray(),
    [tripId],
  ) ?? []
  const allActivities = useLiveQuery(async () => {
    const dayIds = days.map((d) => d.id)
    if (!dayIds.length) return []
    return db.activities.where('day_id').anyOf(dayIds).toArray()
  }, [days]) ?? []
  const allCompletedIds = useLiveQuery(async () => {
    const ids = allActivities.map((a) => a.id)
    if (!ids.length) return new Set<string>()
    const comps = await db.activity_completions
      .where('activity_id')
      .anyOf(ids)
      .toArray()
    return new Set(comps.map((c) => c.activity_id))
  }, [allActivities]) ?? new Set<string>()

  const totalSpent = expenses.reduce((s, e) => s + (e.amount ?? 0), 0) / 100
  const budget = trip.total_budget ?? 0
  const spotsTotal = allActivities.length
  const spotsDone = allActivities.filter((a) => allCompletedIds.has(a.id)).length
  const daysTotal = days.length
  const daysElapsed = trip.start_date
    ? Math.max(
        0,
        Math.min(
          daysTotal,
          Math.floor((Date.now() - new Date(trip.start_date).getTime()) / 86_400_000) + 1,
        ),
      )
    : 0

  const stats = [
    { label: 'jours', val: `${daysElapsed} / ${daysTotal}`, unit: '' },
    { label: 'spots faits', val: `${spotsDone} / ${spotsTotal}`, unit: '' },
    { label: 'budget', val: totalSpent.toFixed(0), unit: budget ? `/ ${budget}€` : '€' },
  ]

  const typeLabel = (trip.trip_type ?? 'other').toUpperCase()
  const heroEyebrow =
    trip.start_date && trip.end_date
      ? `${typeLabel} · ${formatRange(trip.start_date, trip.end_date)}`
      : typeLabel
  const heroBadge =
    daysTotal > 0 ? `JOUR ${daysElapsed} / ${daysTotal}` : 'JOUR — / —'

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark flex flex-col pb-24 md:pb-0">
      <Hero
        photo={heroUrl}
        accent={accent}
        eyebrow={heroEyebrow}
        title={trip.name.split(' ').join('\n')}
        metaBadge={heroBadge}
        metaRight={trip.destination ?? '—'}
        topBar={
          <TripSwitcher
            tone="dark"
            tripName={trip.name}
            tripType={trip.trip_type}
            sublabel={trip.destination ?? undefined}
          />
        }
      />

      <div className="md:grid md:grid-cols-[1.4fr_1fr] md:gap-6 md:px-8 md:py-6">
        <div className="md:flex md:flex-col md:gap-5">
          <UpcomingCarousel
            accent={accent}
            nextActivity={nextActivity}
            recentExpense={recentExpense}
            remainingCount={remainingCount}
          />
          <CrewStats stats={stats} />
          <div className="md:hidden">
            <QuickActions tripId={tripId} />
          </div>
        </div>
        <div className="hidden md:flex md:flex-col md:gap-3.5">
          <div className="bg-paper-deep dark:bg-paper-dark-deep rounded-md h-[220px] flex items-center justify-center text-ink-mute dark:text-ink-mute-dark">
            <span className="mk-mono text-xs">MINI MAP · TODO</span>
          </div>
          <QuickActions tripId={tripId} />
        </div>
      </div>
    </main>
  )
}
