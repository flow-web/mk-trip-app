// lib/db/index.ts
import Dexie, { type EntityTable } from 'dexie'
import type {
  LocalProfile, LocalTrip, LocalTripMember, LocalDay, LocalActivity,
  LocalActivityCompletion, LocalSpot, LocalExpense, LocalExpenseSplit,
  LocalChecklistItem, LocalChecklistCompletion, LocalGuideCard, LocalMessage,
  SyncQueueEntry, PendingUpload,
} from './schema'

export class MKTripDB extends Dexie {
  profiles!: EntityTable<LocalProfile, 'id'>
  trips!: EntityTable<LocalTrip, 'id'>
  trip_members!: EntityTable<LocalTripMember, 'trip_id'>
  days!: EntityTable<LocalDay, 'id'>
  activities!: EntityTable<LocalActivity, 'id'>
  activity_completions!: EntityTable<LocalActivityCompletion, 'activity_id'>
  spots!: EntityTable<LocalSpot, 'id'>
  expenses!: EntityTable<LocalExpense, 'id'>
  expense_splits!: EntityTable<LocalExpenseSplit, 'expense_id'>
  checklist_items!: EntityTable<LocalChecklistItem, 'id'>
  checklist_completions!: EntityTable<LocalChecklistCompletion, 'item_id'>
  guide_cards!: EntityTable<LocalGuideCard, 'id'>
  messages!: EntityTable<LocalMessage, 'id'>

  sync_queue!: EntityTable<SyncQueueEntry, 'id'>
  pending_uploads!: EntityTable<PendingUpload, 'id'>

  constructor() {
    super('mk_trip')
    this.version(1).stores({
      profiles: 'id, display_name',
      trips: 'id, owner_id, trip_type, name',
      trip_members: '[trip_id+user_id], trip_id, user_id',
      days: 'id, trip_id, day_number',
      activities: 'id, day_id, position',
      activity_completions: '[activity_id+user_id], activity_id, user_id',
      spots: 'id, trip_id, category',
      expenses: 'id, trip_id, payer_id, spent_at',
      expense_splits: '[expense_id+user_id], expense_id, user_id',
      checklist_items: 'id, trip_id, category, position',
      checklist_completions: '[item_id+user_id], item_id, user_id',
      guide_cards: 'id, trip_id, position',
      sync_queue: 'id, status, created_at, row_id',
      pending_uploads: 'id, trip_id, status, created_at',
    })
    this.version(2).stores({
      spots: 'id, trip_id, category, day_id',
    })
    this.version(3).stores({
      messages: 'id, trip_id, [trip_id+created_at]',
    })
  }
}

export const db = new MKTripDB()
