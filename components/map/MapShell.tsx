'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { accentFor } from '@/lib/design/accent'
import { useTripMapData } from '@/lib/map/useTripMapData'
import { filterVisibleSpots, computeDayLines, type SelectedDayId } from '@/lib/map/spotFilters'
import { useRouteLines } from '@/lib/map/useRouteLines'
import { optimizeRoute } from '@/lib/map/optimizeRoute'
import { MapDayDock } from './MapDayDock'
import { TransportModeToggle } from './TransportModeToggle'
import { MapSpotSheet } from './MapSpotSheet'
import { MapSpotDetailSheet } from './MapSpotDetailSheet'
import { AISuggestionsPanel } from '@/components/ai/AISuggestionsPanel'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'
import type { LocalTrip, LocalDay } from '@/lib/db/schema'

const MapView = dynamic(
  () => import('./MapView').then((m) => m.MapView),
  { ssr: false },
)

// Feature flag: set NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED=false to disable AI suggestions entirely.
// Defaults to ON so production is not broken if the env var is absent.
const AI_SUGGESTIONS_ENABLED =
  process.env.NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED !== 'false'

interface Props {
  tripId: string
}

export function MapShell({ tripId }: Props) {
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const { days, spots } = useTripMapData(tripId)
  const [selectedDayId, setSelectedDayId] = useState<SelectedDayId>('all')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)

  const selectedDay = useLiveQuery(
    () => (selectedDayId !== 'all' ? db.days.get(selectedDayId) : undefined),
    [selectedDayId],
  )
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving')

  useEffect(() => {
    if (selectedDay) {
      setTransportMode((selectedDay as LocalDay).transport_mode ?? 'driving')
    }
  }, [selectedDay?.id])

  const handleTransportChange = useCallback(async (mode: 'driving' | 'walking' | 'cycling') => {
    setTransportMode(mode)
    if (selectedDayId !== 'all') {
      await db.days.update(selectedDayId, { transport_mode: mode } as Partial<LocalDay>)
    }
  }, [selectedDayId])

  const visibleSpots = useMemo(
    () => filterVisibleSpots(spots, selectedDayId),
    [spots, selectedDayId],
  )
  const fallbackLines = useMemo(
    () => computeDayLines(spots, selectedDayId),
    [spots, selectedDayId],
  )

  const routeSpots = useMemo(
    () => visibleSpots.filter((s) => s.lat != null && s.lng != null).map((s) => ({
      id: s.id, lat: s.lat!, lng: s.lng!,
    })),
    [visibleSpots],
  )
  const { route, loading: routeLoading } = useRouteLines(routeSpots, selectedDayId, transportMode)

  const lines = useMemo(() => {
    if (route && selectedDayId !== 'all') {
      return [{ day_id: selectedDayId, coordinates: route.coordinates }]
    }
    return fallbackLines
  }, [route, selectedDayId, fallbackLines])

  // Re-fetch full LocalSpot for detail (includes description, image_url)
  const selectedSpotFull = useLiveQuery(
    () => (selectedSpotId ? db.spots.get(selectedSpotId) : undefined),
    [selectedSpotId],
  )

  const checkins = useLiveQuery(
    () => db.spot_checkins.where({ spot_id: selectedSpotId ?? '' }).toArray(),
    [selectedSpotId],
  ) ?? []

  const isCheckedIn = checkins.some((c) => c.user_id === trip?.owner_id)

  // Trigger 1 : panel auto-ouvert si voyage vide ET pas encore dismissé (gated by feature flag)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  useEffect(() => {
    if (!AI_SUGGESTIONS_ENABLED) return
    if (!trip) return
    const dismissed = (trip as LocalTrip).ai_suggestions_dismissed === true
    if (spots.length === 0 && !dismissed) setAiPanelOpen(true)
  }, [trip, spots.length])

  const [optimizing, setOptimizing] = useState(false)
  const handleOptimize = useCallback(async () => {
    if (routeSpots.length < 3) return
    setOptimizing(true)
    try {
      const result = await optimizeRoute(routeSpots, transportMode)
      if (result) {
        // Reorder spots based on optimized order — no position field, just visual feedback via route
        // The optimized route coordinates are displayed automatically via the cache
      }
    } finally {
      setOptimizing(false)
    }
  }, [routeSpots, transportMode])

  const handleDismissAiPanel = useCallback(async () => {
    setAiPanelOpen(false)
    if (trip) {
      await db.trips.update(trip.id, { ai_suggestions_dismissed: true } as Partial<LocalTrip>)
    }
  }, [trip])

  const handleAcceptSuggestions = useCallback(async (selected: AISuggestion[]) => {
    if (!trip) return
    for (const s of selected) {
      // mutations.spot.create: Dexie optimistic write + enqueue for Supabase sync.
      // image_url is a local-only extension on LocalSpot (not in Supabase schema yet).
      await mutations.spot.create({
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
      })
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

      {/* Day dock flottant + transport toggle */}
      {days.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <MapDayDock
              days={days}
              selectedDayId={selectedDayId}
              onSelect={(id) => {
                setSelectedDayId(id)
                setSelectedSpotId(null)
              }}
            />
          </div>
          {selectedDayId !== 'all' && (
            <div className="flex items-center justify-center gap-3 mt-2 pointer-events-auto">
              <TransportModeToggle value={transportMode} onChange={handleTransportChange} />
              {route && (
                <div className="bg-white/90 dark:bg-paper-dark/90 backdrop-blur rounded-full px-3 py-1.5 shadow-sm">
                  <span className="mk-mono text-[11px] text-ink-mute">
                    {route.distance >= 1000
                      ? `${(route.distance / 1000).toFixed(1)} km`
                      : `${Math.round(route.distance)} m`}
                    {' · '}
                    {route.duration >= 3600
                      ? `${Math.floor(route.duration / 3600)}h${Math.round((route.duration % 3600) / 60).toString().padStart(2, '0')}`
                      : `${Math.round(route.duration / 60)} min`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom sheet liste spots */}
      <MapSpotSheet
        spots={visibleSpots}
        label={dayLabel}
        onSpotClick={setSelectedSpotId}
        onSuggestAI={AI_SUGGESTIONS_ENABLED ? () => setAiPanelOpen(true) : undefined}
        onOptimize={selectedDayId !== 'all' && routeSpots.length >= 3 ? handleOptimize : undefined}
        optimizing={optimizing}
      />

      {/* Sheet détail spot (overlay) */}
      <MapSpotDetailSheet
        spot={selectedSpotFull && selectedSpotFull.lat != null && selectedSpotFull.lng != null
          ? (selectedSpotFull as any)
          : null}
        onClose={() => setSelectedSpotId(null)}
        accentColor={accent.base}
        checkedIn={isCheckedIn}
        onToggleCheckin={selectedSpotId ? async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user || !selectedSpotId) return
          if (isCheckedIn) {
            await mutations.spot.uncheckIn(selectedSpotId, user.id)
          } else {
            await mutations.spot.checkin(selectedSpotId, user.id)
          }
        } : undefined}
        onUpdateEstimatedCost={selectedSpotId ? async (cents: number) => {
          await mutations.spot.update(selectedSpotId, { estimated_cost: cents } as any)
        } : undefined}
      />

      {/* Panel suggestions IA (overlay) — gated by AI_SUGGESTIONS_ENABLED */}
      {AI_SUGGESTIONS_ENABLED && aiPanelOpen && trip && (
        <AISuggestionsPanel
          tripId={trip.id}
          destination={trip.destination ?? trip.name}
          tripType={trip.trip_type}
          dayId={selectedDayId === 'all' ? null : selectedDayId}
          excludeSpotNames={spots.map((s) => s.name)}
          onClose={handleDismissAiPanel}
          onAccept={handleAcceptSuggestions}
        />
      )}
    </div>
  )
}
