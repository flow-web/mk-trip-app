import { describe, it, expect } from 'vitest'
import {
  haversineMeters,
  totalDistanceMeters,
  computeRunStats,
  pointsToLineString,
} from '../geo'
import type { TracePoint } from '../types'

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMeters(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0)
  })

  it('returns ~111km between (0,0) and (1,0)', () => {
    const d = haversineMeters(0, 0, 1, 0)
    expect(d).toBeGreaterThan(111_000)
    expect(d).toBeLessThan(111_500)
  })

  it('returns ~157m between two Paris points', () => {
    const d = haversineMeters(48.8566, 2.3522, 48.8580, 2.3522)
    expect(d).toBeGreaterThan(150)
    expect(d).toBeLessThan(165)
  })
})

describe('totalDistanceMeters', () => {
  it('returns 0 for empty or single-point trace', () => {
    expect(totalDistanceMeters([])).toBe(0)
    expect(totalDistanceMeters([{ lat: 0, lng: 0, t: 0 }])).toBe(0)
  })

  it('sums distances between consecutive points', () => {
    const pts: TracePoint[] = [
      { lat: 0, lng: 0, t: 0 },
      { lat: 1, lng: 0, t: 1000 },
      { lat: 2, lng: 0, t: 2000 },
    ]
    const total = totalDistanceMeters(pts)
    expect(total).toBeGreaterThan(222_000)
    expect(total).toBeLessThan(223_000)
  })
})

describe('computeRunStats', () => {
  it('returns zeros for empty trace', () => {
    const s = computeRunStats([])
    expect(s.distanceM).toBe(0)
    expect(s.durationMs).toBe(0)
    expect(s.speedAvgKmh).toBe(0)
    expect(s.speedMaxKmh).toBe(0)
  })

  it('computes avg and max speed from a 3-point trace', () => {
    const pts: TracePoint[] = [
      { lat: 48.8566, lng: 2.3522, t: 0 },
      { lat: 48.85750, lng: 2.3522, t: 10_000 },
      { lat: 48.85930, lng: 2.3522, t: 20_000 },
    ]
    const s = computeRunStats(pts)
    expect(s.durationMs).toBe(20_000)
    expect(s.distanceM).toBeGreaterThan(290)
    expect(s.distanceM).toBeLessThan(310)
    expect(s.speedMaxKmh).toBeGreaterThan(70)
    expect(s.speedMaxKmh).toBeLessThan(75)
    expect(s.speedAvgKmh).toBeGreaterThan(50)
    expect(s.speedAvgKmh).toBeLessThan(56)
  })
})

describe('pointsToLineString', () => {
  it('returns a GeoJSON LineString', () => {
    const ls = pointsToLineString([
      { lat: 48.8566, lng: 2.3522, t: 0 },
      { lat: 48.8580, lng: 2.3522, t: 1000 },
    ])
    expect(ls.type).toBe('LineString')
    expect(ls.coordinates).toHaveLength(2)
    expect(ls.coordinates[0]).toEqual([2.3522, 48.8566])
  })

  it('throws on < 2 points (PostGIS LineString invalid)', () => {
    expect(() => pointsToLineString([])).toThrow()
    expect(() => pointsToLineString([{ lat: 0, lng: 0, t: 0 }])).toThrow()
  })
})
