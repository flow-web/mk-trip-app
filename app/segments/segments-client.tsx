'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SegmentMap } from '@/components/segments/SegmentMap'
import { ActivityChips } from '@/components/segments/ActivityChips'
import { ACTIVITY_COLORS, ACTIVITY_LABELS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'
import type { SegmentPublic } from '@/lib/segments/queries'

export function SegmentsClient({ initialSegments }: { initialSegments: SegmentPublic[] }) {
  const [activity, setActivity] = useState<ActivityKind | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visible = activity
    ? initialSegments.filter((s) => s.activity === activity)
    : initialSegments

  return (
    <div className="relative h-dvh">
      <div className="absolute inset-0">
        <SegmentMap
          segments={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur border-b border-hairline dark:border-hairline-dark">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-semibold">Segments</h1>
          <Link
            href={'/segments/new/live' as any}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-paper text-sm"
          >
            <Plus className="w-4 h-4" /> Créer
          </Link>
        </div>
        <ActivityChips selected={activity} onSelect={setActivity} />
      </div>

      {selectedId &&
        (() => {
          const s = visible.find((x) => x.id === selectedId)
          if (!s) return null
          return (
            <Link
              href={`/segments/${s.id}` as any}
              className="absolute bottom-6 left-4 right-4 bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark rounded-2xl p-4 shadow-lg flex items-center gap-3"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: ACTIVITY_COLORS[s.activity] }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.name}</div>
                <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {ACTIVITY_LABELS[s.activity]} · {(s.distance_m / 1000).toFixed(2)} km · {s.run_count} runs
                </div>
              </div>
              <div className="text-sm">→</div>
            </Link>
          )
        })()}
    </div>
  )
}
