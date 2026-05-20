'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'

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

  return (
    <main className="h-screen flex flex-col">
      <div className="flex-1 relative">
        <MapView accent={accent} spots={geoSpots} />
      </div>
      {/* MapSheet — Task 30 */}
    </main>
  )
}
