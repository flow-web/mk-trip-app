import { Avatar } from '@/components/design/Avatar'

interface Props {
  payerInitials: string
  payerColor: string
  label: string
  category: string
  amountCents: number
  splitsCount: number
  when: string
  state?: 'normal' | 'pending' | 'settled'
}

export function ExpenseRow({
  payerInitials,
  payerColor,
  label,
  category,
  amountCents,
  splitsCount,
  when,
  state = 'normal',
}: Props) {
  const isSettled = state === 'settled'
  const isPending = state === 'pending'
  return (
    <div
      className="flex items-center gap-3 py-3 border-t border-hairline first:border-t-0"
      style={{
        background: isPending ? '#F4E2D2' : 'transparent',
        opacity: isSettled ? 0.55 : 1,
      }}
    >
      <Avatar name={payerInitials} bg={payerColor} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="mk-mono text-[10px] text-ink-mute mt-0.5">
          {category.toUpperCase()} · {when}
        </div>
      </div>
      <div className="text-right">
        <div
          className="mk-mono text-base font-semibold"
          style={{ textDecoration: isSettled ? 'line-through' : 'none' }}
        >
          {(amountCents / 100).toFixed(2)} €
        </div>
        <div className="mk-mono text-[9px] text-ink-mute mt-0.5">
          ÷ {splitsCount}
        </div>
      </div>
    </div>
  )
}
