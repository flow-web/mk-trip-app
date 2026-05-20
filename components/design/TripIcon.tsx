import type { ReactNode } from 'react'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

interface Props {
  type: TripType
  size?: number
  color?: string
}

const PATHS: Record<TripType, ReactNode> = {
  sport: (
    <>
      <ellipse cx="12" cy="10" rx="9" ry="2.5" fill="currentColor" />
      <circle cx="6" cy="14" r="1.6" fill="currentColor" />
      <circle cx="18" cy="14" r="1.6" fill="currentColor" />
    </>
  ),
  hike: <path d="M2 20L9 6l4 7 3-3 6 10z" fill="currentColor" />,
  beach: (
    <path
      d="M2 14c2.5 0 4-4 7-4s4 4 7 4 4-4 6-4v6H2z"
      fill="currentColor"
    />
  ),
  city_break: (
    <>
      <path
        d="M2 17V9a2 2 0 012-2h9l4 3h4a1 1 0 011 1v6h-2a2.5 2.5 0 01-5 0H9a2.5 2.5 0 01-5 0H2z"
        fill="currentColor"
      />
      <circle cx="6.5" cy="17.5" r="1.6" fill="#fff" />
      <circle cx="16.5" cy="17.5" r="1.6" fill="#fff" />
    </>
  ),
  road_trip: (
    <path
      d="M8 3l-2 18h12l-2-18zm0 4h8M9 11h6M10 15h4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  ),
  other: <circle cx="12" cy="12" r="8" fill="currentColor" />,
}

export function TripIcon({ type, size = 20, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, flex: 'none' }}
      aria-hidden
    >
      {PATHS[type]}
    </svg>
  )
}
