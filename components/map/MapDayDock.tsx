'use client'

import { getDayColor } from '@/lib/map/dayColors'
import type { SelectedDayId } from '@/lib/map/spotFilters'

interface Day {
  id: string
  day_number: number | null
}

interface Props {
  days: Day[]
  selectedDayId: SelectedDayId
  onSelect: (id: SelectedDayId) => void
}

export function MapDayDock({ days, selectedDayId, onSelect }: Props) {
  return (
    <div
      className="pointer-events-auto inline-flex items-center gap-1.5 px-2 py-1.5 rounded-pill bg-black/70 backdrop-blur-md shadow-lg"
      role="toolbar"
      aria-label="Filtre par jour"
    >
      <button
        type="button"
        onClick={() => onSelect('all')}
        aria-pressed={selectedDayId === 'all'}
        className={`px-3 py-1 rounded-pill text-[11px] font-medium transition ${
          selectedDayId === 'all'
            ? 'bg-white text-black'
            : 'text-white/80 hover:text-white'
        }`}
      >
        Tous
      </button>
      {days.map((d, idx) => {
        const active = selectedDayId === d.id
        const color = getDayColor(idx)
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            aria-pressed={active}
            className={`w-7 h-7 rounded-full text-[11px] font-bold transition flex items-center justify-center ${
              active
                ? 'text-black ring-2 ring-white scale-110'
                : 'text-white/90 hover:scale-105'
            }`}
            style={{ background: active ? '#fff' : color }}
          >
            J{d.day_number ?? idx + 1}
          </button>
        )
      })}
    </div>
  )
}
