'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { accentFor } from '@/lib/design/accent'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { PollCard } from '@/components/polls/PollCard'
import { CreatePollDialog } from '@/components/polls/CreatePollDialog'
import { usePageTour } from '@/hooks/usePageTour'

export default function PollsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  usePageTour('polls')
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const polls = useLiveQuery(
    () => db.polls.where({ trip_id: tripId }).toArray(),
    [tripId],
  ) ?? []
  const allOptions = useLiveQuery(() => db.poll_options.toArray(), []) ?? []
  const allVotes = useLiveQuery(() => db.poll_votes.toArray(), []) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  const sortedPolls = [...polls].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  )

  async function handleCreate(question: string, options: string[]) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.poll.create(tripId, user.id, question, options)
  }

  async function handleVote(pollId: string, optionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.poll.vote(pollId, user.id, optionId)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-32 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <TripSwitcher
          tone="light"
          tripName={trip.name}
          tripType={trip.trip_type}
          sublabel={trip.destination ?? undefined}
        />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">SONDAGES</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          Le crew<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>
            décide.
          </span>
        </h1>

        <div className="mt-6 space-y-4">
          {sortedPolls.length === 0 && (
            <div className="text-sm text-ink-mute dark:text-ink-mute-dark py-8 text-center">
              Aucun sondage. Crée-en un pour décider avec le crew !
            </div>
          )}
          {sortedPolls.map((poll) => (
            <PollCard
              key={poll.id}
              question={poll.question}
              options={allOptions.filter((o) => o.poll_id === poll.id)}
              votes={allVotes.filter((v) => v.poll_id === poll.id)}
              currentUserId={trip.owner_id}
              closed={poll.closed}
              onVote={(optionId) => handleVote(poll.id, optionId)}
            />
          ))}
        </div>
      </div>

      <CreatePollDialog onSubmit={handleCreate} />
    </main>
  )
}
