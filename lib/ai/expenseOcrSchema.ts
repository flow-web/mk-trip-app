import { z } from 'zod'

export const expenseOcrSchema = z.object({
  amount: z
    .number()
    .int()
    .min(1)
    .describe('Total amount in cents (e.g. 1250 for €12.50)'),
  category: z
    .enum(['food', 'transport', 'hotel', 'activity', 'drink', 'shopping', 'other'])
    .describe('Best-matching expense category'),
  note: z
    .string()
    .max(120)
    .describe('Short description: merchant name or main items'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('How confident 0-1 that the extraction is correct'),
})

export type ExpenseOcrResult = z.infer<typeof expenseOcrSchema>
