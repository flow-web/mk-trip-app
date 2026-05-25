'use client'

import { useState } from 'react'
import { MapPin, Check } from 'lucide-react'
import { Drawer } from 'vaul'
import { Input } from '@/components/ui/input'
import type { LocalSpot } from '@/lib/db/schema'

interface Props {
  spot: (LocalSpot & { lat: number; lng: number }) | null
  onClose: () => void
  accentColor: string
  checkedIn?: boolean
  onToggleCheckin?: () => void
  onUpdateEstimatedCost?: (cents: number) => void
}

export function MapSpotDetailSheet({
  spot,
  onClose,
  accentColor,
  checkedIn,
  onToggleCheckin,
  onUpdateEstimatedCost,
}: Props) {
  const [editingCost, setEditingCost] = useState(false)
  const [costInput, setCostInput] = useState('')

  if (!spot) return null

  function handleCostSave() {
    if (!onUpdateEstimatedCost) return
    const cents = Math.round(Number(costInput.replace(',', '.')) * 100)
    if (cents >= 0) onUpdateEstimatedCost(cents)
    setEditingCost(false)
  }

  const estimatedCost = (spot as any).estimated_cost as number | undefined

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

            <div className="mt-5 flex items-center gap-3">
              {onToggleCheckin && (
                <button
                  type="button"
                  onClick={onToggleCheckin}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-medium transition ${
                    checkedIn
                      ? 'bg-green-600 text-white'
                      : 'border border-hairline hover:border-ink text-ink'
                  }`}
                >
                  {checkedIn ? (
                    <><Check className="w-3.5 h-3.5" /> Visité</>
                  ) : (
                    <><MapPin className="w-3.5 h-3.5" /> Je suis là !</>
                  )}
                </button>
              )}

              {onUpdateEstimatedCost && (
                editingCost ? (
                  <div className="flex gap-1.5 items-center">
                    <Input
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="w-20 text-sm mk-mono"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleCostSave()}
                    />
                    <button
                      type="button"
                      onClick={handleCostSave}
                      className="text-xs text-ink-mute hover:text-ink mk-mono underline"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCostInput(
                        estimatedCost && estimatedCost > 0
                          ? (estimatedCost / 100).toFixed(2).replace('.', ',')
                          : '',
                      )
                      setEditingCost(true)
                    }}
                    className="text-[11px] mk-mono text-ink-mute hover:text-ink underline"
                  >
                    {estimatedCost && estimatedCost > 0
                      ? `Estimé : ${(estimatedCost / 100).toFixed(2)} €`
                      : 'Estimer le coût'}
                  </button>
                )
              )}
            </div>

            <div className="mt-4 flex gap-2 text-[11px] text-ink-mute dark:text-ink-mute-dark mk-mono">
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
