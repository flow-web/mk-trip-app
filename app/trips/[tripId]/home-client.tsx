'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { defaultHeroFor } from '@/lib/design/hero'
import type { Database } from '@/lib/supabase/types'

type Trip = Database['public']['Tables']['trips']['Row']

export function HomeClient({
  initialTrip,
  tripId,
}: {
  initialTrip: Trip
  tripId: string
}) {
  const trip = useLiveQuery(() => db.trips.get(tripId)) ?? initialTrip
  const accent = accentFor(trip.trip_type)
  const heroUrl = defaultHeroFor(trip.id, trip.trip_type)

  return (
    <main className="min-h-screen bg-paper flex flex-col">
      {/* Hero — Task 18 */}
      {/* Upcoming carousel — Task 19 */}
      {/* Crew stats — Task 20 */}
      {/* Quick actions — Task 21 */}
      {/* Bottom tab — Task 22 */}
      <div className="p-6">
        <div className="mk-eyebrow text-ink-mute">SKELETON</div>
        <h1 className="mk-display text-4xl mt-2">{trip.name}</h1>
        <div className="mk-mono text-sm text-ink-mute mt-2">
          accent: {accent.base} · hero: {heroUrl}
        </div>
      </div>
    </main>
  )
}
