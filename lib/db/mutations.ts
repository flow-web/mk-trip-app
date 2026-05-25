// lib/db/mutations.ts
import { db } from './index'
import { enqueue, flush } from './queue'
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']

type InsertWithTempId<T> = Omit<T, 'created_at' | 'updated_at'> & { id?: string }

// Helper : optimistic insert
async function localInsert(
  table: string,
  data: Record<string, any>,
  dependsOn?: string[],
): Promise<{ id: string; queueId: string }> {
  const id = data.id ?? crypto.randomUUID()
  const pendingMutationId = crypto.randomUUID()
  const now = new Date().toISOString()
  await (db as any)[table].put({
    ...data,
    id,
    created_at: now,
    updated_at: now,
    _pending_mutation_id: pendingMutationId,
    _local_updated_at: Date.now(),
  })
  const queueId = await enqueue({
    op: 'insert',
    table,
    payload: { ...data, id },
    row_id: id,
    depends_on: dependsOn,
  })
  flush()
  return { id, queueId }
}

async function localUpdate(
  table: string,
  id: string,
  patch: Record<string, any>,
): Promise<void> {
  const pendingMutationId = crypto.randomUUID()
  await (db as any)[table].update(id, {
    ...patch,
    updated_at: new Date().toISOString(),
    _pending_mutation_id: pendingMutationId,
    _local_updated_at: Date.now(),
  })
  await enqueue({ op: 'update', table, payload: patch, row_id: id })
  flush()
}

async function localDelete(table: string, id: string): Promise<void> {
  await (db as any)[table].delete(id)
  await enqueue({ op: 'delete', table, payload: {}, row_id: id })
  flush()
}

// Mutations publiques typées
export const mutations = {
  trip: {
    create: (data: InsertWithTempId<Tables['trips']['Insert']>) => localInsert('trips', data),
    update: (id: string, patch: Tables['trips']['Update']) => localUpdate('trips', id, patch),
    delete: (id: string) => localDelete('trips', id),
  },
  expense: {
    create: async (
      expense: InsertWithTempId<Tables['expenses']['Insert']>,
      splits: Array<Omit<Tables['expense_splits']['Insert'], 'expense_id'>>,
    ) => {
      const { id, queueId } = await localInsert('expenses', expense)
      for (const split of splits) {
        await localInsert('expense_splits', { ...split, expense_id: id }, [queueId])
      }
      return { id }
    },
    delete: (id: string) => localDelete('expenses', id),
    update: async (
      id: string,
      patch: Partial<Tables['expenses']['Update']>,
      newSplits?: Array<Omit<Tables['expense_splits']['Insert'], 'expense_id'>>,
    ) => {
      await localUpdate('expenses', id, patch)
      if (newSplits) {
        const oldSplits = await db.expense_splits.where({ expense_id: id }).toArray()
        for (const old of oldSplits) {
          await db.expense_splits.delete([old.expense_id, old.user_id] as any)
          await enqueue({
            op: 'delete',
            table: 'expense_splits',
            payload: { expense_id: old.expense_id, user_id: old.user_id },
            row_id: old.expense_id,
            composite_keys: { expense_id: old.expense_id, user_id: old.user_id },
          })
        }
        for (const split of newSplits) {
          await localInsert('expense_splits', { ...split, expense_id: id })
        }
        flush()
      }
    },
  },
  activity: {
    create: (data: InsertWithTempId<Tables['activities']['Insert']>) => localInsert('activities', data),
    reorder: async (dayId: string, orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await localUpdate('activities', orderedIds[i], { position: i })
      }
    },
    moveToDay: async (activityId: string, newDayId: string, position: number) => {
      await localUpdate('activities', activityId, { day_id: newDayId, position })
    },
    toggleCompletion: async (activityId: string, userId: string, done: boolean) => {
      if (done) {
        await localInsert('activity_completions', {
          activity_id: activityId,
          user_id: userId,
          completed_at: new Date().toISOString(),
        })
      } else {
        await db.activity_completions.delete([activityId, userId] as any)
        await enqueue({
          op: 'delete',
          table: 'activity_completions',
          payload: { activity_id: activityId, user_id: userId },
          row_id: activityId,
          composite_keys: { activity_id: activityId, user_id: userId },
        })
        flush()
      }
    },
  },
  checklist: {
    toggle: async (itemId: string, userId: string, done: boolean) => {
      if (done) {
        await localInsert('checklist_completions', {
          item_id: itemId,
          user_id: userId,
          completed_at: new Date().toISOString(),
        })
      } else {
        await db.checklist_completions.delete([itemId, userId] as any)
        await enqueue({
          op: 'delete',
          table: 'checklist_completions',
          payload: { item_id: itemId, user_id: userId },
          row_id: itemId,
          composite_keys: { item_id: itemId, user_id: userId },
        })
        flush()
      }
    },
    create: (item: InsertWithTempId<Tables['checklist_items']['Insert']>) => localInsert('checklist_items', item),
  },
  spot: {
    create: (data: InsertWithTempId<Tables['spots']['Insert']>) => localInsert('spots', data),
    delete: (id: string) => localDelete('spots', id),
    update: (id: string, patch: Partial<Tables['spots']['Update']>) => localUpdate('spots', id, patch),
    checkin: async (spotId: string, userId: string) => {
      await localInsert('spot_checkins', {
        spot_id: spotId,
        user_id: userId,
        checked_in_at: new Date().toISOString(),
      })
    },
    uncheckIn: async (spotId: string, userId: string) => {
      await db.spot_checkins.delete([spotId, userId] as any)
      await enqueue({
        op: 'delete',
        table: 'spot_checkins',
        payload: { spot_id: spotId, user_id: userId },
        row_id: spotId,
        composite_keys: { spot_id: spotId, user_id: userId },
      })
      flush()
    },
  },
  message: {
    create: (data: InsertWithTempId<Tables['messages']['Insert']>) =>
      localInsert('messages', data),
    delete: (id: string) => localDelete('messages', id),
  },
  poll: {
    create: async (
      tripId: string,
      createdBy: string,
      question: string,
      options: string[],
    ) => {
      const { id: pollId, queueId } = await localInsert('polls', {
        trip_id: tripId,
        question,
        created_by: createdBy,
        closed: false,
      })
      for (let i = 0; i < options.length; i++) {
        await localInsert('poll_options', {
          poll_id: pollId,
          label: options[i],
          position: i,
        }, [queueId])
      }
      return { id: pollId }
    },
    vote: async (pollId: string, userId: string, optionId: string) => {
      const existing = await db.poll_votes.get([pollId, userId] as any)
      if (existing) {
        await db.poll_votes.update([pollId, userId] as any, {
          option_id: optionId,
          voted_at: new Date().toISOString(),
        })
        await enqueue({
          op: 'update',
          table: 'poll_votes',
          payload: { option_id: optionId, voted_at: new Date().toISOString() },
          row_id: pollId,
          composite_keys: { poll_id: pollId, user_id: userId },
        })
        flush()
      } else {
        await localInsert('poll_votes', {
          poll_id: pollId,
          user_id: userId,
          option_id: optionId,
          voted_at: new Date().toISOString(),
        })
      }
    },
    close: (pollId: string) => localUpdate('polls', pollId, { closed: true }),
  },
}
