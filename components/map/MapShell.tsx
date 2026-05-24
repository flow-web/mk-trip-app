'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { useTripMapData } from '@/lib/map/useTripMapData'
import { filterVisibleSpots, computeDayLines, type SelectedDayId } from '@/lib/map/spotFilters'
import { MapDayDock } from './MapDayDock'
import { MapSpotSheet } from './MapSpotSheet'
import { MapSpotDetailSheet } from './MapSpotDetailSheet'
import { AISuggestionsPanel } from '@/components/ai/AISuggestionsPanel'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'
import type { LocalTrip, LocalSpot } from '@/lib/db/schema'

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

  // Trigger 1 : panel auto-ouvert si voyage vide ET pas encore dismissé
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  useEffect(() => {
    if (!trip) return
    const dismissed = (trip as LocalTrip).ai_suggestions_dismissed === true
    if (spots.length === 0 && !dismissed) setAiPanelOpen(true)
  }, [trip, spots.length])

  const handleDismissAiPanel = useCallback(async () => {
    setAiPanelOpen(false)
    if (trip) {
      await db.trips.update(trip.id, { ai_suggestions_dismissed: true } as Partial<LocalTrip>)
    }
  }, [trip])

  const handleAcceptSuggestions = useCallback(async (selected: AISuggestion[]) => {
    if (!trip) return
    const nowIso = new Date().toISOString()
    for (const s of selected) {
      await db.spots.add({
        id: crypto.randomUUID(),
        trip_id: trip.id,
        day_id: selectedDayId === 'all' ? null : selectedDayId,
        name: s.name,
        description: s.description,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        zone: null,
        price: null,
        tags: [],
        image_url: null,
        created_at: nowIso,
        updated_at: nowIso,
      } as LocalSpot)
    }
    setAiPanelOpen(false)
    // Don't set the dismiss flag here — user actively used the panel.
  }, [trip, selectedDayId])

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
        onSuggestAI={() => setAiPanelOpen(true)}
      />

      {/* Sheet détail spot (overlay) */}
      <MapSpotDetailSheet
        spot={selectedSpotFull && selectedSpotFull.lat != null && selectedSpotFull.lng != null
          ? (selectedSpotFull as any)
          : null}
        onClose={() => setSelectedSpotId(null)}
        accentColor={accent.base}
      />

      {/* Panel suggestions IA (overlay) */}
      {aiPanelOpen && trip && (
        <AISuggestionsPanel
          tripId={trip.id}
          destination={trip.destination ?? trip.name}
          tripType={trip.trip_type}
          dayId={selectedDayId === 'all' ? null : selectedDayId}
          excludeSpotIds={spots.map((s) => s.id)}
          onClose={handleDismissAiPanel}
          onAccept={handleAcceptSuggestions}
        />
      )}
    </div>
  )
}
