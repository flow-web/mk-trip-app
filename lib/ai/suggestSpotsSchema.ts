import { z } from 'zod'

export const SPOT_CATEGORIES = [
  'food', 'culture', 'nightlife', 'nature', 'accommodation', 'activity', 'sport',
] as const

export const rawSuggestionSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(SPOT_CATEGORIES),
  description: z.string().min(1).max(300),
  address: z.string().min(1).max(200),
})

export type RawSuggestion = z.infer<typeof rawSuggestionSchema>

export const rawSuggestionsArraySchema = z
  .array(rawSuggestionSchema)
  .min(1, 'Expected at least 1 suggestion')
  .max(12, 'Expected at most 12 suggestions')

// Final type returned by the API route (after Mapbox grounding)
export interface AISuggestion extends RawSuggestion {
  id: string                 // UUID temp côté serveur (non persisté tant que pas accepté)
  lat: number
  lng: number
  mapbox_verified: boolean
}
