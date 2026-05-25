'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { pointsToLineString } from './geo'
import type { TracePoint, ActivityKind } from './types'

function toWkt(points: TracePoint[]): string {
  const ls = pointsToLineString(points)
  const coords = ls.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
  return `SRID=4326;LINESTRING(${coords})`
}

export interface CreateSegmentInput {
  name: string
  description?: string
  activity: ActivityKind
  coverColor?: string
  points: TracePoint[]
  durationMs: number
  startedAt: string
}

export interface SubmitRunInput {
  segmentId: string
  points: TracePoint[]
  durationMs: number
  startedAt: string
}

export async function createSegmentFromRun(input: CreateSegmentInput) {
  const supabase = await createClient()
  const wkt = toWkt(input.points)
  const { data, error } = await (supabase as any).rpc('create_segment_from_run', {
    p_name: input.name,
    p_description: input.description ?? null,
    p_activity: input.activity,
    p_trace: wkt,
    p_duration_ms: input.durationMs,
    p_started_at: input.startedAt,
    p_cover_color: input.coverColor ?? '#FF6B4A',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/segments')
  return data as { id: string }
}

export async function submitRun(input: SubmitRunInput) {
  const supabase = await createClient()
  const wkt = toWkt(input.points)
  const { data, error } = await (supabase as any).rpc('submit_run', {
    p_segment_id: input.segmentId,
    p_trace: wkt,
    p_duration_ms: input.durationMs,
    p_started_at: input.startedAt,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/segments/${input.segmentId}`)
  return data as { id: string; is_valid: boolean; invalid_reason: string | null }
}
