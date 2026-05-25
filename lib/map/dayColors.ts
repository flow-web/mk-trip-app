// Palette fixe de 8 couleurs distinctes pour identifier les jours sur la carte.
// Indépendante de l'accent voyage : cohérence cross-voyages.
// Choisies pour être bien distinctes en clair ET en sombre, et lisibles
// par-dessus un fond Mapbox light/dark.
export const DAY_PALETTE = [
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
] as const

export function getDayColor(dayIndex: number): string {
  if (!Number.isFinite(dayIndex) || dayIndex < 0) return DAY_PALETTE[0]
  return DAY_PALETTE[Math.floor(dayIndex) % DAY_PALETTE.length]
}
