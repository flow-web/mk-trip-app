'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { Eyebrow } from '@/components/design/Eyebrow'
import type { MapSpot } from '@/lib/map/spotFilters'

interface Props {
  spots: MapSpot[]
  label: string // ex: "Tous les spots" ou "Jour 2"
  onSpotClick: (spotId: string) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍴',
  culture: '🏛',
  nightlife: '🌙',
  nature: '🌲',
  accommodation: '🏠',
  activity: '⚡',
  sport: '🛹',
}

// Vaul snap points : 18% peek / 50% mid / 95% full
const SNAP_POINTS = ['180px', 0.5, 0.95] as const

export function MapSpotSheet({ spots, label, onSpotClick }: Props) {
  const [snap, setSnap] = useState<number | string | null>('180px')

  return (
    <Drawer.Root
      open
      dismissible={false}
      modal={false}
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-paper-dark-deep rounded-t-[16px] shadow-sheet outline-none">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <div className="px-5 flex items-end justify-between">
            <div>
              <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">{label}</Eyebrow>
              <div className="font-display font-bold text-lg mt-0.5">
                {spots.length} spot{spots.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {spots.length === 0 ? (
            <div className="px-5 mt-6 pb-8 text-sm text-ink-mute dark:text-ink-mute-dark">
              Aucun spot pour ce filtre.
            </div>
          ) : (
            <ul className="mt-3 px-5 pb-6 overflow-y-auto max-h-[calc(95vh-80px)] mk-noscroll">
              {spots.map((s, i) => (
                <li
                  key={s.id}
                  className={`py-3 ${i ? 'border-t border-hairline dark:border-hairline-dark' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => onSpotClick(s.id)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className="w-9 h-9 rounded-xs bg-hairline/40 flex items-center justify-center text-base">
                      {CATEGORY_ICONS[s.category] ?? '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
                        {s.category.toUpperCase()}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
