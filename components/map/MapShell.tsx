'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { useTripMapData } from '@/lib/map/useTripMapData'
import { filterVisibleSpots, computeDayLines, type SelectedDayId } from '@/lib/map/spotFilters'
import { MapDayDock } from './MapDayDock'
import { MapSpotSheet } from './MapSpotSheet'
import { MapSpotDetailSheet } from './MapSpotDetailSheet'

const MapView = dynamic(
  () => import('./MapView').then((m) => m.MapView),
  { ssr: false },
)

interface Props {
  tripId: string
}

export function MapShell({ tripId }: Props) {
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const { days, spots } = useTripMapData(tripId)
  const [selectedDayId, setSelectedDayId] = useState<SelectedDayId>('all')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)

  const visibleSpots = useMemo(
    () => filterVisibleSpots(spots, selectedDayId),
    [spots, selectedDayId],
  )
  const lines = useMemo(
    () => computeDayLines(spots, selectedDayId),
    [spots, selectedDayId],
  )

  // Re-fetch full LocalSpot for detail (includes description, image_url)
  const selectedSpotFull = useLiveQuery(
    () => (selectedSpotId ? db.spots.get(selectedSpotId) : undefined),
    [selectedSpotId],
  )

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  const dayLabel = (() => {
    if (selectedDayId === 'all') return 'Tous les spots'
    const d = days.find((dd) => dd.id === selectedDayId)
    return d ? `Jour ${d.day_number ?? '?'}` : 'Jour'
  })()

  return (
    <div className="fixed inset-0 z-10" data-testid="map-shell">
      {/* Map canvas plein écran */}
      <div className="absolute inset-0">
        <MapView
          spots={visibleSpots}
          days={days}
          lines={lines}
          selectedSpotId={selectedSpotId}
          selectedDayId={selectedDayId}
          onSpotClick={setSelectedSpotId}
        />
      </div>

      {/* Day dock flottant */}
      {days.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <MapDayDock
            days={days}
            selectedDayId={selectedDayId}
            onSelect={(id) => {
              setSelectedDayId(id)
              setSelectedSpotId(null)
            }}
          />
        </div>
      )}

      {/* Bottom sheet liste spots */}
      <MapSpotSheet
        spots={visibleSpots}
        label={dayLabel}
        onSpotClick={setSelectedSpotId}
      />

      {/* Sheet détail spot (overlay) */}
      <MapSpotDetailSheet
        spot={selectedSpotFull && selectedSpotFull.lat != null && selectedSpotFull.lng != null
          ? (selectedSpotFull as any)
          : null}
        onClose={() => setSelectedSpotId(null)}
        accentColor={accent.base}
      />
    </div>
  )
}
