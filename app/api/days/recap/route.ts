import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'
import { dayRecapSchema } from '@/lib/ai/dayRecapSchema'

const requestSchema = z.object({
  destination: z.string().min(1).max(120),
  dayNumber: z.number().int().min(1),
  date: z.string().optional(),
  activities: z.array(z.object({
    title: z.string(),
    subtitle: z.string().nullable(),
    time: z.string().nullable(),
    done: z.boolean(),
  })),
  expenses: z.array(z.object({
    note: z.string().nullable(),
    category: z.string(),
    amount: z.number(),
  })),
  spotsVisited: z.array(z.string()),
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
  if (!checkRateLimit(`recap:${user.id}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let parsed: z.infer<typeof requestSchema>
  try {
    parsed = requestSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const activitiesList = parsed.activities
    .map((a) => `- ${a.time ?? '?'} ${a.title}${a.subtitle ? ` (${a.subtitle})` : ''}${a.done ? ' ✓' : ''}`)
    .join('\n')

  const expensesList = parsed.expenses
    .map((e) => `- ${e.note ?? e.category} : ${(e.amount / 100).toFixed(2)}€`)
    .join('\n')

  const prompt = `Tu es le carnet de bord d'un voyage à ${parsed.destination}. Rédige un court récap fun et personnel du Jour ${parsed.dayNumber}${parsed.date ? ` (${parsed.date})` : ''}.

Activités du jour :
${activitiesList || 'Aucune activité enregistrée'}

Dépenses du jour :
${expensesList || 'Aucune dépense'}

Spots visités : ${parsed.spotsVisited.length > 0 ? parsed.spotsVisited.join(', ') : 'aucun'}

Le récap doit être en français, 2-3 phrases max, ton décontracté comme un journal intime de voyage. Pas de bullet points.`

  try {
    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: dayRecapSchema,
      prompt,
    })
    return NextResponse.json(object)
  } catch (e) {
    console.error('Day recap error:', e)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
