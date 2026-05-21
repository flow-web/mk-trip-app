'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { MapPin } from '@/components/design/MapPin'
import type { AccentTokens } from '@/lib/design/tokens'

interface Spot {
  id: string
  name: string
  lat: number
  lng: number
  category: string
}

interface Props {
  accent: AccentTokens
  spots: Spot[]
  activeSpotId?: string | null
}

export function MapView({ accent, spots, activeSpotId }: Props) {
  const center = spots[0] ?? { lat: 38.722, lng: -9.139 }
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude: center.lat,
        longitude: center.lng,
        zoom: 11,
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      {spots.map((spot) => {
        const active = spot.id === activeSpotId
        return (
          <Marker key={spot.id} latitude={spot.lat} longitude={spot.lng}>
            <MapPin color={active ? accent.base : '#1C1A17'} active={active}>
              <span className="text-white text-[10px]">●</span>
            </MapPin>
          </Marker>
        )
      })}
    </Map>
  )
}
