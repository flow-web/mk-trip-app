// lib/design/hero.ts — sélection déterministe de la photo par défaut.
// Retourne maintenant une URL Unsplash (cf. hero-photos.ts) ; Phase 5 storage
// remplacera par des assets locaux ou hostés sur Supabase Storage.

import type { Database } from '@/lib/supabase/types'
import { HERO_PHOTOS } from './hero-photos'

type TripType = Database['public']['Enums']['trip_type']

const hashCode = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function defaultHeroFor(tripId: string, type: TripType): string {
  const photos = HERO_PHOTOS[type] ?? HERO_PHOTOS.other
  const idx = hashCode(tripId) % photos.length
  return photos[idx]
}
