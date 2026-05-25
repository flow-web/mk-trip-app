import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { mutations } from '@/lib/db/mutations'

describe('mutations.expense', () => {
  beforeEach(async () => {
    await db.expenses.clear()
    await db.expense_splits.clear()
    await db.sync_queue.clear()
  })

  it('update changes expense fields in Dexie', async () => {
    const { id } = await mutations.expense.create(
      {
        trip_id: 'trip-1',
        payer_id: 'user-1',
        amount: 5000,
        currency: 'EUR',
        category: 'food',
        note: 'Pizza',
        spent_at: new Date().toISOString(),
        split_mode: 'equal',
      },
      [{ user_id: 'user-1', share: 0.5 }, { user_id: 'user-2', share: 0.5 }],
    )

    await mutations.expense.update(id, { amount: 6000, note: 'Pasta' })

    const updated = await db.expenses.get(id)
    expect(updated!.amount).toBe(6000)
    expect(updated!.note).toBe('Pasta')
  })

  it('update replaces splits when new splits are provided', async () => {
    const { id } = await mutations.expense.create(
      {
        trip_id: 'trip-1',
        payer_id: 'user-1',
        amount: 9000,
        currency: 'EUR',
        category: 'food',
        note: null,
        spent_at: new Date().toISOString(),
        split_mode: 'equal',
      },
      [{ user_id: 'user-1', share: 0.5 }, { user_id: 'user-2', share: 0.5 }],
    )

    await mutations.expense.update(
      id,
      { split_mode: 'custom' },
      [{ user_id: 'user-1', share: 0.7 }, { user_id: 'user-2', share: 0.3 }],
    )

    const splits = await db.expense_splits.where({ expense_id: id }).toArray()
    expect(splits).toHaveLength(2)
    expect(splits.find(s => s.user_id === 'user-1')!.share).toBe(0.7)
    expect(splits.find(s => s.user_id === 'user-2')!.share).toBe(0.3)
  })
})
