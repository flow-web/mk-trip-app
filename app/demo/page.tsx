'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { defaultHeroFor } from '@/lib/design/hero'
import { isDemoTripId } from '@/lib/demo/fixtures'
import { Eyebrow } from '@/components/design/Eyebrow'

function rangeLabel(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const fmt = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' })
  return `${fmt.format(new Date(start))} → ${fmt.format(new Date(end))}`
}

function status(start: string | null, end: string | null, today = new Date()) {
  if (!start || !end) return { label: 'BROUILLON', color: '#7A6F60' }
  const s = new Date(start)
  const e = new Date(end)
  if (today < s) return { label: 'À VENIR', color: '#1E3A5C' }
  if (today > e) return { label: 'TERMINÉ', color: '#5A6E3E' }
  return { label: 'EN COURS', color: '#C75A20' }
}

export default function DemoListPage() {
  const allTrips = useLiveQuery(() => db.trips.toArray()) ?? []
  const trips = allTrips
    .filter((t) => isDemoTripId(t.id))
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:pb-12 md:max-w-[1100px] md:mx-auto">
      <header className="pt-14 px-6 md:px-8">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">MK TRIP · MODE DÉMO</Eyebrow>
        <h1 className="mk-display text-5xl md:text-6xl mt-2">
          Lina &amp; Tom<br />
          <span className="mk-display-italic" style={{ color: '#C75A20' }}>en voyage.</span>
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-3 max-w-[420px]">
          Trois carnets de bord factices pour visualiser l&apos;app
          en condition réelle : un week-end en cours, un road-trip à venir, un trek terminé.
        </p>
      </header>

      <ul className="mt-8 px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {trips.map((t) => {
          const accent = accentFor(t.trip_type)
          const hero = t.hero_image_url ?? defaultHeroFor(t.id, t.trip_type)
          const st = status(t.start_date, t.end_date)
          return (
            <li key={t.id}>
              <Link
                href={`/demo/${t.id}` as any}
                className="block rounded-md overflow-hidden border border-hairline dark:border-hairline-dark bg-paper-deep dark:bg-paper-dark-deep hover:shadow-card transition"
              >
                <div className="relative h-[200px] md:h-[220px]">
                  <Image src={hero} alt="" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  <div className="absolute top-3 left-3">
                    <span
                      className="mk-mono text-[10px] px-2 py-1 rounded-xs text-white"
                      style={{ background: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="mk-mono text-[10px] opacity-80">
                      {(t.trip_type ?? 'other').toUpperCase()} · {rangeLabel(t.start_date, t.end_date)}
                    </div>
                    <div className="mk-display text-2xl mt-1">{t.name}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t.destination}</div>
                    <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
                      BUDGET {t.total_budget ?? '—'} {t.currency}
                    </div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: accent.base }}
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-10 mb-24 px-6 md:px-8">
        <Link
          href="/welcome"
          className="mk-mono text-[11px] text-ink-mute dark:text-ink-mute-dark underline"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </main>
  )
}
