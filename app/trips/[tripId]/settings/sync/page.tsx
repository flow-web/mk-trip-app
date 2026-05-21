'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { flush } from '@/lib/db/queue'
import { useSyncStatus } from '@/lib/stores/syncStatus'
import { Button } from '@/components/ui/button'

export default function SyncDiagnosticPage() {
  const queue =
    useLiveQuery(() => db.sync_queue.orderBy('created_at').toArray()) ?? []
  const uploads =
    useLiveQuery(() => db.pending_uploads.orderBy('created_at').toArray()) ?? []
  const { online, queueLength, failedCount, lastSyncAt } = useSyncStatus()

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark p-5 pb-24">
      <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">DIAGNOSTIQUE SYNC</div>
      <h1 className="mk-display text-3xl mt-2">État du sync.</h1>

      <div className="mt-6 bg-white dark:bg-paper-dark-deep border border-hairline dark:border-hairline-dark rounded-md p-4 space-y-2">
        <Row label="Online" value={online ? 'Oui' : 'Non'} />
        <Row label="En attente" value={String(queueLength)} />
        <Row label="En erreur" value={String(failedCount)} />
        <Row
          label="Dernier sync"
          value={
            lastSyncAt
              ? new Date(lastSyncAt).toLocaleTimeString('fr')
              : 'jamais'
          }
        />
      </div>

      <Button
        type="button"
        onClick={() => flush()}
        className="w-full mt-4"
      >
        Forcer le flush
      </Button>

      {queue.length > 0 && (
        <div className="mt-8">
          <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark mb-2">
            QUEUE ({queue.length})
          </div>
          <div className="bg-white dark:bg-paper-dark-deep border border-hairline dark:border-hairline-dark rounded-md overflow-hidden">
            {queue.map((q) => (
              <div
                key={q.id}
                className="px-3 py-2.5 border-b border-hairline dark:border-hairline-dark last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="mk-mono text-xs">
                    {q.op.toUpperCase()} · {q.table}
                  </span>
                  <span
                    className="mk-mono text-[10px] px-1.5 py-0.5 rounded-xs"
                    style={{
                      background:
                        q.status === 'failed' ? '#A33A2A20' : '#1C1A1714',
                      color: q.status === 'failed' ? '#A33A2A' : '#1C1A17',
                    }}
                  >
                    {q.status}
                  </span>
                </div>
                {q.last_error && (
                  <div className="text-[11px] text-danger mt-1">
                    {q.last_error}
                  </div>
                )}
                <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
                  attempts: {q.attempts} ·{' '}
                  {new Date(q.created_at).toLocaleTimeString('fr')}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      db.sync_queue.update(q.id, {
                        status: 'pending',
                        attempts: 0,
                      })
                    }
                    className="mk-mono text-[10px] underline"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => db.sync_queue.delete(q.id)}
                    className="mk-mono text-[10px] underline text-danger"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-8">
          <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark mb-2">
            UPLOADS ({uploads.length})
          </div>
          <div className="bg-white dark:bg-paper-dark-deep border border-hairline dark:border-hairline-dark rounded-md overflow-hidden">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="px-3 py-2.5 border-b border-hairline dark:border-hairline-dark last:border-b-0 mk-mono text-xs"
              >
                {u.filename} · {u.status} · {(u.file.size / 1024).toFixed(0)} ko
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-soft dark:text-ink-soft-dark">{label}</span>
      <span className="mk-mono">{value}</span>
    </div>
  )
}
