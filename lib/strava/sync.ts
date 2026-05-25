import { createClient as createAdminClient } from '@supabase/supabase-js'
import { refreshTokens, fetchActivity, fetchActivityStreams } from './client'
import type { StravaActivity, StravaStream } from './client'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function getValidToken(userId: string): Promise<string> {
  const admin = getAdmin()
  const { data: row, error } = await admin
    .from('strava_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (error || !row) throw new Error('No Strava token found')

  const now = Math.floor(Date.now() / 1000)
  if (row.expires_at > now + 300) return row.access_token

  const fresh = await refreshTokens(row.refresh_token)
  await admin
    .from('strava_tokens')
    .update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token,
      expires_at: fresh.expires_at,
    })
    .eq('user_id', userId)

  return fresh.access_token
}

export async function getUserIdByAthleteId(athleteId: number): Promise<string | null> {
  const admin = getAdmin()
  const { data } = await admin
    .from('strava_tokens')
    .select('user_id')
    .eq('athlete_id', athleteId)
    .single()
  return data?.user_id ?? null
}

function polylineToWkt(encoded: string): string | null {
  const coords = decodePolyline(encoded)
  if (coords.length < 2) return null
  const wkt = coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
  return `SRID=4326;LINESTRING(${wkt})`
}

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let idx = 0, lat = 0, lng = 0
  while (idx < encoded.length) {
    let shift = 0, result = 0, byte: number
    do {
      byte = encoded.charCodeAt(idx++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(idx++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push([lng / 1e5, lat / 1e5])
  }
  return coords
}

function streamsToJson(streams: StravaStream[]): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {}
  for (const s of streams) {
    out[s.type] = s.data
  }
  return out
}

export async function syncActivity(userId: string, activityId: number): Promise<void> {
  const token = await getValidToken(userId)
  const [activity, streams] = await Promise.all([
    fetchActivity(token, activityId),
    fetchActivityStreams(token, activityId).catch(() => [] as StravaStream[]),
  ])

  const admin = getAdmin()

  const { data: tripId } = await admin.rpc('strava_auto_link_trip', {
    p_user_id: userId,
    p_start_date: activity.start_date,
  })

  const polyline = activity.map?.polyline || activity.map?.summary_polyline
  const trace = polyline ? polylineToWkt(polyline) : null

  await admin.from('strava_activities').upsert({
    id: activity.id,
    user_id: userId,
    trip_id: tripId || null,
    name: activity.name,
    sport_type: activity.sport_type,
    distance: activity.distance,
    moving_time: activity.moving_time,
    elapsed_time: activity.elapsed_time,
    total_elevation: activity.total_elevation_gain,
    start_date: activity.start_date,
    start_latlng: activity.start_latlng,
    end_latlng: activity.end_latlng,
    average_speed: activity.average_speed,
    max_speed: activity.max_speed,
    polyline,
    trace,
    streams_json: streams.length > 0 ? streamsToJson(streams) : null,
  })
}

export async function deleteActivity(activityId: number): Promise<void> {
  const admin = getAdmin()
  await admin.from('strava_activities').delete().eq('id', activityId)
}
