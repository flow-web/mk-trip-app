'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { Map, Source, Layer, NavigationControl } from 'react-map-gl'
import type { ActivityKind } from '@/lib/segments/types'
import { ACTIVITY_COLORS } from '@/lib/segments/types'

interface Props {
  geom: GeoJSON.LineString
  activity: ActivityKind
  liveTrace?: GeoJSON.LineString | null
}

function bboxOf(geom: GeoJSON.LineString) {
  let minLng = 180,
    minLat = 90,
    maxLng = -180,
    maxLat = -90
  for (const [lng, lat] of geom.coordinates) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }
  return { minLng, minLat, maxLng, maxLat }
}

export function SegmentTraceMap({ geom, activity, liveTrace }: Props) {
  const b = bboxOf(geom)
  const cx = (b.minLng + b.maxLng) / 2
  const cy = (b.minLat + b.maxLat) / 2
  const color = ACTIVITY_COLORS[activity]

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ latitude: cy, longitude: cx, zoom: 14 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      <Source id="seg" type="geojson" data={{ type: 'Feature', geometry: geom, properties: {} }}>
        <Layer
          id="seg-line"
          type="line"
          paint={{ 'line-color': color, 'line-width': 5, 'line-opacity': 0.85 }}
        />
      </Source>
      {liveTrace && liveTrace.coordinates.length >= 2 && (
        <Source id="live" type="geojson" data={{ type: 'Feature', geometry: liveTrace, properties: {} }}>
          <Layer
            id="live-line"
            type="line"
            paint={{ 'line-color': '#1C1A17', 'line-width': 4, 'line-dasharray': [2, 1] }}
          />
        </Source>
      )}
    </Map>
  )
}
