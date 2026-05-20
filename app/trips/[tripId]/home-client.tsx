'use client'

import Image from 'next/image'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, ChevronDown } from 'lucide-react'
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
  // Phase 5 : remplace par photos hostées Supabase ; en attendant, fallback Unsplash temporaire
  const heroUrl = heroLocal.startsWith('/')
    ? 'https://images.unsplash.com/photo-1531565637446-32307b194362?w=1200&q=80'
    : heroLocal

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
      {/* Upcoming carousel — Task 19 */}
      {/* Crew stats — Task 20 */}
      {/* Quick actions — Task 21 */}
    </main>
  )
}
