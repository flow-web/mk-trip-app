'use client'

import type { AccentTokens } from '@/lib/design/tokens'

interface Day {
  id: string
  date: string | null
  day_number: number
  done?: boolean
}

interface Props {
  days: Day[]
  activeDayId: string | null
  onSelect: (id: string) => void
  accent: AccentTokens
}

const DAYS_FR = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function WeekStrip({ days, activeDayId, onSelect, accent }: Props) {
  return (
    <div className="flex gap-1.5 mt-4">
      {days.map((d) => {
        const date = d.date ? new Date(d.date) : null
        const dayLabel = date ? DAYS_FR[date.getDay()] : '?'
        const dateLabel = date
          ? date.getDate().toString().padStart(2, '0')
          : '?'
        const active = d.id === activeDayId
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className="flex-1 flex flex-col items-center py-2 rounded-sm border"
            style={{
              background: active ? '#1C1A17' : 'transparent',
              borderColor: active ? '#1C1A17' : '#1C1A1714',
              color: active ? '#fff' : '#1C1A17',
            }}
          >
            <span className="mk-mono text-[9px] opacity-70">{dayLabel}</span>
            <span className="font-display font-bold text-base mt-0.5">
              {dateLabel}
            </span>
            {d.done && !active && (
              <span
                className="w-1 h-1 rounded-full mt-1"
                style={{ background: accent.base }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
