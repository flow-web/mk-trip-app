'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Pause, SkipForward, X } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'

export default function ReplayPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const days = useLiveQuery(
    () => db.days.where({ trip_id: tripId }).sortBy('day_number'), [tripId],
  ) ?? []
  const spots = useLiveQuery(
    () => db.spots.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []

  const sortedSpots = [...spots]
    .filter((s) => s.lat != null && s.lng != null)
    .sort((a, b) => {
      const dayA = days.findIndex((d) => d.id === a.day_id)
      const dayB = days.findIndex((d) => d.id === b.day_id)
      return dayA - dayB
    })

  const [currentIndex, setCurrentIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)

  const current = currentIndex >= 0 && currentIndex < sortedSpots.length ? sortedSpots[currentIndex] : null
  const currentDay = current?.day_id ? days.find((d) => d.id === current.day_id) : null
  const progress = sortedSpots.length > 0 ? ((currentIndex + 1) / sortedSpots.length) * 100 : 0

  useEffect(() => {
    if (!playing) return
    if (currentIndex >= sortedSpots.length - 1) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      setCurrentIndex((i) => i + 1)
    }, 2000)
    return () => clearTimeout(timer)
  }, [playing, currentIndex, sortedSpots.length])

  const handlePlay = useCallback(() => {
    if (currentIndex >= sortedSpots.length - 1) setCurrentIndex(-1)
    setPlaying(true)
    if (currentIndex < 0) setCurrentIndex(0)
  }, [currentIndex, sortedSpots.length])

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  return (
    <main className="fixed inset-0 bg-ink text-white flex flex-col z-50">
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="mk-mono text-[10px] opacity-60">REPLAY</div>
          <div className="font-display font-bold text-sm">{trip.name}</div>
        </div>
        <div className="w-10" />
      </div>

      <div className="w-full px-5 mt-2">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: accent.base }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="mk-mono text-[10px] opacity-40">
            {currentIndex >= 0 ? currentIndex + 1 : 0} / {sortedSpots.length}
          </span>
          {currentDay && (
            <span className="mk-mono text-[10px] opacity-40">
              Jour {currentDay.day_number}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {current ? (
          <div className="text-center animate-in fade-in duration-500">
            <div className="mk-mono text-[10px] opacity-50 uppercase mb-2">{current.category}</div>
            <h1 className="font-display font-bold text-4xl">{current.name}</h1>
            {current.description && (
              <p className="mt-3 text-sm opacity-60 max-w-[300px] mx-auto">{current.description}</p>
            )}
            {currentDay && (
              <div className="mt-4 mk-mono text-[11px] opacity-40">
                {currentDay.date ? new Date(currentDay.date).toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' }) : `Jour ${currentDay.day_number}`}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="font-display font-bold text-3xl mb-2">{trip.destination ?? trip.name}</div>
            <div className="opacity-50 text-sm">{sortedSpots.length} spots à revivre</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => {
            if (playing) { setPlaying(false) } else { handlePlay() }
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: accent.base }}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </button>
        <button
          onClick={() => {
            if (currentIndex < sortedSpots.length - 1) setCurrentIndex((i) => i + 1)
          }}
          disabled={currentIndex >= sortedSpots.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-20"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </main>
  )
}
