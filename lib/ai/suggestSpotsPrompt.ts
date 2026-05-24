export interface BuildPromptInput {
  destination: string
  tripType: string
  count: number
  excludeNames: string[]
  dayContext?: string
  promptHint?: string
}

export function buildPrompt(input: BuildPromptInput): string {
  const { destination, tripType, count, excludeNames, dayContext, promptHint } = input

  const hint = promptHint ? promptHint.slice(0, 200) : undefined

  const exclusion = excludeNames.length > 0
    ? `\nEXCLUSIONS — N'incluez aucun de ces lieux déjà connus :\n${excludeNames.map((n) => `- ${n}`).join('\n')}\n`
    : ''

  const dayLine = dayContext ? `\nContexte du jour : ${dayContext}` : ''
  const hintLine = hint ? `\nDirective utilisateur : ${hint}` : ''

  return `Tu es un guide local expert pour la destination "${destination}" (type de voyage : ${tripType}).${dayLine}${hintLine}

Propose ${count} spots/lieux à visiter. Varie les catégories pour offrir un panel équilibré (au moins 3 catégories différentes si possible).

Catégories autorisées (utilise EXACTEMENT ces valeurs) :
food, culture, nightlife, nature, accommodation, activity, sport

Pour chaque spot, renseigne :
- name : nom officiel et reconnaissable du lieu (string, ≤ 120 chars)
- category : l'une des 7 catégories ci-dessus
- description : 1-2 phrases qui expliquent pourquoi c'est intéressant (français, ≤ 300 chars)
- address : adresse postale ou repère géographique permettant un géocodage (≤ 200 chars)
${exclusion}
Priorité : lieux réels et notables. Évite les inventions.`
}
