'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { ACTIVITY_COLORS } from '@/lib/segments/types'
import type { SegmentPublic } from '@/lib/segments/queries'

interface Props {
  segments: SegmentPublic[]
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
      {segments.map((s) => {
        const active = s.id === selectedId
        return (
          <Marker
            key={s.id}
            latitude={s.start_lat}
            longitude={s.start_lng}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSelect?.(s.id)
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer transition"
              style={{
                background: ACTIVITY_COLORS[s.activity],
                transform: active ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </Marker>
        )
      })}
    </Map>
  )
}
