import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripBootstrap } from './trip-bootstrap'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .maybeSingle()
  if (!trip) notFound()
  return (
    <>
      <TripBootstrap tripId={tripId} />
      {children}
    </>
  )
}
