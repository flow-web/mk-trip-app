'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { X, Navigation, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase/client'
import { accentFor } from '@/lib/design/accent'

interface MemberPosition {
  userId: string
  name: string
  lat: number
  lng: number
  updatedAt: number
}

const AVATAR_COLORS = ['#C75A20', '#5A6E3E', '#1E3A5C', '#B14E32', '#3D362C']

export default function ConvoyPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []
  const profMap = new Map(profiles.map((p) => [p.id, p]))

  const [positions, setPositions] = useState<Map<string, MemberPosition>>(new Map())
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [sharing, setSharing] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`convoy:${tripId}`, {
      config: { broadcast: { self: false } },
    })

    channel.on('broadcast', { event: 'position' }, ({ payload }) => {
      const p = payload as { userId: string; lat: number; lng: number }
      setPositions((prev) => {
        const next = new Map(prev)
        next.set(p.userId, {
          userId: p.userId,
          name: profMap.get(p.userId)?.display_name ?? '?',
          lat: p.lat,
          lng: p.lng,
          updatedAt: Date.now(),
        })
        return next
      })
    })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [tripId])

  const startSharing = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (!navigator.geolocation) return

    setSharing(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMyPosition({ lat, lng })
        channelRef.current?.send({
          type: 'broadcast',
          event: 'position',
          payload: { userId: user.id, lat, lng },
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [])

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setSharing(false)
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  if (!trip) return null
  const accent = accentFor(trip.trip_type)
  const allPositions = [...positions.values()]

  return (
    <main className="fixed inset-0 bg-ink text-white flex flex-col z-50">
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={() => { stopSharing(); router.back() }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="mk-mono text-[10px] opacity-60">MODE CONVOI</div>
          <div className="font-display font-bold text-sm">{trip.destination ?? trip.name}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Users className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <Navigation className="w-12 h-12 mb-4" style={{ color: accent.base }} />

        {!sharing ? (
          <button
            onClick={startSharing}
            className="px-8 py-4 rounded-2xl font-display font-bold text-xl transition"
            style={{ background: accent.base }}
          >
            Partager ma position
          </button>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="font-display font-bold text-xl">Position partagée</div>
              {myPosition && (
                <div className="mk-mono text-[11px] opacity-50 mt-1">
                  {myPosition.lat.toFixed(4)}, {myPosition.lng.toFixed(4)}
                </div>
              )}
            </div>
            <button
              onClick={stopSharing}
              className="px-6 py-2 rounded-full bg-white/10 text-sm"
            >
              Arrêter le partage
            </button>
          </>
        )}

        {allPositions.length > 0 && (
          <div className="mt-8 w-full max-w-sm space-y-3">
            <div className="mk-mono text-[10px] opacity-50 text-center">
              CREW EN LIGNE · {allPositions.length}
            </div>
            {allPositions.map((p, i) => {
              const age = Math.round((Date.now() - p.updatedAt) / 1000)
              return (
                <div key={p.userId} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="mk-mono text-[10px] opacity-50">
                      {age < 10 ? 'maintenant' : `il y a ${age}s`}
                    </div>
                  </div>
                  <div className="mk-mono text-[10px] opacity-40">
                    {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
