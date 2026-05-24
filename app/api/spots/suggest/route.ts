import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { rawSuggestionsArraySchema, type RawSuggestion, type AISuggestion } from '@/lib/ai/suggestSpotsSchema'
import { buildPrompt } from '@/lib/ai/suggestSpotsPrompt'
import { mapboxGeocode } from '@/lib/ai/mapboxGeocode'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'

const requestSchema = z.object({
  tripId: z.string().uuid(),
  destination: z.string().min(1).max(120),
  tripType: z.enum(['city_break', 'road_trip', 'sport', 'hike', 'beach', 'other']),
  dayId: z.string().uuid().optional(),
  promptHint: z.string().max(200).optional(),
  excludeNames: z.array(z.string()).optional().default(() => []),
})

const COUNT_PER_BATCH = 8
const MODEL_ID = 'anthropic/claude-haiku-4-5'

export async function POST(req: Request): Promise<NextResponse> {
  // Parse + validate body
  let parsed: z.infer<typeof requestSchema>
  try {
    const json = await req.json()
    parsed = requestSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Global safety net: stop runaway burst across all callers
  if (!checkGlobalRateLimit(100)) {
    return NextResponse.json({ error: 'rate_limited_global' }, { status: 429 })
  }

  // Rate limit per tripId (proxy for user; full user identity would need auth)
  const rlKey = `trip:${parsed.tripId}`
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // Geocode destination once → used as fallback when a specific spot isn't found by Mapbox
  const destCenter = await mapboxGeocode(parsed.destination)
  const fallbackLat = destCenter?.lat ?? 0
  const fallbackLng = destCenter?.lng ?? 0

  // Build prompt
  const prompt = buildPrompt({
    destination: parsed.destination,
    tripType: parsed.tripType,
    count: COUNT_PER_BATCH,
    excludeNames: parsed.excludeNames,
    dayContext: parsed.dayId ? `Jour ID ${parsed.dayId}` : undefined,
    promptHint: parsed.promptHint,
  })

  // Call AI
  let raw: RawSuggestion[]
  try {
    const result = await generateObject({
      model: MODEL_ID,
      schema: rawSuggestionsArraySchema,
      prompt,
    })
    raw = result.object
  } catch (err) {
    console.error('AI call failed', err)
    return NextResponse.json({ error: 'ai_failed' }, { status: 500 })
  }

  // Ground each suggestion with Mapbox in parallel
  const grounded: AISuggestion[] = await Promise.all(
    raw.map(async (r): Promise<AISuggestion> => {
      const geo = await mapboxGeocode(`${r.name}, ${r.address}`)
      return {
        id: crypto.randomUUID(),
        ...r,
        lat: geo?.lat ?? fallbackLat,
        lng: geo?.lng ?? fallbackLng,
        mapbox_verified: geo !== null,
      }
    }),
  )

  return NextResponse.json({ suggestions: grounded }, { status: 200 })
}
