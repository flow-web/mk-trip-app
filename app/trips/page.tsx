import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Trip = Database['public']['Tables']['trips']['Row']

export default async function TripsListPage() {
  const supabase = await createClient()
  const { data: trips } = await supabase.from('trips').select('*').order('created_at', { ascending: false }) as { data: Trip[] | null }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark p-6">
      <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">MES VOYAGES</div>
      <h1 className="mk-display text-4xl mt-3">{trips?.length ?? 0} voyage{(trips?.length ?? 0) > 1 ? 's' : ''}</h1>
      <ul className="mt-6 space-y-2">
        {trips?.map((t) => (
          <li key={t.id}>
            <Link href={`/trips/${t.id}` as any} className="block bg-white dark:bg-paper-dark-deep rounded-md p-4 border border-hairline dark:border-hairline-dark">
              <div className="font-display font-bold text-lg">{t.name}</div>
              <div className="text-sm text-ink-mute dark:text-ink-mute-dark">{t.destination} · {t.trip_type}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
