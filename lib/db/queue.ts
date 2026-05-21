// lib/db/queue.ts
import { supabase } from '@/lib/supabase/client'
import { db } from './index'
import { useSyncStatus } from '@/lib/stores/syncStatus'
import type { SyncQueueEntry } from './schema'

export async function enqueue(entry: Omit<SyncQueueEntry, 'id' | 'created_at' | 'status' | 'attempts'>): Promise<string> {
  const id = crypto.randomUUID()
  await db.sync_queue.add({
    ...entry,
    id,
    created_at: Date.now(),
    status: 'pending',
    attempts: 0,
  })
  await refreshStatus()
  return id
}

export async function refreshStatus() {
  const total = await db.sync_queue.count()
  const failed = await db.sync_queue.where('status').equals('failed').count()
  useSyncStatus.getState().setQueueLength(total)
  useSyncStatus.getState().setFailedCount(failed)
}

// Flush respectant les depends_on
export async function flush(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const pending = await db.sync_queue
    .where('status').equals('pending')
    .sortBy('created_at')

  for (const entry of pending) {
    // Si dépendances pas encore syncées, skip
    if (entry.depends_on?.length) {
      const deps = await db.sync_queue.bulkGet(entry.depends_on)
      const unresolved = deps.find((d) => d && !d.server_id)
      if (unresolved) continue
      // Remplacer temp_ids par server_ids dans le payload
      const payload = { ...entry.payload }
      for (const depId of entry.depends_on) {
        const dep = deps.find((d) => d?.id === depId)
        if (dep?.server_id && dep.row_id) {
          for (const [k, v] of Object.entries(payload)) {
            if (v === dep.row_id) payload[k] = dep.server_id
          }
        }
      }
      entry.payload = payload
    }

    await db.sync_queue.update(entry.id, { status: 'sending', attempts: entry.attempts + 1 })

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase
      let serverRow: any = null
      if (entry.op === 'insert') {
        const { data, error } = await sb.from(entry.table).insert(entry.payload).select().single()
        if (error) throw error
        serverRow = data
      } else if (entry.op === 'update') {
        const q = entry.composite_keys
          ? sb.from(entry.table).update(entry.payload).match(entry.composite_keys)
          : sb.from(entry.table).update(entry.payload).eq('id', entry.row_id)
        const { error } = await q
        if (error) throw error
      } else if (entry.op === 'delete') {
        const q = entry.composite_keys
          ? sb.from(entry.table).delete().match(entry.composite_keys)
          : sb.from(entry.table).delete().eq('id', entry.row_id)
        const { error } = await q
        if (error) throw error
      }

      // Clear le _pending_mutation_id local + map server_id
      if (serverRow?.id) {
        await (db as any)[entry.table].delete(entry.row_id)
        await (db as any)[entry.table].put({ ...serverRow, _pending_mutation_id: null })
        await db.sync_queue.update(entry.id, { server_id: serverRow.id })
      } else {
        const existing = await (db as any)[entry.table].get(entry.row_id)
        if (existing) await (db as any)[entry.table].update(entry.row_id, { _pending_mutation_id: null })
      }

      await db.sync_queue.delete(entry.id)
    } catch (err: any) {
      const delay = Math.min(1000 * 2 ** entry.attempts, 30_000)
      const status: SyncQueueEntry['status'] = entry.attempts >= 5 ? 'failed' : 'pending'
      await db.sync_queue.update(entry.id, { status, last_error: String(err?.message ?? err) })
      if (status === 'pending') setTimeout(() => flush(), delay)
    }
  }
  await refreshStatus()
  // Dynamic import pour casser le cycle queue ↔ uploads ↔ mutations
  const { flushUploads } = await import('./uploads')
  await flushUploads()
  useSyncStatus.getState().setLastSyncAt(Date.now())
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { useSyncStatus.getState().setOnline(true); flush() })
  window.addEventListener('offline', () => useSyncStatus.getState().setOnline(false))
}
