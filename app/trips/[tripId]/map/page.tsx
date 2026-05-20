'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'

import { MapSheet } from '@/components/map/MapSheet'

const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  { ssr: false },
)

export default function MapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const spots =
    useLiveQuery(() => db.spots.where({ trip_id: tripId }).toArray(), [tripId]) ??
    []
  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  const geoSpots = spots
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({
      id: s.id,
      name: s.name,
      lat: Number(s.lat),
      lng: Number(s.lng),
      category: s.category,
    }))

  const sheetSpots = spots.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
  }))

  return (
    <main className="h-screen flex flex-col">
      <div className="md:flex md:h-screen flex-1 min-h-0">
        <div className="flex-1 relative">
          <MapView accent={accent} spots={geoSpots} />
        </div>
        <aside className="hidden md:flex md:flex-col md:w-[360px] md:border-l md:border-hairline md:dark:border-hairline-dark md:bg-paper md:dark:bg-paper-dark md:overflow-y-auto p-5 gap-3">
          <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">
            TOUS LES SPOTS
          </div>
          <div className="font-display font-bold text-lg">
            {spots.length} spot{spots.length > 1 ? 's' : ''}
          </div>
          <ul className="space-y-0">
            {sheetSpots.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 py-3 ${
                  i ? 'border-t border-hairline dark:border-hairline-dark' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xs flex items-center justify-center"
                  style={{ background: accent.base }}
                >
                  <span className="text-white text-xs">●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
                    {s.category.toUpperCase()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <div className="md:hidden">
        <MapSheet accent={accent} spots={sheetSpots} />
      </div>
    </main>
  )
}
