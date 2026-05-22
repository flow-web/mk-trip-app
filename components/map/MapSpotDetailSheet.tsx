'use client'

import { Drawer } from 'vaul'
import type { LocalSpot } from '@/lib/db/schema'

interface Props {
  spot: (LocalSpot & { lat: number; lng: number }) | null
  onClose: () => void
  accentColor: string
}

export function MapSpotDetailSheet({ spot, onClose, accentColor }: Props) {
  if (!spot) return null
  return (
    <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] bg-white dark:bg-paper-dark-deep rounded-t-[20px] outline-none shadow-2xl">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <div className="px-5 pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="mk-mono text-[10px] uppercase tracking-wider mb-1"
                  style={{ color: accentColor }}
                >
                  {spot.category}
                </div>
                <Drawer.Title asChild>
                  <h2 className="font-display font-bold text-xl truncate">{spot.name}</h2>
                </Drawer.Title>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-9 h-9 rounded-full bg-hairline/40 flex items-center justify-center text-lg shrink-0"
              >
                ×
              </button>
            </div>
            {spot.description && (
              <p className="mt-4 text-sm text-ink-mute dark:text-ink-mute-dark leading-relaxed">
                {spot.description}
              </p>
            )}
            <div className="mt-5 flex gap-2 text-[11px] text-ink-mute dark:text-ink-mute-dark mk-mono">
              <span>{spot.lat.toFixed(4)}</span>
              <span>·</span>
              <span>{spot.lng.toFixed(4)}</span>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
