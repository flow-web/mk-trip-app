'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, MapPin, Navigation, X } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { useRouteLines } from '@/lib/map/useRouteLines'

export default function DrivePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days = useLiveQuery(
    () => db.days.where({ trip_id: tripId }).sortBy('day_number'), [tripId],
  ) ?? []
  const spots = useLiveQuery(
    () => db.spots.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []

  const today = days[0]
  const daySpots = useMemo(
    () => spots.filter((s) => s.day_id === today?.id && s.lat != null && s.lng != null),
    [spots, today?.id],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSpot = daySpots[currentIndex]
  const nextSpot = daySpots[currentIndex + 1]

  const routeSpots = useMemo(() => {
    if (!currentSpot || !nextSpot) return []
    return [
      { id: currentSpot.id, lat: currentSpot.lat!, lng: currentSpot.lng! },
      { id: nextSpot.id, lat: nextSpot.lat!, lng: nextSpot.lng! },
    ]
  }, [currentSpot, nextSpot])

  const { route } = useRouteLines(routeSpots, today?.id ?? 'all', 'driving')

  if (!trip || !today) return null
  const accent = accentFor(trip.trip_type)

  const etaMin = route ? Math.round(route.duration / 60) : null
  const distKm = route ? (route.distance / 1000).toFixed(1) : null

  return (
    <main className="fixed inset-0 bg-ink text-white flex flex-col z-50">
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="mk-mono text-[10px] opacity-60">MODE CONDUITE</div>
          <div className="font-display font-bold text-sm">{trip.destination ?? trip.name}</div>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {currentSpot ? (
          <>
            <div className="mk-mono text-[11px] opacity-50 mb-2">
              SPOT {currentIndex + 1} / {daySpots.length}
            </div>
            <div className="flex items-center gap-3 mb-1">
              <MapPin className="w-6 h-6" style={{ color: accent.base }} />
              <h1 className="font-display font-bold text-3xl">{currentSpot.name}</h1>
            </div>
            <div className="mk-mono text-sm opacity-60 capitalize">{currentSpot.category}</div>

            {nextSpot && route && (
              <div className="mt-10 bg-white/10 rounded-xl px-8 py-6 text-center">
                <div className="mk-mono text-[10px] opacity-50 mb-2">PROCHAIN SPOT</div>
                <div className="font-display font-bold text-xl">{nextSpot.name}</div>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div>
                    <div className="mk-display text-4xl" style={{ color: accent.base }}>
                      {etaMin}
                    </div>
                    <div className="mk-mono text-[10px] opacity-50">MIN</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div>
                    <div className="mk-display text-4xl">{distKm}</div>
                    <div className="mk-mono text-[10px] opacity-50">KM</div>
                  </div>
                </div>
              </div>
            )}

            {!nextSpot && (
              <div className="mt-10 bg-white/10 rounded-xl px-8 py-6 text-center">
                <div className="font-display text-xl">Dernier spot du jour</div>
                <div className="mk-mono text-sm opacity-50 mt-1">Bien joué le crew 🎉</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center opacity-50">
            <Navigation className="w-12 h-12 mx-auto mb-3" />
            <div className="font-display text-xl">Aucun spot pour aujourd'hui</div>
          </div>
        )}
      </div>

      {daySpots.length > 1 && (
        <div className="flex items-center justify-center gap-6 pb-8 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-20 transition"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(daySpots.length - 1, i + 1))}
            disabled={currentIndex >= daySpots.length - 1}
            className="w-16 h-16 rounded-full flex items-center justify-center transition"
            style={{ background: accent.base }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </main>
  )
}
