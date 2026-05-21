'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Calendar, Home, Map, Wallet } from 'lucide-react'
import { accentFor } from '@/lib/design/accent'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const TABS = [
  { id: 'home', Icon: Home, label: 'Home', suffix: '' },
  { id: 'map', Icon: Map, label: 'Map', suffix: 'map' },
  { id: 'plan', Icon: Calendar, label: 'Planning', suffix: 'planning' },
  { id: 'split', Icon: Wallet, label: 'Split', suffix: 'budget' },
  { id: 'guide', Icon: BookOpen, label: 'Guide', suffix: 'guide' },
] as const

export function BottomTab({
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
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper dark:bg-paper-dark border-t border-hairline dark:border-hairline-dark pt-2 pb-6 flex justify-around z-50">
      {TABS.map(({ id, Icon, label, suffix }) => {
        const href = `${basePath}/${tripId}${suffix ? `/${suffix}` : ''}`
        const active =
          suffix === ''
            ? path === `${basePath}/${tripId}`
            : path.endsWith(`/${suffix}`)
        const color = active ? accent.base : '#7A6F60'
        return (
          <Link
            key={id}
            href={href as any}
            className="flex flex-col items-center gap-1 flex-1 relative"
          >
            {active && (
              <div
                className="absolute -top-2 w-5 h-[2.5px] rounded"
                style={{ background: accent.base }}
              />
            )}
            <Icon
              className="w-5 h-5"
              style={{ color }}
              strokeWidth={active ? 2 : 1.6}
            />
            <span
              className="text-[10px]"
              style={{ color, fontWeight: active ? 600 : 500 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
