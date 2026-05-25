'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Calendar, Home, Map, MessageSquare, Plus, Wallet } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { ThemeToggle } from '@/components/design/ThemeToggle'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const NAV = [
  { Icon: Home, label: 'Home', suffix: '' },
  { Icon: Map, label: 'Map', suffix: 'map' },
  { Icon: Calendar, label: 'Planning', suffix: 'planning' },
  { Icon: Wallet, label: 'Split', suffix: 'budget' },
  { Icon: MessageSquare, label: 'Chat', suffix: 'chat' },
  { Icon: BookOpen, label: 'Guide', suffix: 'guide' },
] as const

export function SideRail({
  tripId,
  tripType,
  basePath = '/trips',
}: {
  tripId: string
  tripType: TripType
  basePath?: '/trips' | '/demo'
}) {
  const path = usePathname()
  const accent = accentFor(tripType)
  const allTrips = useLiveQuery(() => db.trips.toArray()) ?? []
  const isDemo = basePath === '/demo'
  const trips = allTrips.filter((t) =>
    isDemo ? t.id.startsWith('demo-trip-') : !t.id.startsWith('demo-trip-'),
  )

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark p-5 gap-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-ink rounded-sm flex items-center justify-center">
          <span className="mk-display text-paper text-lg">MK</span>
        </div>
        <span className="mk-display text-xl">Trip</span>
      </div>

      <div>
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark mb-2">VOYAGES · {trips.length}</div>
        {trips.map((t) => {
          if (!t.trip_type) return null
          const a = accentFor(t.trip_type)
          const isActive = t.id === tripId
          return (
            <Link
              key={t.id}
              href={`${basePath}/${t.id}` as any}
              className="flex items-center gap-2.5 px-2 py-2 rounded-sm mb-1"
              style={{
                background: isActive ? '#fff' : 'transparent',
                border: isActive ? '1px solid #1C1A1714' : 'none',
              }}
            >
              <div
                className="w-7 h-7 rounded-xs flex items-center justify-center"
                style={{ background: a.base }}
              >
                <span className="text-white text-xs">●</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="mk-mono text-[9px] text-ink-mute dark:text-ink-mute-dark">
                  {(t.trip_type ?? 'other').toUpperCase()}
                </div>
              </div>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: a.base }}
                />
              )}
            </Link>
          )
        })}
        {!isDemo && (
          <Link
            href={'/trips/new' as any}
            className="flex items-center gap-2 px-2 py-2 text-ink-mute dark:text-ink-mute-dark text-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau voyage
          </Link>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-0.5">
        <ThemeToggle />
        {NAV.map(({ Icon, label, suffix }) => {
          const href = `${basePath}/${tripId}${suffix ? `/${suffix}` : ''}`
          const active =
            suffix === ''
              ? path === `${basePath}/${tripId}`
              : path.endsWith(`/${suffix}`)
          return (
            <Link
              key={label}
              href={href as any}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xs"
              style={{ background: active ? '#E8E0CF' : 'transparent' }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: active ? accent.base : '#3D362C' }}
                strokeWidth={1.75}
              />
              <span
                className="text-sm"
                style={{
                  fontWeight: active ? 600 : 500,
                  color: active ? '#1C1A17' : '#3D362C',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
