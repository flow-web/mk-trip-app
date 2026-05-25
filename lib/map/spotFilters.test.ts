import { describe, it, expect } from 'vitest'
import { filterVisibleSpots, computeDayLines, type MapSpot } from './spotFilters'

const spots: MapSpot[] = [
  { id: 's1', name: 'A', lat: 38.7, lng: -9.1, category: 'food', day_id: 'd1', time: '09:00' },
  { id: 's2', name: 'B', lat: 38.71, lng: -9.11, category: 'culture', day_id: 'd1', time: '12:00' },
  { id: 's3', name: 'C', lat: 38.72, lng: -9.12, category: 'nature', day_id: 'd2', time: '10:00' },
  { id: 's4', name: 'D', lat: 38.73, lng: -9.13, category: 'sport', day_id: null, time: null },
]

describe('filterVisibleSpots', () => {
  it('returns all spots when selectedDayId is "all"', () => {
    expect(filterVisibleSpots(spots, 'all')).toEqual(spots)
  })

  it('returns only spots of the selected day', () => {
    const result = filterVisibleSpots(spots, 'd1')
    expect(result.map((s) => s.id)).toEqual(['s1', 's2'])
  })

  it('excludes spots without day_id when a specific day is selected', () => {
    const result = filterVisibleSpots(spots, 'd2')
    expect(result.map((s) => s.id)).toEqual(['s3'])
  })

  it('returns empty array if no spot matches', () => {
    expect(filterVisibleSpots(spots, 'nonexistent')).toEqual([])
  })

  it('handles empty input', () => {
    expect(filterVisibleSpots([], 'all')).toEqual([])
  })
})

describe('computeDayLines', () => {
  it('returns no lines when selectedDayId is "all"', () => {
    expect(computeDayLines(spots, 'all')).toEqual([])
  })

  it('returns one line connecting spots of the day in time order', () => {
    const lines = computeDayLines(spots, 'd1')
    expect(lines).toHaveLength(1)
    expect(lines[0].coordinates).toEqual([
      [-9.1, 38.7],   // s1 first (09:00)
      [-9.11, 38.71], // s2 second (12:00)
    ])
  })

  it('returns no line if the day has less than 2 spots', () => {
    expect(computeDayLines(spots, 'd2')).toEqual([])
  })

  it('orders spots by time ascending, nulls last', () => {
    const mixed: MapSpot[] = [
      { id: 'x', name: 'X', lat: 1, lng: 1, category: 'food', day_id: 'd', time: null },
      { id: 'y', name: 'Y', lat: 2, lng: 2, category: 'food', day_id: 'd', time: '08:00' },
      { id: 'z', name: 'Z', lat: 3, lng: 3, category: 'food', day_id: 'd', time: '15:00' },
    ]
    const lines = computeDayLines(mixed, 'd')
    expect(lines[0].coordinates).toEqual([
      [2, 2], // y first (08:00)
      [3, 3], // z second (15:00)
      [1, 1], // x last (null time)
    ])
  })
})
