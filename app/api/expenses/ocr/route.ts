import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkGlobalRateLimit } from '@/lib/ai/rateLimit'
import { expenseOcrSchema } from '@/lib/ai/expenseOcrSchema'

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
  if (!checkRateLimit(`ocr:${user.id}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('image')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_image' }, { status: 400 })
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
      schema: expenseOcrSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the total amount, category, and a short description from this receipt/ticket photo.
Amount must be in cents (e.g. €12.50 = 1250).
Category must be one of: food, transport, hotel, activity, drink, shopping, other.
Note should be the merchant name or a short description of the purchase.
If you cannot read the receipt clearly, set confidence below 0.5.`,
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
    console.error('OCR error:', e)
    return NextResponse.json({ error: 'ocr_failed' }, { status: 500 })
  }
}
