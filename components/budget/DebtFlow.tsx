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
    <div className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark py-1">
      {lines.map((d, i) => (
        <div
          key={`${d.fromInitials}-${d.toInitials}-${i}`}
          className={`flex items-center gap-2 px-4 py-2.5 ${
            i ? 'border-t border-hairline dark:border-hairline-dark' : ''
          }`}
        >
          <Avatar name={d.fromInitials} bg={d.fromColor} size={28} />
          <span className="text-sm text-ink-soft dark:text-ink-soft-dark">{d.fromName}</span>
          <div className="flex-1 flex items-center relative">
            <div className="flex-1 border-t border-dashed border-hairline-strong dark:border-hairline-strong-dark" />
            <span className="mk-mono text-sm font-semibold absolute left-1/2 -translate-x-1/2 bg-white dark:bg-paper-dark-deep px-1.5">
              {(d.amountCents / 100).toFixed(2)} €
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-mute dark:text-ink-mute-dark -ml-1" />
          </div>
          <span className="text-sm text-ink-soft dark:text-ink-soft-dark text-right">{d.toName}</span>
          <Avatar name={d.toInitials} bg={d.toColor} size={28} />
        </div>
      ))}
      {lines.length === 0 && (
        <div className="px-4 py-4 text-sm text-ink-mute dark:text-ink-mute-dark">Tout est réglé.</div>
      )}
    </div>
  )
}
