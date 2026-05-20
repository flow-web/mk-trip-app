import { Eyebrow } from '@/components/design/Eyebrow'

interface Stat {
  label: string
  val: string
  unit?: string
}

export function CrewStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="px-5 mt-8">
      <Eyebrow className="text-ink-mute">LE CREW EN CHIFFRES</Eyebrow>
      <div className="mt-3 bg-white rounded-md border border-hairline overflow-hidden">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-baseline justify-between px-4 py-3.5 ${
              i ? 'border-t border-hairline' : ''
            }`}
          >
            <div className="text-sm text-ink-soft">{s.label}</div>
            <div className="flex items-baseline gap-1">
              <div className="mk-display text-2xl">{s.val}</div>
              {s.unit && (
                <div className="mk-mono text-xs text-ink-mute">{s.unit}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
