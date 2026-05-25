'use client'

import { useParams } from 'next/navigation'
import { MapShell } from '@/components/map/MapShell'

const MAP_SHELL_V2_ENABLED =
  process.env.NEXT_PUBLIC_MAP_SHELL_V2 === 'true' ||
  process.env.NEXT_PUBLIC_MAP_SHELL_V2 === undefined // default ON, set 'false' for rollback

export default function MapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  if (!MAP_SHELL_V2_ENABLED) {
    return (
      <main className="h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-display font-bold text-xl mb-2">Map en maintenance</h1>
          <p className="text-sm text-ink-mute">
            Réactive la carte v2 avec <code>NEXT_PUBLIC_MAP_SHELL_V2=true</code>.
          </p>
        </div>
      </main>
    )
  }
  return <MapShell tripId={tripId} />
}
