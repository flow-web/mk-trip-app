const STRAVA_BASE = 'https://www.strava.com/api/v3'

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: { id: number }
}

export interface StravaActivity {
  id: number
  name: string
  sport_type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  start_date: string
  start_latlng: [number, number] | null
  end_latlng: [number, number] | null
  average_speed: number
  max_speed: number
  map: { polyline: string | null; summary_polyline: string | null }
}

export interface StravaStream {
  type: string
  data: unknown[]
  series_type: string
  original_size: number
  resolution: string
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    response_type: 'code',
    scope: 'activity:read_all,profile:read_all',
    approval_prompt: 'auto',
    state,
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeCode(code: string): Promise<StravaTokens> {
  const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`)
  return res.json()
}

export async function refreshTokens(refreshToken: string): Promise<StravaTokens> {
  const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`)
  return res.json()
}

export async function revokeToken(accessToken: string): Promise<void> {
  await fetch('https://www.strava.com/oauth/deauthorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `access_token=${accessToken}`,
  })
}

export async function fetchActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava activity fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchActivityStreams(
  accessToken: string,
  activityId: number,
  keys = 'latlng,altitude,velocity_smooth,time',
): Promise<StravaStream[]> {
  const res = await fetch(
    `${STRAVA_BASE}/activities/${activityId}/streams?keys=${keys}&key_type=stream`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error(`Strava streams fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchAthleteActivities(
  accessToken: string,
  after?: number,
  before?: number,
  page = 1,
  perPage = 30,
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (after) params.set('after', String(after))
  if (before) params.set('before', String(before))
  const res = await fetch(`${STRAVA_BASE}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava activities list failed: ${res.status}`)
  return res.json()
}
