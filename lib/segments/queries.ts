import { createClient } from '@/lib/supabase/server'
import type { ActivityKind } from './types'

export interface SegmentWithStats {
  id: string
  creator_id: string | null
  name: string
  description: string | null
  activity: ActivityKind
  distance_m: number
  cover_color: string
  created_at: string
  run_count: number
  best_duration_ms: number | null
}

export async function listSegmentsInBounds(opts: {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
  activity?: ActivityKind
  limit?: number
}): Promise<SegmentWithStats[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('segments')
    .select('*, runs(count)')
    .limit(opts.limit ?? 500)
  if (opts.activity) q = q.eq('activity', opts.activity)
  const { data, error } = await q
  if (error) throw error
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    creator_id: row.creator_id,
    name: row.name,
    description: row.description,
    activity: row.activity,
    distance_m: row.distance_m,
    cover_color: row.cover_color,
    created_at: row.created_at,
    run_count: row.runs?.[0]?.count ?? 0,
    best_duration_ms: null,
  }))
}

export interface SegmentDetail {
  id: string
  creator_id: string | null
  name: string
  description: string | null
  activity: ActivityKind
  distance_m: number
  cover_color: string
  created_at: string
}

export async function getSegment(id: string): Promise<SegmentDetail | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('segments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as SegmentDetail | null
}

export interface LeaderboardEntry {
  run_id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  duration_ms: number
  speed_avg_kmh: number | null
  speed_max_kmh: number | null
  created_at: string
}

export async function listLeaderboard(
  segmentId: string,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('runs')
    .select(
      'id, user_id, duration_ms, speed_avg_kmh, speed_max_kmh, created_at, profiles(display_name, avatar_url)',
    )
    .eq('segment_id', segmentId)
    .eq('is_valid', true)
    .order('duration_ms', { ascending: true })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as any[]).map((r) => ({
    run_id: r.id,
    user_id: r.user_id,
    display_name: r.profiles?.display_name ?? '—',
    avatar_url: r.profiles?.avatar_url ?? null,
    duration_ms: r.duration_ms,
    speed_avg_kmh: r.speed_avg_kmh,
    speed_max_kmh: r.speed_max_kmh,
    created_at: r.created_at,
  }))
}
