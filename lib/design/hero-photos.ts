// lib/design/hero-photos.ts — chemins vers les 18 photos hero hébergées en local
// dans public/heroes/<type>/{1,2,3}.jpg. Sources curées du handoff Claude Design
// (cf. docs/design/claude-design-handoff/project/shared.jsx, objet PHOTO).

import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const heroes = (type: TripType): [string, string, string] => [
  `/heroes/${type}/1.jpg`,
  `/heroes/${type}/2.jpg`,
  `/heroes/${type}/3.jpg`,
]

export const HERO_PHOTOS: Record<TripType, [string, string, string]> = {
  sport: heroes('sport'),
  hike: heroes('hike'),
  beach: heroes('beach'),
  city_break: heroes('city_break'),
  road_trip: heroes('road_trip'),
  other: heroes('other'),
}
