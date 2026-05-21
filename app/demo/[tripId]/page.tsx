'use client'

import { useParams, notFound } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { HomeClient } from '@/app/trips/[tripId]/home-client'

export default function DemoTripHomePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  if (!trip) return null
  if (!tripId.startsWith('demo-trip-')) {
    notFound()
  }
  return <HomeClient initialTrip={trip as any} tripId={tripId} />
}
