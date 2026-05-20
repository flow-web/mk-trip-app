'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { useSyncStatus } from '@/lib/stores/syncStatus'

export function SyncBanner() {
  const { online, queueLength, failedCount } = useSyncStatus()
  const { tripId } = useParams<{ tripId: string }>()
  if (online && queueLength === 0) return null

  const tone = failedCount > 0 ? 'danger' : !online ? 'warn' : 'info'
  const bg =
    tone === 'danger' ? '#A33A2A' : tone === 'warn' ? '#1C1A17' : '#3D362C'

  return (
    <Link
      href={`/trips/${tripId}/settings/sync` as any}
      className="fixed top-0 left-0 right-0 z-40 text-white text-xs py-2 px-4 flex items-center gap-2"
      style={{ background: bg }}
    >
      {!online ? (
        <WifiOff className="w-3.5 h-3.5" />
      ) : failedCount > 0 ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      <span>
        {!online
          ? `Hors-ligne · ${queueLength} modification${queueLength > 1 ? 's' : ''} en attente`
          : failedCount > 0
            ? `${failedCount} erreur${failedCount > 1 ? 's' : ''} de sync`
            : `Synchronisation… ${queueLength}`}
      </span>
      <span className="ml-auto underline">Détails</span>
    </Link>
  )
}
