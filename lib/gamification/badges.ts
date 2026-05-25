export interface Badge {
  id: string
  emoji: string
  name: string
  description: string
  check: (stats: TravelerStats) => boolean
}

export interface TravelerStats {
  totalTrips: number
  totalDays: number
  totalSpots: number
  totalExpensesCents: number
  totalActivities: number
  totalCheckins: number
  totalPolls: number
  totalMessages: number
  tripTypes: Set<string>
}

export const BADGES: Badge[] = [
  { id: 'first-trip', emoji: '🎒', name: 'Premier voyage', description: 'Créer ton premier voyage', check: (s) => s.totalTrips >= 1 },
  { id: 'globetrotter', emoji: '🌍', name: 'Globetrotter', description: '5 voyages au compteur', check: (s) => s.totalTrips >= 5 },
  { id: 'explorer', emoji: '🧭', name: 'Explorateur', description: '10 spots visités', check: (s) => s.totalCheckins >= 10 },
  { id: 'cartographer', emoji: '🗺️', name: 'Cartographe', description: '50 spots ajoutés', check: (s) => s.totalSpots >= 50 },
  { id: 'week-warrior', emoji: '📅', name: 'Semainier', description: '7 jours de voyage cumulés', check: (s) => s.totalDays >= 7 },
  { id: 'month-nomad', emoji: '🏕️', name: 'Nomade', description: '30 jours de voyage cumulés', check: (s) => s.totalDays >= 30 },
  { id: 'big-spender', emoji: '💸', name: 'Flambeur', description: '1000€ de dépenses au total', check: (s) => s.totalExpensesCents >= 100000 },
  { id: 'planner', emoji: '📋', name: 'Organisateur', description: '20 activités planifiées', check: (s) => s.totalActivities >= 20 },
  { id: 'social', emoji: '💬', name: 'Bavard', description: '50 messages envoyés', check: (s) => s.totalMessages >= 50 },
  { id: 'democracy', emoji: '🗳️', name: 'Démocrate', description: 'Créer 5 sondages', check: (s) => s.totalPolls >= 5 },
  { id: 'versatile', emoji: '🎯', name: 'Polyvalent', description: '3 types de voyages différents', check: (s) => s.tripTypes.size >= 3 },
  { id: 'centurion', emoji: '💯', name: 'Centurion', description: '100 activités complétées', check: (s) => s.totalActivities >= 100 },
]

export function computeUnlockedBadges(stats: TravelerStats): Badge[] {
  return BADGES.filter((b) => b.check(stats))
}
