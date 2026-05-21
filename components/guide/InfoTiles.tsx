import type { LucideIcon } from 'lucide-react'

interface Tile {
  Icon: LucideIcon
  title: string
  value: string
  emphasis?: boolean
  accentColor?: string
}

export function InfoTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(({ Icon, title, value, emphasis, accentColor }) => (
        <div
          key={title}
          className="rounded-md p-3.5"
          style={{
            background: emphasis ? '#1C1A17' : '#fff',
            color: emphasis ? '#fff' : '#1C1A17',
            border: emphasis ? 'none' : '1px solid #1C1A1714',
          }}
        >
          <Icon
            className="w-4 h-4"
            strokeWidth={1.75}
            style={{ color: emphasis ? accentColor : '#7A6F60' }}
          />
          <div
            className="text-[11px] mt-2.5"
            style={{ color: emphasis ? 'rgba(255,255,255,.7)' : '#7A6F60' }}
          >
            {title}
          </div>
          <div className="font-display font-bold text-lg mt-0.5 tracking-tight">
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
