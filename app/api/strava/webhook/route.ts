import { NextResponse } from 'next/server'
import { syncActivity, deleteActivity, getUserIdByAthleteId } from '@/lib/strava/sync'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const challenge = url.searchParams.get('hub.challenge')
  const token = url.searchParams.get('hub.verify_token')

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return new Response('Forbidden', { status: 403 })
}

interface WebhookEvent {
  object_type: 'activity' | 'athlete'
  object_id: number
  aspect_type: 'create' | 'update' | 'delete'
  owner_id: number
  subscription_id: number
  event_time: number
}

export async function POST(req: Request) {
  const body: WebhookEvent = await req.json()

  if (body.object_type !== 'activity') {
    return new Response('OK', { status: 200 })
  }

  const userId = await getUserIdByAthleteId(body.owner_id)
  if (!userId) {
    return new Response('OK', { status: 200 })
  }

  try {
    if (body.aspect_type === 'create' || body.aspect_type === 'update') {
      await syncActivity(userId, body.object_id)
    } else if (body.aspect_type === 'delete') {
      await deleteActivity(body.object_id)
    }
  } catch (err) {
    console.error('Strava webhook processing error:', err)
  }

  return new Response('OK', { status: 200 })
}
