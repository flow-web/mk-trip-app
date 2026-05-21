// lib/db/hydrate.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'

export async function hydrateAllTrips() {
  const { data: profiles } = await supabase.from('profiles').select('*')
  if (profiles) await db.profiles.bulkPut(profiles as any)

  const { data: trips } = await supabase.from('trips').select('*')
  if (trips) await db.trips.bulkPut(trips as any)

  const { data: members } = await supabase.from('trip_members').select('*')
  if (members) await db.trip_members.bulkPut(members as any)
}

export async function hydrateTrip(tripId: string) {
  // Tables indexed directly by trip_id
  const tripIdTables = ['days', 'spots', 'expenses', 'checklist_items', 'guide_cards'] as const
  for (const table of tripIdTables) {
    const { data } = await supabase.from(table).select('*').eq('trip_id', tripId)
    if (data) await (db as any)[table].bulkPut(data)
  }

  // activities — joined via days
  const { data: tripDays } = await supabase.from('days').select('id').eq('trip_id', tripId)
  const dayIds = (tripDays as any[] ?? []).map((d: any) => d.id)
  if (dayIds.length) {
    const { data: activities } = await supabase.from('activities').select('*').in('day_id', dayIds)
    if (activities) await db.activities.bulkPut(activities as any)

    const activityIds = (activities as any[] ?? []).map((a: any) => a.id)
    if (activityIds.length) {
      const { data: comps } = await supabase
        .from('activity_completions').select('*').in('activity_id', activityIds)
      if (comps) await db.activity_completions.bulkPut(comps as any)
    }
  }

  // expense_splits — joined via expenses
  const { data: tripExpenses } = await supabase.from('expenses').select('id').eq('trip_id', tripId)
  const expenseIds = (tripExpenses as any[] ?? []).map((e: any) => e.id)
  if (expenseIds.length) {
    const { data: splits } = await supabase
      .from('expense_splits').select('*').in('expense_id', expenseIds)
    if (splits) await db.expense_splits.bulkPut(splits as any)
  }

  // checklist_completions — joined via checklist_items
  const { data: tripItems } = await supabase.from('checklist_items').select('id').eq('trip_id', tripId)
  const itemIds = (tripItems as any[] ?? []).map((i: any) => i.id)
  if (itemIds.length) {
    const { data: comps } = await supabase
      .from('checklist_completions').select('*').in('item_id', itemIds)
    if (comps) await db.checklist_completions.bulkPut(comps as any)
  }
}
