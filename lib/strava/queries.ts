import type { SupabaseClient } from '@supabase/supabase-js'

export interface StravaActivityRow {
  id: number
  name: string
  sport_type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation: number | null
  start_date: string
  start_latlng: number[] | null
  end_latlng: number[] | null
  average_speed: number | null
  max_speed: number | null
  polyline: string | null
  trip_id: string | null
}

export async function isStravaConnected(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('strava_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count ?? 0) > 0
}

export async function listTripStravaActivities(
  supabase: SupabaseClient,
  tripId: string,
): Promise<StravaActivityRow[]> {
  const { data, error } = await supabase
    .from('strava_activities')
    .select('id, name, sport_type, distance, moving_time, elapsed_time, total_elevation, start_date, start_latlng, end_latlng, average_speed, max_speed, polyline, trip_id')
    .eq('trip_id', tripId)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function listUserStravaActivities(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<StravaActivityRow[]> {
  const { data, error } = await supabase
    .from('strava_activities')
    .select('id, name, sport_type, distance, moving_time, elapsed_time, total_elevation, start_date, start_latlng, end_latlng, average_speed, max_speed, polyline, trip_id')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function linkActivityToTrip(
  supabase: SupabaseClient,
  activityId: number,
  tripId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('strava_activities')
    .update({ trip_id: tripId })
    .eq('id', activityId)
  if (error) throw error
}
