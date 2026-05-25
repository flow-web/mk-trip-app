'use client'

import { CATEGORY_ICONS } from '@/lib/map/categoryIcons'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'

interface Props {
  suggestion: AISuggestion
  selected: boolean
  onToggle: (id: string) => void
}

export function AISuggestionCard({ suggestion, selected, onToggle }: Props) {
  const icon = CATEGORY_ICONS[suggestion.category] ?? '•'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(suggestion.id)}
      className={`w-full flex items-start gap-3 py-3 text-left transition ${
        selected ? 'bg-hairline/40' : 'hover:bg-hairline/20'
      } px-3 rounded-md`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
          selected ? 'bg-black border-black text-white' : 'border-hairline-strong'
        }`}
        aria-hidden
      >
        {selected ? '✓' : ''}
      </div>
      <div className="w-8 h-8 rounded-xs bg-hairline/40 flex items-center justify-center text-base shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate">{suggestion.name}</div>
          {suggestion.mapbox_verified ? (
            <span
              className="text-[10px] text-emerald-600"
              aria-label="vérifié"
              title="Coordonnées vérifiées par Mapbox"
            >
              ✓
            </span>
          ) : (
            <span
              className="text-[10px] text-amber-600"
              aria-label="coords approximatives"
              title="Coordonnées approximatives — à vérifier"
            >
              ⚠
            </span>
          )}
        </div>
        <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
          {suggestion.category.toUpperCase()}
        </div>
        <div className="text-xs text-ink-mute dark:text-ink-mute-dark mt-1 leading-snug">
          {suggestion.description}
        </div>
      </div>
    </button>
  )
}
