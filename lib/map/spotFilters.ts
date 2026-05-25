export interface MapSpot {
  id: string
  name: string
  lat: number
  lng: number
  category: string
  day_id: string | null
  time: string | null // 'HH:MM' or 'HH:MM:SS'
}

export interface DayLine {
  day_id: string
  coordinates: Array<[number, number]> // [lng, lat] pairs, GeoJSON convention
}

export type SelectedDayId = 'all' | string

export function filterVisibleSpots(
  spots: MapSpot[],
  selectedDayId: SelectedDayId,
): MapSpot[] {
  if (selectedDayId === 'all') return spots
  return spots.filter((s) => s.day_id === selectedDayId)
}

function compareTime(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1  // null last
  if (b === null) return -1
  return a.localeCompare(b)
}

export function computeDayLines(
  spots: MapSpot[],
  selectedDayId: SelectedDayId,
): DayLine[] {
  if (selectedDayId === 'all') return []
  const daySpots = spots
    .filter((s) => s.day_id === selectedDayId)
    .sort((a, b) => compareTime(a.time, b.time))
  if (daySpots.length < 2) return []
  return [
    {
      day_id: selectedDayId,
      coordinates: daySpots.map((s) => [s.lng, s.lat]),
    },
  ]
}
