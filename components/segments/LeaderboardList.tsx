import type { LeaderboardEntry } from '@/lib/segments/queries'

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId?: string | null
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-muted dark:text-ink-muted-dark px-4 py-6">
        Aucun run pour le moment. Sois le premier.
      </p>
    )
  }
  return (
    <ol className="divide-y divide-hairline dark:divide-hairline-dark">
      {entries.map((e, i) => {
        const mine = e.user_id === currentUserId
        return (
          <li
            key={e.run_id}
            className={`flex items-center gap-3 px-4 py-3 ${
              mine ? 'bg-accent/5' : ''
            }`}
          >
            <div className="w-8 text-center font-mono text-sm">{i + 1}</div>
            <div className="w-9 h-9 rounded-full bg-paper-muted dark:bg-paper-muted-dark overflow-hidden flex items-center justify-center text-xs">
              {e.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                e.display_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{e.display_name}</div>
              {e.speed_avg_kmh != null && (
                <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {e.speed_avg_kmh.toFixed(1)} km/h moy.
                </div>
              )}
            </div>
            <div className="font-mono text-sm tabular-nums">
              {formatDuration(e.duration_ms)}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
