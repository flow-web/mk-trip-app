import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomeClient } from './home-client'

export default async function HomePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle()
  if (!trip) notFound()
  return <HomeClient initialTrip={trip} tripId={tripId} />
}
