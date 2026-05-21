'use client'

import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Book, Flame, Sun, Wallet } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { InfoTiles } from '@/components/guide/InfoTiles'
import { ChecklistGroup } from '@/components/guide/ChecklistGroup'
import { CrewNote } from '@/components/guide/CrewNote'

export default function GuidePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const items =
    useLiveQuery(
      () => db.checklist_items.where({ trip_id: tripId }).sortBy('position'),
      [tripId],
    ) ?? []
  const completions =
    useLiveQuery(() => db.checklist_completions.toArray(), []) ?? []
  const guideCards =
    useLiveQuery(
      () => db.guide_cards.where({ trip_id: tripId }).sortBy('position'),
      [tripId],
    ) ?? []

  if (!trip) return null
  const accent = accentFor(trip.trip_type)
  const completedItemIds = new Set(completions.map((c) => c.item_id))

  async function toggleItem(id: string, currentlyDone: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await mutations.checklist.toggle(id, user.id, !currentlyDone)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <TripSwitcher
          tone="light"
          tripName={trip.name}
          tripType={trip.trip_type}
          sublabel={trip.destination ?? undefined}
        />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">CARNET</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          Le guide<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>
            {trip.destination ?? trip.name}.
          </span>
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-2 max-w-[280px]">
          Pratique, lexique, matos.
        </p>

        <div className="mt-6">
          <InfoTiles
            tiles={[
              { Icon: Book, title: 'Langues', value: 'FR · PT' },
              { Icon: Wallet, title: 'Devise', value: trip.currency ?? 'EUR' },
              {
                Icon: Flame,
                title: 'Urgences',
                value: '112',
                emphasis: true,
                accentColor: accent.base,
              },
              { Icon: Sun, title: 'Météo type', value: '22-26°' },
            ]}
          />
        </div>

        <div className="mt-7">
          <ChecklistGroup
            items={items.map((it) => ({
              id: it.id,
              label: it.label,
              done: completedItemIds.has(it.id),
            }))}
            accent={accent}
            onToggle={toggleItem}
          />
        </div>

        {guideCards.length > 0 && (
          <div className="mt-7">
            <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">NOTES DU CREW</Eyebrow>
            <div className="mt-3">
              {guideCards.map((g) => (
                <CrewNote
                  key={g.id}
                  authorName="Crew"
                  authorInitials="MK"
                  authorColor={accent.base}
                  date={new Date(g.created_at).toLocaleDateString('fr')}
                  body={g.body ?? ''}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
