'use client'

import { useParams, notFound } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { isDemoTripId } from '@/lib/demo/fixtures'
import { SideRail } from '@/app/trips/[tripId]/(nav)/side-rail'
import { BottomTab } from '@/app/trips/[tripId]/(nav)/bottom-tab'

export default function DemoTripLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])

  if (!isDemoTripId(tripId)) {
    notFound()
  }
  if (!trip) {
    return (
      <main className="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center">
        <span className="mk-mono text-xs text-ink-mute dark:text-ink-mute-dark">
          PRÉPARATION…
        </span>
      </main>
    )
  }

  return (
    <div className="min-h-screen flex">
      <SideRail tripId={tripId} tripType={trip.trip_type} basePath="/demo" />
      <div className="flex-1 min-w-0">{children}</div>
      <BottomTab tripId={tripId} tripType={trip.trip_type} basePath="/demo" />
    </div>
  )
}
