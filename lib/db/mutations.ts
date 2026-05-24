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
  },
  activity: {
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
  },
  message: {
    create: (data: InsertWithTempId<Tables['messages']['Insert']>) =>
      localInsert('messages', data),
    delete: (id: string) => localDelete('messages', id),
  },
}
