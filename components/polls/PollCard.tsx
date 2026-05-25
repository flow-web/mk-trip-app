'use client'

import type { LocalPollOption, LocalPollVote } from '@/lib/db/schema'

interface Props {
  question: string
  options: LocalPollOption[]
  votes: LocalPollVote[]
  currentUserId: string
  closed: boolean
  onVote: (optionId: string) => void
}

export function PollCard({ question, options, votes, currentUserId, closed, onVote }: Props) {
  const myVote = votes.find((v) => v.user_id === currentUserId)
  const totalVotes = votes.length
  const sortedOptions = [...options].sort((a, b) => a.position - b.position)

  return (
    <div className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-4">
      <div className="font-display font-bold text-base">{question}</div>
      {closed && (
        <div className="mk-mono text-[10px] text-ink-mute mt-1">TERMINÉ</div>
      )}
      <div className="mt-3 space-y-2">
        {sortedOptions.map((opt) => {
          const count = votes.filter((v) => v.option_id === opt.id).length
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isMyVote = myVote?.option_id === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !closed && onVote(opt.id)}
              disabled={closed}
              className={`w-full text-left px-3 py-2.5 rounded-sm border transition relative overflow-hidden ${
                isMyVote
                  ? 'border-ink bg-ink/5'
                  : 'border-hairline dark:border-hairline-dark hover:border-ink/30'
              } ${closed ? 'opacity-70' : ''}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-ink/10 transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="mk-mono text-xs text-ink-mute">
                  {count > 0 ? `${pct}%` : ''}
                </span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-2 mk-mono text-[10px] text-ink-mute">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
