import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'
import { checklistSuggestionsSchema } from '@/lib/ai/suggestChecklistSchema'
import { buildChecklistPrompt } from '@/lib/ai/suggestChecklistPrompt'

const requestSchema = z.object({
  tripId: z.string().uuid(),
  destination: z.string().min(1).max(120),
  tripType: z.enum(['city_break', 'road_trip', 'sport', 'hike', 'beach', 'other']),
  durationDays: z.number().int().min(1).max(365),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  excludeLabels: z.array(z.string()).optional().default(() => []),
})

const MODEL_ID = 'anthropic/claude-haiku-4-5'

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!checkGlobalRateLimit(100)) {
    return NextResponse.json({ error: 'rate_limited_global' }, { status: 429 })
  }
  if (!checkRateLimit(`checklist:${user.id}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let parsed: z.infer<typeof requestSchema>
  try {
    const json = await req.json()
    parsed = requestSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  try {
    const prompt = buildChecklistPrompt({
      destination: parsed.destination,
      tripType: parsed.tripType,
      durationDays: parsed.durationDays,
      season: parsed.season,
      excludeLabels: parsed.excludeLabels,
    })

    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: checklistSuggestionsSchema,
      prompt,
    })

    return NextResponse.json(object)
  } catch (e) {
    console.error('Checklist suggest error:', e)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
