import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Trip = Database['public']['Tables']['trips']['Row']

function tripStatus(t: Trip): 'past' | 'active' | 'upcoming' | 'draft' {
  if (!t.start_date || !t.end_date) return 'draft'
  const today = new Date().toISOString().slice(0, 10)
  const start = t.start_date.slice(0, 10)
  const end = t.end_date.slice(0, 10)
  if (today > end) return 'past'
  if (today >= start) return 'active'
  return 'upcoming'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'EN COURS', color: '#C75A20' },
  upcoming: { label: 'À VENIR', color: '#1E3A5C' },
  past: { label: 'TERMINÉ', color: '#5A6E3E' },
  draft: { label: 'BROUILLON', color: '#7A6F60' },
}

export default async function TripsListPage() {
  const supabase = await createClient()
  const { data: trips } = await supabase.from('trips').select('*').order('created_at', { ascending: false }) as { data: Trip[] | null }

  const grouped = {
    active: (trips ?? []).filter((t) => tripStatus(t) === 'active'),
    upcoming: (trips ?? []).filter((t) => tripStatus(t) === 'upcoming'),
    past: (trips ?? []).filter((t) => tripStatus(t) === 'past'),
    draft: (trips ?? []).filter((t) => tripStatus(t) === 'draft'),
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark p-6 md:max-w-[720px] md:mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">MES VOYAGES</div>
          <h1 className="mk-display text-4xl mt-2">{trips?.length ?? 0} voyage{(trips?.length ?? 0) > 1 ? 's' : ''}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/trips/profile" className="px-3 py-1.5 text-[11px] mk-mono rounded-pill border border-hairline hover:border-ink transition">
            Profil
          </Link>
          <Link href="/trips/new" className="px-3 py-1.5 text-[11px] mk-mono rounded-pill bg-ink text-white">
            + Nouveau
          </Link>
        </div>
      </div>

      {process.env.NEXT_PUBLIC_SEGMENTS_ENABLED === 'true' && (
        <Link
          href={'/segments' as any}
          className="block rounded-md bg-ink text-paper p-5 mt-6"
        >
          <div className="text-xs uppercase tracking-wider opacity-80">Nouveau</div>
          <div className="text-xl font-display font-bold mt-1">Segments GPS</div>
          <div className="text-sm opacity-90 mt-1">Crée et bats des records sur des parcours.</div>
        </Link>
      )}

      {(['active', 'upcoming', 'draft', 'past'] as const).map((status) => {
        const list = grouped[status]
        if (list.length === 0) return null
        const { label, color } = STATUS_LABELS[status]
        return (
          <div key={status} className="mt-6">
            <div className="mk-mono text-[10px] font-semibold mb-2" style={{ color }}>{label} · {list.length}</div>
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={t.id}>
                  <Link href={`/trips/${t.id}` as any} className="block bg-white dark:bg-paper-dark-deep rounded-md p-4 border border-hairline dark:border-hairline-dark">
                    <div className="font-display font-bold text-lg">{t.name}</div>
                    <div className="text-sm text-ink-mute dark:text-ink-mute-dark">
                      {t.destination}{t.trip_type ? ` · ${t.trip_type}` : ''}
                    </div>
                    {t.start_date && t.end_date && (
                      <div className="mk-mono text-[10px] text-ink-mute mt-1">
                        {new Date(t.start_date).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(t.end_date).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </main>
  )
}
