'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Printer } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { Eyebrow } from '@/components/design/Eyebrow'

export default function SummaryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days = useLiveQuery(() => db.days.where({ trip_id: tripId }).sortBy('day_number'), [tripId]) ?? []
  const spots = useLiveQuery(() => db.spots.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const expenses = useLiveQuery(() => db.expenses.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const activities = useLiveQuery(async () => {
    const dayIds = days.map((d) => d.id)
    if (!dayIds.length) return []
    return db.activities.where('day_id').anyOf(dayIds).toArray()
  }, [days]) ?? []
  const members = useLiveQuery(() => db.trip_members.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []
  const profMap = new Map(profiles.map((p) => [p.id, p]))

  if (!trip) return null
  const accent = accentFor(trip.trip_type)
  const totalCents = expenses.filter((e) => (e.category as string) !== 'settlement').reduce((s, e) => s + e.amount, 0)

  return (
    <main className="min-h-screen bg-white dark:bg-paper-dark p-8 md:max-w-[800px] md:mx-auto print:p-4 print:max-w-none">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Eyebrow className="text-ink-mute">RÉSUMÉ DU VOYAGE</Eyebrow>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-pill border border-hairline hover:border-ink text-sm transition"
        >
          <Printer className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      <h1 className="font-display font-bold text-4xl">{trip.name}</h1>
      <div className="text-lg text-ink-mute mt-1">{trip.destination}</div>
      {trip.start_date && trip.end_date && (
        <div className="mk-mono text-sm text-ink-mute mt-2">
          {new Date(trip.start_date).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' → '}
          {new Date(trip.end_date).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mt-8 print:grid-cols-4">
        {[
          { label: 'Jours', value: days.length },
          { label: 'Spots', value: spots.length },
          { label: 'Activités', value: activities.length },
          { label: 'Dépensé', value: `${(totalCents / 100).toFixed(0)}€` },
        ].map((s) => (
          <div key={s.label} className="border border-hairline rounded-md p-3 text-center">
            <div className="font-display font-bold text-2xl">{s.value}</div>
            <div className="mk-mono text-[10px] text-ink-mute">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display font-bold text-xl mb-3" style={{ color: accent.base }}>Crew</h2>
        <div className="flex gap-3 flex-wrap">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 bg-paper dark:bg-paper-dark-deep rounded-pill px-3 py-1.5 border border-hairline">
              <span className="text-sm font-medium">{profMap.get(m.user_id)?.display_name ?? '?'}</span>
              <span className="mk-mono text-[9px] text-ink-mute uppercase">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {days.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: accent.base }}>Jour par jour</h2>
          {days.map((d) => {
            const dayActivities = activities.filter((a) => a.day_id === d.id).sort((a, b) => a.position - b.position)
            return (
              <div key={d.id} className="mb-4 break-inside-avoid">
                <div className="font-display font-bold text-base">
                  Jour {d.day_number} {d.date ? `— ${new Date(d.date).toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
                </div>
                {d.theme && <div className="text-sm text-ink-mute italic">{d.theme}</div>}
                {dayActivities.length > 0 && (
                  <ul className="mt-1 ml-4 text-sm space-y-0.5">
                    {dayActivities.map((a) => (
                      <li key={a.id}>
                        <span className="mk-mono text-ink-mute">{a.time?.slice(0, 5) ?? '—'}</span>{' '}
                        {a.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {spots.length > 0 && (
        <div className="mt-8 break-inside-avoid">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: accent.base }}>Spots</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {spots.map((s) => (
              <div key={s.id} className="border border-hairline rounded-md p-2">
                <div className="font-medium">{s.name}</div>
                <div className="mk-mono text-[10px] text-ink-mute uppercase">{s.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
