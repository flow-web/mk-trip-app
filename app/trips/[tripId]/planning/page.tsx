'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { WeekStrip } from '@/components/planning/WeekStrip'
import { SortableTimeline } from '@/components/planning/SortableTimeline'
import { ImportTicketDialog } from '@/components/planning/ImportTicketDialog'
import type { TicketExtract } from '@/lib/ai/ticketExtractSchema'

export default function PlanningPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [importOpen, setImportOpen] = useState(false)
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days =
    useLiveQuery(
      () => db.days.where({ trip_id: tripId }).sortBy('day_number'),
      [tripId],
    ) ?? []
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const day = activeDayId ? days.find((d) => d.id === activeDayId) : days[0]

  const activities =
    useLiveQuery(async () => {
      if (!day) return []
      return db.activities.where({ day_id: day.id }).sortBy('position')
    }, [day?.id]) ?? []

  const completions =
    useLiveQuery(async () => {
      const ids = activities.map((a) => a.id)
      if (!ids.length) return new Map<string, string>()
      const rows = await db.activity_completions
        .where('activity_id')
        .anyOf(ids)
        .toArray()
      return new Map(rows.map((r) => [r.activity_id, r.completed_at]))
    }, [activities]) ?? new Map<string, string>()

  if (!trip || !day) return null
  const accent = accentFor(trip.trip_type)

  async function toggleActivity(id: string, currentlyDone: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.activity.toggleCompletion(id, user.id, !currentlyDone)
  }

  async function handleReorder(orderedIds: string[]) {
    await mutations.activity.reorder(day!.id, orderedIds)
  }

  async function handleMoveToDay(activityId: string, newDayId: string) {
    const targetActivities = await db.activities
      .where({ day_id: newDayId })
      .sortBy('position')
    const newPosition = targetActivities.length
    await mutations.activity.moveToDay(activityId, newDayId, newPosition)
  }

  async function handleImportTicket(ticket: TicketExtract) {
    const matchDay = days.find((d) => d.date === ticket.date)
    const targetDayId = matchDay?.id ?? days[0]?.id
    if (!targetDayId) return

    const existingActivities = await db.activities
      .where({ day_id: targetDayId })
      .sortBy('position')

    const typeLabels: Record<string, string> = {
      flight: 'Vol', train: 'Train', hotel: 'Hôtel',
      car_rental: 'Location voiture', other: 'Transport',
    }
    const title = `${typeLabels[ticket.type] ?? ticket.type} ${ticket.departure} → ${ticket.arrival}`
    const subtitle = [ticket.carrier, ticket.reference].filter(Boolean).join(' · ') || null

    await mutations.activity.create({
      day_id: targetDayId,
      time: ticket.time ? `${ticket.time}:00` : null,
      title,
      subtitle,
      category: 'activity' as any,
      position: existingActivities.length,
    })
  }

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
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">PLANNING</Eyebrow>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="mk-display text-4xl">
            {day.date
              ? new Date(day.date).toLocaleDateString('fr', {
                  weekday: 'long',
                  day: 'numeric',
                })
              : day.label ?? `Jour ${day.day_number}`}
          </span>
          <span
            className="mk-display-italic text-2xl"
            style={{ color: accent.base }}
          >
            Jour {day.day_number}
          </span>
        </div>
        {day.zone && (
          <div className="text-sm text-ink-soft dark:text-ink-soft-dark mt-0.5">{day.zone}</div>
        )}
        {day.theme && (
          <div className="mk-display-italic text-lg text-ink dark:text-ink-dark mt-1">
            {day.theme}
          </div>
        )}
        {day.note && (
          <div
            className="mt-4 p-4 rounded-xs bg-paper-deep dark:bg-paper-dark-deep border-l-2"
            style={{ borderColor: accent.base }}
          >
            <div className="mk-mono text-[10px] mb-1.5" style={{ color: accent.base }}>
              CARNET DE BORD
            </div>
            <p className="text-sm leading-relaxed text-ink-soft dark:text-ink-soft-dark whitespace-pre-line">
              {day.note}
            </p>
          </div>
        )}
        <WeekStrip
          days={days.map((d) => ({
            id: d.id,
            date: d.date,
            day_number: d.day_number,
            done: d.day_number < day.day_number,
          }))}
          activeDayId={day.id}
          onSelect={setActiveDayId}
          accent={accent}
        />
      </div>
      <div className="mt-4">
        <SortableTimeline
          activities={activities.map((a) => ({
            id: a.id,
            time: a.time,
            title: a.title,
            subtitle: a.subtitle,
            completed_at: completions.get(a.id) ?? null,
          }))}
          accent={accent}
          onToggleActivity={toggleActivity}
          onReorder={handleReorder}
          onMoveToDay={handleMoveToDay}
          days={days.map((d) => ({
            id: d.id,
            day_number: d.day_number,
            date: d.date,
          }))}
          activeDayId={day.id}
        />
      </div>
      <div className="fixed bottom-[88px] right-5 flex gap-2">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="w-13 h-13 rounded-full bg-white shadow-card flex items-center justify-center border border-hairline"
        >
          <FileText className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="w-13 h-13 rounded-full bg-ink shadow-card flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2} />
        </button>
      </div>

      <ImportTicketDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onAccept={handleImportTicket}
      />
    </main>
  )
}
