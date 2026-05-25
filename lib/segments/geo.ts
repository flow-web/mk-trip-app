import type { TracePoint, RunStats } from './types'

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

export function totalDistanceMeters(points: TracePoint[]): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    total += haversineMeters(a.lat, a.lng, b.lat, b.lng)
  }
  return total
}

export function computeRunStats(points: TracePoint[]): RunStats {
  if (points.length < 2) {
    return { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 }
  }
  const durationMs = points[points.length - 1].t - points[0].t
  let distanceM = 0
  let speedMaxKmh = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const d = haversineMeters(a.lat, a.lng, b.lat, b.lng)
    distanceM += d
    const dt = (b.t - a.t) / 1000
    if (dt > 0) {
      const kmh = (d / dt) * 3.6
      if (kmh > speedMaxKmh) speedMaxKmh = kmh
    }
  }
  const speedAvgKmh = durationMs > 0 ? (distanceM / (durationMs / 1000)) * 3.6 : 0
  return {
    durationMs,
    distanceM: Math.round(distanceM),
    speedAvgKmh: Math.round(speedAvgKmh * 100) / 100,
    speedMaxKmh: Math.round(speedMaxKmh * 100) / 100,
  }
}

export interface GeoJsonLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export function pointsToLineString(points: TracePoint[]): GeoJsonLineString {
  if (points.length < 2) {
    throw new Error('LineString needs at least 2 points')
  }
  return {
    type: 'LineString',
    coordinates: points.map((p) => [p.lng, p.lat]),
  }
}
