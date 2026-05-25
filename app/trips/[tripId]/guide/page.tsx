'use client'

import { useState, useEffect } from 'react'
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
import { ChecklistSuggestPanel } from '@/components/guide/ChecklistSuggestPanel'
import { WeatherWidget } from '@/components/guide/WeatherWidget'
import { CrewNote } from '@/components/guide/CrewNote'
import { usePageTour } from '@/hooks/usePageTour'
import type { ChecklistSuggestion } from '@/lib/ai/suggestChecklistSchema'

function getSeason(startDate: string | null): string {
  if (!startDate) return 'summer'
  const month = new Date(startDate).getMonth()
  if (month >= 2 && month < 5) return 'spring'
  if (month >= 5 && month < 8) return 'summer'
  if (month >= 8 && month < 11) return 'autumn'
  return 'winter'
}

function getDurationDays(start: string | null, end: string | null): number {
  if (!start || !end) return 7
  const diff = (+new Date(end) - +new Date(start)) / 86_400_000
  return Math.max(1, Math.round(diff))
}

export default function GuidePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [weatherLabel, setWeatherLabel] = useState('—')
  usePageTour('guide')

  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const spots = useLiveQuery(
    () => db.spots.where({ trip_id: tripId }).toArray(), [tripId],
  ) ?? []
  const firstSpotWithCoords = spots.find((s) => s.lat != null && s.lng != null)

  useEffect(() => {
    if (!firstSpotWithCoords) return
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${firstSpotWithCoords.lat}&longitude=${firstSpotWithCoords.lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.daily) {
          setWeatherLabel(`${Math.round(data.daily.temperature_2m_min[0])}–${Math.round(data.daily.temperature_2m_max[0])}°`)
        }
      })
      .catch(() => {})
  }, [firstSpotWithCoords?.lat, firstSpotWithCoords?.lng])
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await mutations.checklist.toggle(id, user.id, !currentlyDone)
  }

  async function handleAcceptSuggestions(suggestions: ChecklistSuggestion[]) {
    const maxPos = items.length > 0
      ? Math.max(...items.map((it) => it.position)) + 1
      : 0
    for (let i = 0; i < suggestions.length; i++) {
      await mutations.checklist.create({
        trip_id: tripId,
        label: suggestions[i].label,
        category: suggestions[i].category,
        position: maxPos + i,
      })
    }
    setSuggestOpen(false)
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
              { Icon: Sun, title: 'Météo', value: weatherLabel },
            ]}
          />
        </div>

        <div className="mt-7" data-tour="guide-checklist">
          <ChecklistGroup
            items={items.map((it) => ({
              id: it.id,
              label: it.label,
              done: completedItemIds.has(it.id),
            }))}
            accent={accent}
            onToggle={toggleItem}
          />

          {!suggestOpen && items.length === 0 && (
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              data-tour="guide-checklist-ai"
              className="mt-4 w-full py-3 rounded-md bg-ink text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              ✨ Générer ma checklist
            </button>
          )}

          {!suggestOpen && items.length > 0 && (
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="mt-3 text-[11px] mk-mono text-ink-mute hover:text-ink underline transition"
            >
              ✨ Compléter avec l'IA
            </button>
          )}

          {suggestOpen && (
            <ChecklistSuggestPanel
              tripId={tripId}
              destination={trip.destination ?? trip.name}
              tripType={trip.trip_type ?? 'other'}
              durationDays={getDurationDays(trip.start_date, trip.end_date)}
              season={getSeason(trip.start_date)}
              existingLabels={items.map((it) => it.label)}
              onAccept={handleAcceptSuggestions}
              onClose={() => setSuggestOpen(false)}
            />
          )}
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
