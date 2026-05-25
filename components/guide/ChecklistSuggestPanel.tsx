'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ChecklistSuggestion } from '@/lib/ai/suggestChecklistSchema'

const CAT_LABELS: Record<string, string> = {
  clothing: 'Vêtements',
  gear: 'Équipement',
  docs: 'Documents',
  other: 'Divers',
}

interface Props {
  tripId: string
  destination: string
  tripType: string
  durationDays: number
  season: string
  existingLabels: string[]
  onAccept: (items: ChecklistSuggestion[]) => void
  onClose: () => void
}

export function ChecklistSuggestPanel({
  tripId,
  destination,
  tripType,
  durationDays,
  season,
  existingLabels,
  onAccept,
  onClose,
}: Props) {
  const [suggestions, setSuggestions] = useState<ChecklistSuggestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useState(() => {
    fetch('/api/checklist/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId,
        destination,
        tripType,
        durationDays,
        season,
        excludeLabels: existingLabels,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setSuggestions(data.items)
        setSelected(new Set(data.items.map((_: unknown, i: number) => i)))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  })

  function toggleItem(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handleAccept() {
    const items = suggestions.filter((_, i) => selected.has(i))
    if (items.length > 0) onAccept(items)
    else onClose()
  }

  const selectedCount = selected.size

  return (
    <div className="mt-4 bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark overflow-hidden">
      <div className="px-4 py-3 border-b border-hairline dark:border-hairline-dark flex items-center justify-between">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">
          SUGGESTIONS IA
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-mute hover:text-ink transition"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="px-4 py-8 text-center">
          <div className="text-sm text-ink-mute mk-mono animate-pulse">
            Génération de la checklist...
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-6 text-center text-sm text-red-600">
          Erreur lors de la génération. Réessaie plus tard.
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="divide-y divide-hairline dark:divide-hairline-dark">
            {suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleItem(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-paper-deep dark:hover:bg-paper-dark transition"
              >
                <div
                  className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-bold ${
                    selected.has(i)
                      ? 'bg-ink text-white'
                      : 'border-[1.5px] border-hairline-strong'
                  }`}
                >
                  {selected.has(i) && '✓'}
                </div>
                <span className="flex-1 text-sm">{item.label}</span>
                <span className="mk-mono text-[10px] text-ink-mute px-1.5 py-0.5 rounded bg-hairline/50">
                  {CAT_LABELS[item.category] ?? item.category}
                </span>
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-hairline dark:border-hairline-dark">
            <Button
              type="button"
              onClick={handleAccept}
              disabled={selectedCount === 0}
              className="w-full"
            >
              Ajouter {selectedCount > 0 ? `les ${selectedCount} sélectionnées` : ''}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
