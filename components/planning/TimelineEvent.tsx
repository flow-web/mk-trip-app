'use client'

import type { AccentTokens } from '@/lib/design/tokens'

interface Props {
  time: string
  duration?: string
  title: string
  subtitle?: string
  done: boolean
  active: boolean
  accent: AccentTokens
  isLast?: boolean
  onToggle: () => void
}

export function TimelineEvent({
  time,
  duration,
  title,
  subtitle,
  done,
  active,
  accent,
  isLast,
  onToggle,
}: Props) {
  return (
    <div className="flex gap-3 relative">
      <div className="w-12 pt-3 flex flex-col items-end">
        <div
          className="mk-mono text-xs font-semibold"
          style={{ color: active ? accent.base : '#1C1A17' }}
        >
          {time}
        </div>
        {duration && (
          <div className="mk-mono text-[9px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
            {duration}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center pt-3.5">
        <button
          type="button"
          onClick={onToggle}
          className="w-3 h-3 rounded-full"
          style={{
            background: done ? accent.base : '#fff',
            border: active
              ? `3px solid ${accent.base}`
              : `2px solid ${done ? accent.base : '#1C1A1729'}`,
          }}
        />
        {!isLast && (
          <div
            className="w-[1.5px] flex-1 min-h-[50px]"
            style={{ background: done ? accent.base : '#1C1A1729' }}
          />
        )}
      </div>
      <div className="flex-1 pt-2 pb-4">
        <div
          className="font-display font-bold text-base tracking-tight"
          style={{
            textDecoration: done ? 'line-through' : 'none',
            color: done ? '#7A6F60' : '#1C1A17',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">{subtitle}</div>
        )}
      </div>
    </div>
  )
}
