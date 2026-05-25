import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { useTripMapData } from './useTripMapData'

const TRIP_ID = 'trip-1'

beforeEach(async () => {
  await db.spots.clear()
  await db.days.clear()
})

describe('useTripMapData', () => {
  it('returns empty arrays when no data', async () => {
    const { result } = renderHook(() => useTripMapData(TRIP_ID))
    await waitFor(() => {
      expect(result.current.days).toEqual([])
      expect(result.current.spots).toEqual([])
    })
  })

  it('returns spots and days of the trip, filtering out other trips', async () => {
    await db.days.bulkAdd([
      { id: 'd1', trip_id: TRIP_ID, day_number: 1, date: '2026-01-01' } as any,
      { id: 'd2', trip_id: 'other', day_number: 1, date: '2026-01-01' } as any,
    ])
    await db.spots.bulkAdd([
      { id: 's1', trip_id: TRIP_ID, name: 'A', lat: 1, lng: 1, category: 'food', day_id: 'd1' } as any,
      { id: 's2', trip_id: 'other', name: 'B', lat: 2, lng: 2, category: 'food', day_id: 'd2' } as any,
    ])
    const { result } = renderHook(() => useTripMapData(TRIP_ID))
    await waitFor(() => {
      expect(result.current.days.map((d) => d.id)).toEqual(['d1'])
      expect(result.current.spots.map((s) => s.id)).toEqual(['s1'])
    })
  })

  it('filters out spots without lat/lng', async () => {
    await db.spots.bulkAdd([
      { id: 's1', trip_id: TRIP_ID, name: 'A', lat: null, lng: null, category: 'food', day_id: null } as any,
      { id: 's2', trip_id: TRIP_ID, name: 'B', lat: 1, lng: 1, category: 'food', day_id: null } as any,
    ])
    const { result } = renderHook(() => useTripMapData(TRIP_ID))
    await waitFor(() => {
      expect(result.current.spots.map((s) => s.id)).toEqual(['s2'])
    })
  })

  it('orders days by day_number ascending', async () => {
    await db.days.bulkAdd([
      { id: 'd3', trip_id: TRIP_ID, day_number: 3, date: '2026-01-03' } as any,
      { id: 'd1', trip_id: TRIP_ID, day_number: 1, date: '2026-01-01' } as any,
      { id: 'd2', trip_id: TRIP_ID, day_number: 2, date: '2026-01-02' } as any,
    ])
    const { result } = renderHook(() => useTripMapData(TRIP_ID))
    await waitFor(() => {
      expect(result.current.days.map((d) => d.day_number)).toEqual([1, 2, 3])
    })
  })
})
