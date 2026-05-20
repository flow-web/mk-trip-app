// lib/design/accent.ts
import { MK, type AccentTokens } from './tokens'

// TODO: once lib/supabase/types.ts is generated (Task 7), replace this with:
//   import type { Database } from '@/lib/supabase/types'
//   type TripType = Database['public']['Enums']['trip_type']
export type TripType = 'sport' | 'hike' | 'beach' | 'city_break' | 'road_trip' | 'other'

export const ACCENT_BY_TYPE: Record<TripType, AccentTokens> = {
  sport: MK.skate,
  hike: MK.rando,
  beach: MK.surf,
  city_break: MK.city,
  road_trip: MK.road,
  other: MK.neutral,
}

export const accentFor = (t: TripType | null | undefined): AccentTokens =>
  (t && ACCENT_BY_TYPE[t]) ?? MK.neutral
