'use client'

import { useEffect, useState } from 'react'
import { Square } from 'lucide-react'

interface Props {
  startedAt: number
  currentSpeedKmh: number
  distanceM: number
  accuracyM?: number
  outOfTrack?: boolean
  onStop: () => void
}

function formatDur(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const ds = Math.floor((ms % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${ds}`
}

export function RunHUD({
  startedAt,
  currentSpeedKmh,
  distanceM,
  accuracyM,
  outOfTrack,
  onStop,
}: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(i)
  }, [])

  const dur = now - startedAt

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink text-paper">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest opacity-60">Chrono</div>
          <div className="text-7xl font-bold tabular-nums">{formatDur(dur)}</div>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest opacity-60">Vitesse</div>
            <div className="text-4xl font-semibold tabular-nums">
              {currentSpeedKmh.toFixed(1)}
            </div>
            <div className="text-xs opacity-60">km/h</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest opacity-60">Distance</div>
            <div className="text-4xl font-semibold tabular-nums">{distanceM}</div>
            <div className="text-xs opacity-60">mètres</div>
          </div>
        </div>

        {accuracyM != null && (
          <div className="text-xs opacity-50">précision GPS ±{Math.round(accuracyM)}m</div>
        )}
        {outOfTrack && (
          <div className="px-4 py-2 rounded-full bg-red-500/90 text-white text-sm font-medium">
            Hors trajet
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onStop}
        className="m-6 py-5 rounded-2xl bg-red-500 text-white font-semibold flex items-center justify-center gap-2"
      >
        <Square className="w-5 h-5" fill="currentColor" />
        Stop
      </button>
    </div>
  )
}
