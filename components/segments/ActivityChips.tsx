'use client'

import { ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'

const ACTIVITIES: ActivityKind[] = ['skate', 'run', 'bike', 'car', 'walk', 'other']

export function ActivityChips({
  selected,
  onSelect,
}: {
  selected: ActivityKind | null
  onSelect: (a: ActivityKind | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-3">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
          selected === null
            ? 'bg-ink dark:bg-ink-dark text-paper border-ink dark:border-ink-dark'
            : 'border-hairline dark:border-hairline-dark'
        }`}
      >
        Toutes
      </button>
      {ACTIVITIES.map((a) => {
        const active = selected === a
        return (
          <button
            key={a}
            type="button"
            onClick={() => onSelect(a)}
            style={
              active
                ? { background: ACTIVITY_COLORS[a], borderColor: ACTIVITY_COLORS[a] }
                : undefined
            }
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
              active
                ? 'text-white'
                : 'border-hairline dark:border-hairline-dark'
            }`}
          >
            {ACTIVITY_LABELS[a]}
          </button>
        )
      })}
    </div>
  )
}
