'use client'

import { useState, useEffect, useCallback } from 'react'
import { Drawer } from 'vaul'
import { AISuggestionCard } from './AISuggestionCard'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'

interface Props {
  tripId: string
  destination: string
  tripType: 'city_break' | 'road_trip' | 'sport' | 'hike' | 'beach' | 'other'
  excludeSpotNames: string[]
  dayId: string | null
  onClose: () => void
  onAccept: (selected: AISuggestion[]) => void
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'results'; suggestions: AISuggestion[] }

export function AISuggestionsPanel({
  tripId, destination, tripType, excludeSpotNames, dayId, onClose, onAccept,
}: Props) {
  const [state, setState] = useState<FetchState>({ kind: 'loading' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promptHint, setPromptHint] = useState('')

  const doFetch = useCallback(async (hint?: string) => {
    setState({ kind: 'loading' })
    setSelectedIds(new Set())
    try {
      const res = await fetch('/api/spots/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tripId, destination, tripType, dayId: dayId ?? undefined,
          promptHint: hint || undefined,
          excludeNames: excludeSpotNames,
        }),
      })
      if (!res.ok) {
        setState({ kind: 'error', message: `HTTP ${res.status}` })
        return
      }
      const body = await res.json() as { suggestions: AISuggestion[] }
      setState({ kind: 'results', suggestions: body.suggestions })
    } catch (err) {
      setState({ kind: 'error', message: String(err) })
    }
  }, [tripId, destination, tripType, dayId, excludeSpotNames])

  useEffect(() => { doFetch() }, [doFetch])

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAccept = () => {
    if (state.kind !== 'results') return
    const selected = state.suggestions.filter((s) => selectedIds.has(s.id))
    onAccept(selected)
  }

  const selectedCount = selectedIds.size
  const headerLabel = dayId
    ? `Suggestions IA · jour sélectionné`
    : `Suggestions IA pour ${destination}`

  return (
    <Drawer.Root open onOpenChange={(o) => !o && onClose()} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white dark:bg-paper-dark-deep rounded-t-[20px] outline-none shadow-2xl flex flex-col">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <Drawer.Title className="sr-only">{headerLabel}</Drawer.Title>

          <div className="px-5 pb-3 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="mk-mono text-[10px] uppercase tracking-wider text-ink-mute dark:text-ink-mute-dark mb-1">
                ✨ Claude Haiku
              </div>
              <h2 className="font-display font-bold text-lg truncate">{headerLabel}</h2>
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

          <div className="px-5 pb-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={promptHint}
              onChange={(e) => setPromptHint(e.target.value)}
              placeholder="Guide-moi : plus food de rue, moins touristique..."
              maxLength={200}
              className="flex-1 px-3 py-2 text-xs rounded-md bg-hairline/30 outline-none focus:bg-hairline/50"
            />
            <button
              type="button"
              onClick={() => doFetch(promptHint)}
              aria-label="Régénérer"
              className="w-9 h-9 rounded-md bg-hairline/40 flex items-center justify-center text-sm"
              disabled={state.kind === 'loading'}
            >
              ↻
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 mk-noscroll">
            {state.kind === 'loading' && (
              <div className="px-5 py-12 text-center text-sm text-ink-mute dark:text-ink-mute-dark">
                <div className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
                <div>Claude réfléchit...</div>
              </div>
            )}
            {state.kind === 'error' && (
              <div className="px-5 py-12 text-center text-sm">
                <div className="text-red-600 mb-3">Erreur : {state.message}</div>
                <button
                  type="button"
                  onClick={() => doFetch(promptHint)}
                  className="px-4 py-2 bg-hairline/40 rounded-md text-xs"
                >
                  Réessayer
                </button>
              </div>
            )}
            {state.kind === 'results' && state.suggestions.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-ink-mute dark:text-ink-mute-dark">
                Aucune suggestion. Change le prompt et réessaie.
              </div>
            )}
            {state.kind === 'results' && state.suggestions.map((s) => (
              <AISuggestionCard
                key={s.id}
                suggestion={s}
                selected={selectedIds.has(s.id)}
                onToggle={toggleId}
              />
            ))}
          </div>

          <div className="border-t border-hairline px-5 py-3 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-md bg-hairline/30"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 text-sm rounded-md bg-black text-white disabled:bg-hairline disabled:text-ink-mute"
            >
              Ajouter {selectedCount > 0 ? `${selectedCount} spot${selectedCount > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
