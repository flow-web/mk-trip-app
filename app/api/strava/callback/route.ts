import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCode } from '@/lib/strava/client'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/trips?strava=denied', url.origin))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/welcome', url.origin))
  }

  try {
    const tokens = await exchangeCode(code)

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await admin.from('strava_tokens').upsert({
      user_id: user.id,
      athlete_id: tokens.athlete.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      scope: 'activity:read_all,profile:read_all',
    })

    return NextResponse.redirect(new URL('/trips?strava=connected', url.origin))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/trips?strava=error', url.origin))
  }
}
