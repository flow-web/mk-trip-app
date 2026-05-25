import { z } from 'zod'

export const dayRecapSchema = z.object({
  recap: z
    .string()
    .min(1)
    .max(500)
    .describe('A short, fun, personal recap of the day in French (2-3 sentences)'),
  mood: z
    .enum(['amazing', 'great', 'good', 'meh', 'tough'])
    .describe('Overall mood of the day based on activities'),
  highlight: z
    .string()
    .max(100)
    .describe('One highlight moment of the day'),
})

export type DayRecap = z.infer<typeof dayRecapSchema>
