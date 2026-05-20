// lib/design/hero.ts
import type { TripType } from './accent'

const hashCode = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function defaultHeroFor(tripId: string, type: TripType): string {
  const idx = (hashCode(tripId) % 3) + 1
  return `/heroes/${type}/${idx}.jpg`
}
