interface PromptParams {
  destination: string
  tripType: string
  durationDays: number
  season: string
  excludeLabels: string[]
}

export function buildChecklistPrompt(p: PromptParams): string {
  const typeLabel: Record<string, string> = {
    city_break: 'city break urbain',
    road_trip: 'road trip en voiture',
    sport: 'voyage sportif',
    hike: 'randonnée / trek',
    beach: 'vacances balnéaires',
    other: 'voyage',
  }

  const seasonLabel: Record<string, string> = {
    spring: 'printemps',
    summer: 'été',
    autumn: 'automne',
    winter: 'hiver',
  }

  const exclude = p.excludeLabels.length > 0
    ? `\n\nItems déjà dans la checklist (NE PAS suggérer) :\n${p.excludeLabels.map((l) => `- ${l}`).join('\n')}`
    : ''

  return `Tu es un assistant voyage expert. Génère une checklist de préparation pour ce voyage :

- Destination : ${p.destination}
- Type : ${typeLabel[p.tripType] ?? p.tripType}
- Durée : ${p.durationDays} jours
- Saison : ${seasonLabel[p.season] ?? p.season}

Règles :
- 12 items pratiques et spécifiques (pas de générique comme "vêtements")
- Répartis entre les catégories : clothing (vêtements), gear (équipement), docs (documents/admin), other (divers)
- Adapte au type de voyage (hike → bâtons/chaussures rando, sport → équipement spécifique, beach → maillot/crème solaire)
- Adapte à la saison et à la destination
- Labels courts et actionnables en français${exclude}`
}
