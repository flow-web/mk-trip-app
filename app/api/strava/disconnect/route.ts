import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revokeToken } from '@/lib/strava/client'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: row } = await admin
    .from('strava_tokens')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (row) {
    await revokeToken(row.access_token).catch(() => {})
    await admin.from('strava_activities').delete().eq('user_id', user.id)
    await admin.from('strava_tokens').delete().eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
