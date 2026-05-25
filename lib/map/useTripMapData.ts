'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { LocalDay, LocalSpot } from '@/lib/db/schema'
import type { MapSpot } from './spotFilters'

export interface UseTripMapData {
  days: LocalDay[]
  spots: MapSpot[]
  loading: boolean
}

export function useTripMapData(tripId: string): UseTripMapData {
  const days = useLiveQuery(
    async () => {
      const all = await db.days.where({ trip_id: tripId }).toArray()
      return all.sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    },
    [tripId],
  )
  const spotsRaw = useLiveQuery(
    () => db.spots.where({ trip_id: tripId }).toArray(),
    [tripId],
  )
  const spots: MapSpot[] = (spotsRaw ?? [])
    .filter((s): s is LocalSpot & { lat: number; lng: number } =>
      s.lat != null && s.lng != null,
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      lat: Number(s.lat),
      lng: Number(s.lng),
      category: s.category,
      day_id: s.day_id ?? null,
      time: null, // spots have no time of their own; line ordering falls back to insertion order via the sort fallback in computeDayLines
    }))
  return {
    days: days ?? [],
    spots,
    loading: days === undefined || spotsRaw === undefined,
  }
}
