import { z } from 'zod'

export const checklistItemSchema = z.object({
  label: z.string().min(1).max(120).describe('Short actionable item label'),
  category: z
    .enum(['clothing', 'gear', 'docs', 'other'])
    .describe('Checklist category'),
})

export const checklistSuggestionsSchema = z.object({
  items: z.array(checklistItemSchema).min(1).max(20),
})

export type ChecklistSuggestion = z.infer<typeof checklistItemSchema>
