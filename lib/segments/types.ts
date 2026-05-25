export type ActivityKind = 'skate' | 'run' | 'bike' | 'car' | 'walk' | 'other'

export interface TracePoint {
  lat: number
  lng: number
  /** ms epoch */
  t: number
  /** précision GPS en mètres (depuis GeolocationCoordinates.accuracy) */
  accuracy?: number
}

export interface RunStats {
  durationMs: number
  distanceM: number
  speedAvgKmh: number
  speedMaxKmh: number
}

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  skate: 'Skate',
  run: 'Course',
  bike: 'Vélo',
  car: 'Voiture',
  walk: 'Marche',
  other: 'Autre',
}

export const ACTIVITY_COLORS: Record<ActivityKind, string> = {
  skate: '#FF6B4A',
  run: '#4A90E2',
  bike: '#2EC4B6',
  car: '#E63946',
  walk: '#9C89B8',
  other: '#7A6F60',
}
