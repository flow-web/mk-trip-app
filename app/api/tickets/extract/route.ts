import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'
import { ticketExtractSchema } from '@/lib/ai/ticketExtractSchema'

const MODEL_ID = 'anthropic/claude-haiku-4-5'
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!checkGlobalRateLimit(100)) {
    return NextResponse.json({ error: 'rate_limited_global' }, { status: 429 })
  }
  if (!checkRateLimit(`ticket:${user.id}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type || 'image/jpeg'

  try {
    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: ticketExtractSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract booking details from this ticket/confirmation document.
Type must be: flight, train, hotel, car_rental, or other.
Date must be in YYYY-MM-DD format.
Time must be in HH:MM format (24h) or null if not visible.
end_date is for hotels (checkout date) — null for transport.
carrier is the airline/train company name.
reference is the booking code / PNR.
passengers is the number of travelers.`,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    })
    return NextResponse.json(object)
  } catch (e) {
    console.error('Ticket extract error:', e)
    return NextResponse.json({ error: 'extraction_failed' }, { status: 500 })
  }
}
