// lib/db/realtime.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Tables sync'd via Realtime, scoped to a trip.
// For child tables (activities, completions, splits) we don't filter at channel level
// (Supabase Realtime filter syntax is limited). Instead, we accept all events and
// filter client-side by checking trip membership in Dexie.
const TABLES = [
  'trips', 'trip_members', 'days', 'activities', 'activity_completions',
  'spots', 'expenses', 'expense_splits', 'checklist_items',
  'checklist_completions', 'guide_cards',
] as const

type TableName = (typeof TABLES)[number]

// Key extractor : for composite-PK tables, the "key" in Dexie is the first component
// (see schema in lib/db/index.ts). For others, it's `id`.
function extractKey(table: TableName, row: any): string | null {
  if (!row) return null
  switch (table) {
    case 'trip_members': return row.trip_id
    case 'activity_completions': return row.activity_id
    case 'expense_splits': return row.expense_id
    case 'checklist_completions': return row.item_id
    default: return row.id
  }
}

export function subscribeTrip(tripId: string): RealtimeChannel {
  const channel = supabase.channel(`trip:${tripId}`)

  for (const table of TABLES) {
    channel.on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table },
      async (rawPayload: any) => {
        const payload = rawPayload as {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new: Record<string, any>
          old: Record<string, any>
        }
        const newRow = payload.new ?? {}
        const oldRow = payload.old ?? {}
        const key = extractKey(table, payload.eventType === 'DELETE' ? oldRow : newRow)
        if (!key) return

        // Skip if local row has a pending mutation (Realtime echo lock)
        const existing = await (db as any)[table].get(key)
        if (existing?._pending_mutation_id) return

        if (payload.eventType === 'DELETE') {
          await (db as any)[table].delete(key)
        } else {
          await (db as any)[table].put(newRow)
        }
      },
    )
  }

  channel.subscribe()
  return channel
}
