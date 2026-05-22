'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, NavigationControl } from 'react-map-gl'
import type { SegmentWithStats } from '@/lib/segments/queries'

interface Props {
  segments: SegmentWithStats[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  onMove?: (bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void
  initialCenter?: { lat: number; lng: number; zoom?: number }
}

export function SegmentMap({ segments, selectedId, onSelect, onMove, initialCenter }: Props) {
  const center = initialCenter ?? { lat: 46.5, lng: 2.5, zoom: 5 }
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude: center.lat,
        longitude: center.lng,
        zoom: center.zoom ?? 5,
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
      onMoveEnd={(e) => {
        if (!onMove) return
        const b = e.target.getBounds()
        if (!b) return
        onMove({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        })
      }}
    >
      <NavigationControl position="top-right" />
      {segments.map(() => {
        // Pins ajoutés en Task 12 quand la vue PostGIS expose start_lng/start_lat
        return null
      })}
    </Map>
  )
}
