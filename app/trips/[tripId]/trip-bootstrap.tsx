'use client'

import { useEffect } from 'react'
import { hydrateTrip } from '@/lib/db/hydrate'
import { subscribeTrip } from '@/lib/db/realtime'
import { useCurrentTripId } from '@/lib/stores/currentTrip'

export function TripBootstrap({ tripId }: { tripId: string }) {
  const setTripId = useCurrentTripId((s) => s.setTripId)
  useEffect(() => {
    setTripId(tripId)
    hydrateTrip(tripId).catch(console.warn)
    const channel = subscribeTrip(tripId)
    return () => {
      channel.unsubscribe()
      setTripId(null)
    }
  }, [tripId, setTripId])
  return null
}
