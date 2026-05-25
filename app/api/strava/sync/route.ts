import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/strava/sync'
import { fetchAthleteActivities } from '@/lib/strava/client'
import { syncActivity } from '@/lib/strava/sync'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const after = body.after as number | undefined
  const before = body.before as number | undefined

  try {
    const token = await getValidToken(user.id)
    const activities = await fetchAthleteActivities(token, after, before, 1, 50)

    let synced = 0
    for (const a of activities) {
      try {
        await syncActivity(user.id, a.id)
        synced++
      } catch (err) {
        console.error(`Failed to sync activity ${a.id}:`, err)
      }
    }

    return NextResponse.json({ synced, total: activities.length })
  } catch (err) {
    console.error('Strava sync error:', err)
    return NextResponse.json({ error: 'sync_failed' }, { status: 500 })
  }
}
