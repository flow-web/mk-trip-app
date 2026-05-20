import Image from 'next/image'
import type { AccentTokens } from '@/lib/design/tokens'

export interface HeroProps {
  photo: string
  accent: AccentTokens
  eyebrow: string
  title: string
  metaBadge?: string
  metaRight?: string
  topBar?: React.ReactNode
}

export function Hero({
  photo,
  accent,
  eyebrow,
  title,
  metaBadge,
  metaRight,
  topBar,
}: HeroProps) {
  return (
    <section className="relative h-[420px] md:h-[480px] w-full overflow-hidden">
      <Image
        src={photo}
        alt=""
        fill
        className="object-cover"
        priority
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      {topBar && (
        <div className="absolute top-0 left-0 right-0 pt-14 px-5">{topBar}</div>
      )}
      <div className="absolute left-5 right-5 bottom-5 text-white">
        <div className="mk-eyebrow text-white/85">{eyebrow}</div>
        <h1 className="mk-display text-5xl md:text-7xl mt-2 whitespace-pre-line">
          {title}
        </h1>
        {(metaBadge || metaRight) && (
          <div className="flex items-center gap-3 mt-4">
            {metaBadge && (
              <span
                className="px-2.5 py-1 rounded-xs text-white text-base mk-display-italic"
                style={{ background: accent.base }}
              >
                {metaBadge}
              </span>
            )}
            {metaRight && <span className="mk-mono text-sm">{metaRight}</span>}
          </div>
        )}
      </div>
    </section>
  )
}
