'use client'

import { UpcomingCard } from './UpcomingCard'
import type { AccentTokens } from '@/lib/design/tokens'

interface Activity {
  id: string
  title: string
  subtitle: string | null
  time: string | null
}

interface Expense {
  amount: number
  note: string | null
  category: string
}

interface Props {
  accent: AccentTokens
  nextActivity?: Activity | null
  recentExpense?: Expense | null
  remainingCount: number
}

export function UpcomingCarousel({
  accent,
  nextActivity,
  recentExpense,
  remainingCount,
}: Props) {
  return (
    <section className="px-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="mk-eyebrow text-ink-mute">À VENIR · AUJOURD'HUI</div>
          <h2 className="font-display font-bold text-xl mt-1">
            {remainingCount > 0
              ? `Encore ${remainingCount} chose${remainingCount > 1 ? 's' : ''}.`
              : 'Rien de calé.'}
          </h2>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 mk-noscroll">
        {nextActivity && (
          <UpcomingCard
            variant="next-spot"
            accent={accent}
            title={nextActivity.title}
            subtitle={nextActivity.subtitle ?? undefined}
            time={nextActivity.time?.slice(0, 5)}
          />
        )}
        {recentExpense && (
          <UpcomingCard
            variant="expense"
            accent={accent}
            amount={recentExpense.amount}
            label={recentExpense.note ?? recentExpense.category}
          />
        )}
        <UpcomingCard variant="weather" accent={accent} />
      </div>
    </section>
  )
}
