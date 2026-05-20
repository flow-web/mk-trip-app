import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { TripBootstrap } from './trip-bootstrap'
import { BottomTab } from './(nav)/bottom-tab'
import { SideRail } from './(nav)/side-rail'

type TripHeader = Pick<
  Database['public']['Tables']['trips']['Row'],
  'id' | 'trip_type'
>

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = (await supabase
    .from('trips')
    .select('id, trip_type')
    .eq('id', tripId)
    .maybeSingle()) as { data: TripHeader | null }
  if (!trip) notFound()
  return (
    <div className="min-h-screen flex">
      <SideRail tripId={tripId} tripType={trip.trip_type} />
      <div className="flex-1 min-w-0">
        <TripBootstrap tripId={tripId} />
        {children}
      </div>
      <BottomTab tripId={tripId} tripType={trip.trip_type} />
    </div>
  )
}
