import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  type: TripType
  size?: number
  color?: string
}

const SYMBOL: Record<TripType, string> = {
  sport: '🛹',
  hike: '⛰',
  beach: '🌊',
  city_break: '🏛',
  road_trip: '🚐',
  other: '◆',
}

export function TripIcon({ type, size = 20, color }: Props) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.8, color }}
      aria-hidden
    >
      {SYMBOL[type] ?? SYMBOL.other}
    </span>
  )
}
