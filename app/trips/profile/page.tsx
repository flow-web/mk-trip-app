'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase/client'
import { Eyebrow } from '@/components/design/Eyebrow'
import { BADGES, computeUnlockedBadges, type TravelerStats } from '@/lib/gamification/badges'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const trips = useLiveQuery(() => db.trips.toArray(), []) ?? []
  const days = useLiveQuery(() => db.days.toArray(), []) ?? []
  const spots = useLiveQuery(() => db.spots.toArray(), []) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? []
  const activities = useLiveQuery(() => db.activities.toArray(), []) ?? []
  const checkins = useLiveQuery(() => db.spot_checkins.toArray(), []) ?? []
  const polls = useLiveQuery(() => db.polls.toArray(), []) ?? []
  const messages = useLiveQuery(() => db.messages.toArray(), []) ?? []
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []

  const profile = userId ? profiles.find((p) => p.id === userId) : null

  const stats: TravelerStats = {
    totalTrips: trips.length,
    totalDays: days.length,
    totalSpots: spots.length,
    totalExpensesCents: expenses
      .filter((e) => (e.category as string) !== 'settlement')
      .reduce((s, e) => s + e.amount, 0),
    totalActivities: activities.length,
    totalCheckins: checkins.length,
    totalPolls: polls.length,
    totalMessages: messages.length,
    tripTypes: new Set(trips.map((t) => t.trip_type).filter(Boolean) as string[]),
  }

  const unlocked = computeUnlockedBadges(stats)
  const locked = BADGES.filter((b) => !unlocked.find((u) => u.id === b.id))

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">PROFIL VOYAGEUR</Eyebrow>
        <div className="flex items-center gap-4 mt-4">
          <div className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center font-display font-bold text-2xl">
            {(profile?.display_name ?? 'XX').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="mk-display text-3xl">{profile?.display_name ?? 'Voyageur'}</h1>
            <div className="mk-mono text-[11px] text-ink-mute mt-0.5">
              {unlocked.length} / {BADGES.length} badges
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: 'Voyages', value: stats.totalTrips },
            { label: 'Jours', value: stats.totalDays },
            { label: 'Spots', value: stats.totalSpots },
            { label: 'Activités', value: stats.totalActivities },
            { label: 'Check-ins', value: stats.totalCheckins },
            { label: 'Messages', value: stats.totalMessages },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-3 text-center">
              <div className="mk-display text-2xl">{s.value}</div>
              <div className="mk-mono text-[10px] text-ink-mute mt-0.5">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">BADGES DÉBLOQUÉS</Eyebrow>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {unlocked.map((b) => (
              <div key={b.id} className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-3 flex items-center gap-3">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="mk-mono text-[10px] text-ink-mute">{b.description}</div>
                </div>
              </div>
            ))}
            {unlocked.length === 0 && (
              <div className="col-span-2 text-sm text-ink-mute py-4 text-center">
                Voyage pour débloquer tes premiers badges !
              </div>
            )}
          </div>
        </div>

        {locked.length > 0 && (
          <div className="mt-6">
            <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">À DÉBLOQUER</Eyebrow>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {locked.map((b) => (
                <div key={b.id} className="bg-white/50 dark:bg-paper-dark-deep/50 rounded-md border border-hairline dark:border-hairline-dark p-3 flex items-center gap-3 opacity-40">
                  <span className="text-2xl grayscale">{b.emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{b.name}</div>
                    <div className="mk-mono text-[10px] text-ink-mute">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
