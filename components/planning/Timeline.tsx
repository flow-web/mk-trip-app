'use client'

import { TimelineEvent } from './TimelineEvent'
import type { AccentTokens } from '@/lib/design/tokens'

interface Activity {
  id: string
  time: string | null
  title: string
  subtitle: string | null
  completed_at: string | null
}

interface Props {
  activities: Activity[]
  accent: AccentTokens
  onToggleActivity: (id: string, currentlyDone: boolean) => void
  currentActivityId?: string | null
}

export function Timeline({
  activities,
  accent,
  onToggleActivity,
  currentActivityId,
}: Props) {
  return (
    <div className="px-5 pb-24">
      {activities.map((a, i) => (
        <TimelineEvent
          key={a.id}
          time={a.time?.slice(0, 5) ?? '—'}
          title={a.title}
          subtitle={a.subtitle ?? undefined}
          done={!!a.completed_at}
          active={a.id === currentActivityId}
          accent={accent}
          isLast={i === activities.length - 1}
          onToggle={() => onToggleActivity(a.id, !!a.completed_at)}
        />
      ))}
    </div>
  )
}
