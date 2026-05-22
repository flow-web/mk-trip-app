// lib/design/spot-image.ts — sélection de la photo affichée pour un spot.
// Priorité : image_url explicite (si présent), sinon fallback déterministe vers
// une des photos hero locales du type de voyage (rotation par hash du spot.id).

import type { Database } from '@/lib/supabase/types'
import type { LocalSpot } from '@/lib/db/schema'
import { HERO_PHOTOS } from './hero-photos'

type TripType = Database['public']['Enums']['trip_type']

const hashCode = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function spotImageFor(spot: LocalSpot, tripType: TripType): string {
  if (spot.image_url) return spot.image_url
  const photos = HERO_PHOTOS[tripType] ?? HERO_PHOTOS.other
  return photos[hashCode(spot.id) % photos.length]
}
