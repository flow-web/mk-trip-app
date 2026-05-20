'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { Eyebrow } from '@/components/design/Eyebrow'
import type { AccentTokens } from '@/lib/design/tokens'

interface Spot {
  id: string
  name: string
  category: string
}

interface Props {
  accent: AccentTokens
  spots: Spot[]
  currentDayLabel?: string
}

const FILTERS = ['Tous', 'Jour', 'Type']

export function MapSheet({ accent, spots, currentDayLabel }: Props) {
  const [filter, setFilter] = useState<string>('Tous')
  return (
    <Drawer.Root open dismissible={false} modal={false}>
      <Drawer.Portal>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[65%] bg-white rounded-t-[16px] shadow-sheet outline-none">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <div className="px-5 flex items-center justify-between">
            <div>
              <Eyebrow className="text-ink-mute">
                {currentDayLabel ?? 'TOUS LES SPOTS'}
              </Eyebrow>
              <div className="font-display font-bold text-lg mt-0.5">
                {spots.length} spot{spots.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex gap-1.5">
              {FILTERS.map((f) => {
                const active = f === filter
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-pill text-[11px] font-medium"
                    style={{
                      background: active ? '#1C1A17' : 'transparent',
                      color: active ? '#fff' : '#3D362C',
                      border: active ? 'none' : '1px solid #1C1A1729',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </div>
          <ul className="mt-3 px-5 pb-6 overflow-y-auto max-h-[45vh] mk-noscroll">
            {spots.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-3 py-3 ${
                  i ? 'border-t border-hairline' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xs flex items-center justify-center"
                  style={{ background: accent.base }}
                >
                  <span className="text-white text-xs">●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="mk-mono text-[10px] text-ink-mute mt-0.5">
                    {s.category.toUpperCase()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
