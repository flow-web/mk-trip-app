// lib/demo/seed.ts — hydrate Dexie avec les voyages démo (Lina + Tom).
//
// Idempotent : bulkPut écrase les rows par PK, donc plusieurs appels ne créent
// pas de doublons. Aucun appel Supabase.

import { db } from '@/lib/db'
import {
  demoProfiles,
  demoTrips,
  demoTripMembers,
  demoDays,
  demoActivities,
  demoActivityCompletions,
  demoSpots,
  demoExpenses,
  demoExpenseSplits,
  demoChecklistItems,
  demoChecklistCompletions,
  demoGuideCards,
  DEMO_TRIP_IDS,
} from './fixtures'

export async function seedDemoData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.trips,
      db.trip_members,
      db.days,
      db.activities,
      db.activity_completions,
      db.spots,
      db.expenses,
      db.expense_splits,
      db.checklist_items,
      db.checklist_completions,
      db.guide_cards,
    ],
    async () => {
      await db.profiles.bulkPut(demoProfiles as any)
      await db.trips.bulkPut(demoTrips as any)
      await db.trip_members.bulkPut(demoTripMembers as any)
      await db.days.bulkPut(demoDays as any)
      await db.activities.bulkPut(demoActivities as any)
      await db.activity_completions.bulkPut(demoActivityCompletions as any)
      await db.spots.bulkPut(demoSpots as any)
      await db.expenses.bulkPut(demoExpenses as any)
      await db.expense_splits.bulkPut(demoExpenseSplits as any)
      await db.checklist_items.bulkPut(demoChecklistItems as any)
      await db.checklist_completions.bulkPut(demoChecklistCompletions as any)
      await db.guide_cards.bulkPut(demoGuideCards as any)
    },
  )
}

export async function clearDemoData(): Promise<void> {
  for (const tripId of DEMO_TRIP_IDS) {
    const days = await db.days.where({ trip_id: tripId }).toArray()
    const dayIds = days.map((d) => d.id)
    const activities = dayIds.length
      ? await db.activities.where('day_id').anyOf(dayIds).toArray()
      : []
    const activityIds = activities.map((a) => a.id)
    const expenses = await db.expenses.where({ trip_id: tripId }).toArray()
    const expenseIds = expenses.map((e) => e.id)
    const items = await db.checklist_items.where({ trip_id: tripId }).toArray()
    const itemIds = items.map((i) => i.id)

    if (activityIds.length) {
      await db.activity_completions.where('activity_id').anyOf(activityIds).delete()
    }
    if (expenseIds.length) {
      await db.expense_splits.where('expense_id').anyOf(expenseIds).delete()
    }
    if (itemIds.length) {
      await db.checklist_completions.where('item_id').anyOf(itemIds).delete()
    }
    await db.activities.where('day_id').anyOf(dayIds).delete()
    await db.days.where({ trip_id: tripId }).delete()
    await db.spots.where({ trip_id: tripId }).delete()
    await db.expenses.where({ trip_id: tripId }).delete()
    await db.checklist_items.where({ trip_id: tripId }).delete()
    await db.guide_cards.where({ trip_id: tripId }).delete()
    await db.trip_members.where({ trip_id: tripId }).delete()
    await db.trips.delete(tripId)
  }
}
