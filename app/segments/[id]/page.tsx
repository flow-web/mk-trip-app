import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listLeaderboard } from '@/lib/segments/queries'
import { SegmentTraceMap } from '@/components/segments/SegmentTraceMap'
import { LeaderboardList } from '@/components/segments/LeaderboardList'
import { ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/lib/segments/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SegmentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: seg } = await (supabase as any)
    .from('segments_public')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!seg) notFound()

  const leaderboard = await listLeaderboard(id, 20)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="pb-24">
      <div className="h-[300px] relative">
        <SegmentTraceMap geom={seg.geom_geojson} activity={seg.activity} />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: ACTIVITY_COLORS[seg.activity as keyof typeof ACTIVITY_COLORS] }}
          />
          <span className="text-xs uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
            {ACTIVITY_LABELS[seg.activity as keyof typeof ACTIVITY_LABELS]}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{seg.name}</h1>
        <div className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
          {(seg.distance_m / 1000).toFixed(2)} km
        </div>

        {user && (
          <Link
            href={`/segments/${seg.id}/run` as any}
            className="block w-full text-center py-4 mt-6 rounded-2xl bg-ink text-paper font-semibold"
          >
            Lancer ce segment
          </Link>
        )}
        {!user && (
          <Link
            href={'/welcome' as any}
            className="block w-full text-center py-4 mt-6 rounded-2xl border border-hairline dark:border-hairline-dark"
          >
            Se connecter pour courir
          </Link>
        )}
      </div>

      <div className="mt-4">
        <h2 className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
          Leaderboard
        </h2>
        <LeaderboardList entries={leaderboard} currentUserId={user?.id} />
      </div>
    </div>
  )
}
