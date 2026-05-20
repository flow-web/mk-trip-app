'use client'

import Image from 'next/image'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, CalendarPlus, ChevronDown, MapPin, Plus, Receipt } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { defaultHeroFor } from '@/lib/design/hero'
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
  const heroLocal = defaultHeroFor(trip.id, trip.trip_type)
  const heroUrl = heroLocal.startsWith('/')
    ? 'https://images.unsplash.com/photo-1531565637446-32307b194362?w=1200&q=80'
    : heroLocal

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

  return (
    <main className="min-h-screen bg-paper flex flex-col pb-24 md:pb-0">
      <section className="relative h-[420px] md:h-[480px] w-full overflow-hidden">
        <Image
          src={heroUrl}
          alt={trip.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        <div className="absolute top-0 left-0 right-0 pt-14 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,.18)' }}
            >
              <span className="text-white text-sm font-display font-bold">MK</span>
            </div>
            <div className="flex flex-col text-white">
              <div className="flex items-center gap-1 font-display font-bold text-base">
                {trip.name}
                <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
              </div>
              <div className="mk-mono text-[10px] opacity-70">
                {trip.trip_type.toUpperCase()}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-sm border border-white/20 flex items-center justify-center"
          >
            <Bell className="w-4 h-4 text-white" strokeWidth={1.75} />
          </button>
        </div>

        <div className="absolute left-5 right-5 bottom-5 text-white">
          <div className="mk-eyebrow text-white/85">
            {trip.start_date && trip.end_date
              ? `${trip.trip_type.toUpperCase()} · ${formatRange(trip.start_date, trip.end_date)}`
              : trip.trip_type.toUpperCase()}
          </div>
          <h1 className="mk-display text-5xl md:text-7xl mt-2 whitespace-pre-line">
            {trip.name.split(' ').join('\n')}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <span
              className="px-2.5 py-1 rounded-xs text-white text-base mk-display-italic"
              style={{ background: accent.base }}
            >
              JOUR — / —
            </span>
            <span className="mk-mono text-sm">{trip.destination ?? '—'}</span>
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="mk-eyebrow text-ink-mute">À VENIR · AUJOURD'HUI</div>
            <h2 className="font-display font-bold text-xl mt-1">
              {todayActivities.length > 0
                ? `Encore ${remainingCount} chose${remainingCount > 1 ? 's' : ''}.`
                : 'Rien de calé.'}
            </h2>
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 mk-noscroll">
          {nextActivity && (
            <div className="w-[220px] flex-none bg-white rounded-md border border-hairline p-3.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-xs flex items-center justify-center"
                  style={{ background: accent.base }}
                >
                  <span className="text-white text-[10px]">●</span>
                </div>
                <div className="mk-mono text-[10px] text-ink-mute">
                  PROCHAIN · {nextActivity.time?.slice(0, 5) ?? '—'}
                </div>
              </div>
              <div className="font-display font-bold text-lg mt-2.5 leading-tight">
                {nextActivity.title}
              </div>
              <div className="text-xs text-ink-mute mt-0.5">
                {nextActivity.subtitle ?? '—'}
              </div>
            </div>
          )}

          {recentExpense && (
            <div className="w-[200px] flex-none bg-ink text-paper rounded-md p-3.5">
              <div className="mk-mono text-[10px] opacity-60">DERNIÈRE DÉPENSE</div>
              <div className="mk-display text-3xl mt-3 text-white">
                {(recentExpense.amount / 100).toFixed(2)} €
              </div>
              <div className="text-xs opacity-85 mt-0.5">
                {recentExpense.note ?? recentExpense.category}
              </div>
            </div>
          )}

          <div
            className="w-[180px] flex-none rounded-md p-3.5"
            style={{ background: accent.tint }}
          >
            <div className="mk-mono text-[10px]" style={{ color: accent.deep }}>
              MÉTÉO
            </div>
            <div className="mk-display text-3xl mt-3" style={{ color: accent.deep }}>
              —
            </div>
            <div
              className="text-xs opacity-80 mt-1"
              style={{ color: accent.deep }}
            >
              API à brancher
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 mt-8">
        <div className="mk-eyebrow text-ink-mute">LE CREW EN CHIFFRES</div>
        <div className="mt-3 bg-white rounded-md border border-hairline overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex items-baseline justify-between px-4 py-3.5 ${
                i ? 'border-t border-hairline' : ''
              }`}
            >
              <div className="text-sm text-ink-soft">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <div className="mk-display text-2xl">{s.val}</div>
                {s.unit && <div className="mk-mono text-xs text-ink-mute">{s.unit}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="px-5 mt-6 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: Receipt, label: 'Dépense', href: `/trips/${tripId}/budget?new=1` },
            { Icon: MapPin, label: 'Spot', href: `/trips/${tripId}/map?new=1` },
            { Icon: CalendarPlus, label: 'Jour', href: `/trips/${tripId}/planning?new=1` },
          ].map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="bg-white rounded-md border border-hairline p-3 flex flex-col gap-1.5 relative"
            >
              <div className="w-7 h-7 bg-paper rounded-xs flex items-center justify-center">
                <Icon className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="text-sm font-medium">{label}</div>
              <Plus
                className="absolute top-3 right-3 w-3.5 h-3.5 text-ink-mute"
                strokeWidth={2}
              />
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
