// lib/design/hero-photos.ts — URLs Unsplash curées du handoff Claude Design.
// Source : docs/design/claude-design-handoff/project/shared.jsx (objet PHOTO).
// En attendant les photos hostées (Phase 5 / bucket trip-covers).

import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const U = 'https://images.unsplash.com'

const PHOTO = {
  skate_hero: `${U}/photo-1531565637446-32307b194362?w=1200&q=80`,
  skate_bowl: `${U}/photo-1583407723467-9b2d22504831?w=1200&q=80`,
  skate_spot2: `${U}/photo-1564982752979-3f7693f76b4a?w=1200&q=80`,
  skate_road: `${U}/photo-1530541930197-ff16ac917b0e?w=1200&q=80`,

  rando_hero: `${U}/photo-1464822759023-fed622ff2c3b?w=1200&q=80`,
  rando_summit: `${U}/photo-1551632811-561732d1e306?w=1200&q=80`,
  rando_lake: `${U}/photo-1486870591958-9b9d0d1dda99?w=1200&q=80`,
  rando_trail: `${U}/photo-1519681393784-d120267933ba?w=1200&q=80`,
  rando_tent: `${U}/photo-1504280390367-361c6d9f38f4?w=1200&q=80`,

  surf_hero: `${U}/photo-1502680390469-be75c86b636f?w=1200&q=80`,
  surf_board: `${U}/photo-1455729552865-3658a5d39692?w=1200&q=80`,

  city_hero: `${U}/photo-1555881400-74d7acaacd8b?w=1200&q=80`,
  city_tram: `${U}/photo-1513735492246-483525079686?w=1200&q=80`,
  city_food: `${U}/photo-1559925393-8be0ec4767c8?w=1200&q=80`,
} as const

export const HERO_PHOTOS: Record<TripType, [string, string, string]> = {
  sport: [PHOTO.skate_hero, PHOTO.skate_bowl, PHOTO.skate_spot2],
  hike: [PHOTO.rando_hero, PHOTO.rando_summit, PHOTO.rando_lake],
  beach: [PHOTO.surf_hero, PHOTO.surf_board, PHOTO.surf_hero],
  city_break: [PHOTO.city_hero, PHOTO.city_tram, PHOTO.city_food],
  road_trip: [PHOTO.skate_road, PHOTO.surf_hero, PHOTO.rando_trail],
  other: [PHOTO.rando_trail, PHOTO.city_hero, PHOTO.rando_tent],
}
