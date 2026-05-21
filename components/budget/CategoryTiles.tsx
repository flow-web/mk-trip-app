import type { LucideIcon } from 'lucide-react'

interface Tile {
  Icon: LucideIcon
  name: string
  valueCents: number
  pct: number
  color: string
}

export function CategoryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(({ Icon, name, valueCents, pct, color }) => (
        <div
          key={name}
          className="bg-white dark:bg-paper-dark-deep rounded-sm p-3 border border-hairline dark:border-hairline-dark"
        >
          <div className="flex items-center justify-between">
            <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.75} />
            <span className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark">{pct}%</span>
          </div>
          <div className="text-xs text-ink-soft dark:text-ink-soft-dark mt-2">{name}</div>
          <div className="mk-display text-xl mt-0.5">
            {(valueCents / 100).toFixed(2)}
            <span className="text-xs text-ink-mute dark:text-ink-mute-dark"> €</span>
          </div>
        </div>
      ))}
    </div>
  )
}
