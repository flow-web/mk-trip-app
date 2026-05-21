'use client'

import { Bell, ChevronDown } from 'lucide-react'
import { TripIcon } from './TripIcon'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  tone: 'light' | 'dark'
  tripName: string
  tripType: TripType
  sublabel?: string
  onClick?: () => void
}

export function TripSwitcher({ tone, tripName, tripType, sublabel, onClick }: Props) {
  const onHero = tone === 'dark'
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 text-left"
      >
        <div
          className="w-9 h-9 rounded-sm flex items-center justify-center"
          style={{ background: onHero ? 'rgba(255,255,255,.18)' : 'transparent' }}
        >
          <TripIcon type={tripType} size={20} color={onHero ? '#fff' : undefined} />
        </div>
        <div className="flex flex-col">
          <div
            className="flex items-center gap-1 font-display font-bold text-base"
            style={{ color: onHero ? '#fff' : '#1C1A17' }}
          >
            {tripName}
            <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
          </div>
          {sublabel && (
            <div
              className="mk-mono text-[10px]"
              style={{ color: onHero ? 'rgba(255,255,255,.7)' : '#7A6F60' }}
            >
              {sublabel.toUpperCase()}
            </div>
          )}
        </div>
      </button>
      <button
        type="button"
        className="w-9 h-9 rounded-sm flex items-center justify-center"
        style={{
          border: `1px solid ${onHero ? 'rgba(255,255,255,.2)' : '#1C1A1714'}`,
        }}
      >
        <Bell
          className="w-4 h-4"
          strokeWidth={1.75}
          style={{ color: onHero ? '#fff' : '#1C1A17' }}
        />
      </button>
    </div>
  )
}
