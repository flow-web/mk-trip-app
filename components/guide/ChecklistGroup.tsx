'use client'

import { Check } from 'lucide-react'
import { Avatar } from '@/components/design/Avatar'
import type { AccentTokens } from '@/lib/design/tokens'

interface Item {
  id: string
  label: string
  done: boolean
  ownerInitials?: string
  ownerColor?: string
}

interface Props {
  items: Item[]
  accent: AccentTokens
  onToggle: (id: string, currentlyDone: boolean) => void
  onAdd?: () => void
}

export function ChecklistGroup({ items, accent, onToggle, onAdd }: Props) {
  const doneCount = items.filter((i) => i.done).length
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">CHECKLIST MATOS</div>
        <div
          className="mk-mono text-[11px] font-semibold"
          style={{ color: accent.base }}
        >
          {doneCount} / {items.length}
        </div>
      </div>
      <div className="mt-3 bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark overflow-hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id, item.done)}
            className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${
              i ? 'border-t border-hairline dark:border-hairline-dark' : ''
            }`}
          >
            <div
              className="w-5 h-5 rounded-xs flex items-center justify-center"
              style={{
                background: item.done ? '#1C1A17' : 'transparent',
                border: item.done ? 'none' : '1.5px solid #1C1A1729',
              }}
            >
              {item.done && (
                <Check
                  className="w-3.5 h-3.5 text-white"
                  strokeWidth={2.4}
                />
              )}
            </div>
            <div
              className="flex-1 text-sm font-medium"
              style={{
                textDecoration: item.done ? 'line-through' : 'none',
                color: item.done ? '#7A6F60' : '#1C1A17',
              }}
            >
              {item.label}
            </div>
            {item.ownerInitials && item.ownerColor && (
              <Avatar
                name={item.ownerInitials}
                bg={item.ownerColor}
                size={22}
              />
            )}
          </button>
        ))}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center gap-2 px-3.5 py-3 border-t border-hairline dark:border-hairline-dark text-ink-mute dark:text-ink-mute-dark text-sm"
          >
            <span>+ Ajouter un item</span>
          </button>
        )}
      </div>
    </div>
  )
}
