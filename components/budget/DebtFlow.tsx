import { ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/design/Avatar'

interface Line {
  fromInitials: string
  fromName: string
  fromColor: string
  toInitials: string
  toName: string
  toColor: string
  amountCents: number
}

export function DebtFlow({ lines }: { lines: Line[] }) {
  return (
    <div className="bg-white rounded-md border border-hairline py-1">
      {lines.map((d, i) => (
        <div
          key={`${d.fromInitials}-${d.toInitials}-${i}`}
          className={`flex items-center gap-2 px-4 py-2.5 ${
            i ? 'border-t border-hairline' : ''
          }`}
        >
          <Avatar name={d.fromInitials} bg={d.fromColor} size={28} />
          <span className="text-sm text-ink-soft">{d.fromName}</span>
          <div className="flex-1 flex items-center relative">
            <div className="flex-1 border-t border-dashed border-hairline-strong" />
            <span className="mk-mono text-sm font-semibold absolute left-1/2 -translate-x-1/2 bg-white px-1.5">
              {(d.amountCents / 100).toFixed(2)} €
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-mute -ml-1" />
          </div>
          <span className="text-sm text-ink-soft text-right">{d.toName}</span>
          <Avatar name={d.toInitials} bg={d.toColor} size={28} />
        </div>
      ))}
      {lines.length === 0 && (
        <div className="px-4 py-4 text-sm text-ink-mute">Tout est réglé.</div>
      )}
    </div>
  )
}
