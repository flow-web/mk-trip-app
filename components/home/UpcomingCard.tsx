import type { AccentTokens } from '@/lib/design/tokens'

interface BaseProps {
  variant: 'next-spot' | 'expense' | 'weather'
  accent: AccentTokens
}
type NextSpotProps = BaseProps & {
  variant: 'next-spot'
  title: string
  subtitle?: string
  time?: string
}
type ExpenseProps = BaseProps & {
  variant: 'expense'
  amount: number
  label: string
}
type WeatherProps = BaseProps & {
  variant: 'weather'
  temp?: string
  condition?: string
}
type Props = NextSpotProps | ExpenseProps | WeatherProps

export function UpcomingCard(p: Props) {
  if (p.variant === 'next-spot') return <NextSpot {...p} />
  if (p.variant === 'expense') return <ExpenseCard {...p} />
  return <Weather {...p} />
}

function NextSpot({ accent, title, subtitle, time }: NextSpotProps) {
  return (
    <div className="w-[220px] flex-none bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-3.5">
      <div className="flex items-center gap-1.5">
        <div
          className="w-5 h-5 rounded-xs flex items-center justify-center"
          style={{ background: accent.base }}
        >
          <span className="text-white text-[10px]">●</span>
        </div>
        <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark">
          PROCHAIN · {time ?? '—'}
        </div>
      </div>
      <div className="font-display font-bold text-lg mt-2.5 leading-tight">{title}</div>
      {subtitle && <div className="text-xs text-ink-mute dark:text-ink-mute-dark mt-0.5">{subtitle}</div>}
    </div>
  )
}

function ExpenseCard({ amount, label }: ExpenseProps) {
  return (
    <div className="w-[200px] flex-none bg-ink text-paper rounded-md p-3.5">
      <div className="mk-mono text-[10px] opacity-60">DERNIÈRE DÉPENSE</div>
      <div className="mk-display text-3xl mt-3 text-white">
        {(amount / 100).toFixed(2)} €
      </div>
      <div className="text-xs opacity-85 mt-0.5">{label}</div>
    </div>
  )
}

function Weather({ accent, temp, condition }: WeatherProps) {
  return (
    <div
      className="w-[180px] flex-none rounded-md p-3.5"
      style={{ background: accent.tint }}
    >
      <div className="mk-mono text-[10px]" style={{ color: accent.deep }}>
        MÉTÉO
      </div>
      <div className="mk-display text-3xl mt-3" style={{ color: accent.deep }}>
        {temp ?? '—'}
      </div>
      <div className="text-xs opacity-80 mt-1" style={{ color: accent.deep }}>
        {condition ?? 'API à brancher'}
      </div>
    </div>
  )
}
