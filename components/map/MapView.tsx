'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useMemo, useRef, useEffect } from 'react'
import { Map, Marker, NavigationControl, Source, Layer, type MapRef } from 'react-map-gl'
import { getDayColor } from '@/lib/map/dayColors'
import { CATEGORY_ICONS } from '@/lib/map/categoryIcons'
import type { MapSpot, DayLine, SelectedDayId } from '@/lib/map/spotFilters'

interface Day {
  id: string
  day_number: number | null
}

interface Props {
  spots: MapSpot[]
  days: Day[]
  lines: DayLine[]
  selectedSpotId: string | null
  selectedDayId: SelectedDayId
  onSpotClick: (spotId: string) => void
}

export function MapView({
  spots,
  days,
  lines,
  selectedSpotId,
  selectedDayId,
  onSpotClick,
}: Props) {
  const mapRef = useRef<MapRef | null>(null)

  // Map day_id → index for color lookup
  const dayIndex = useMemo(() => {
    const dayMap = new globalThis.Map<string, number>()
    days.forEach((d, i) => dayMap.set(d.id, i))
    return dayMap
  }, [days])

  // fitBounds when spots change
  useEffect(() => {
    if (!mapRef.current || spots.length === 0) return
    const lats = spots.map((s) => s.lat)
    const lngs = spots.map((s) => s.lng)
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
    mapRef.current.fitBounds([sw, ne], { padding: 50, duration: 800, maxZoom: 15 })
  }, [spots])

  // GeoJSON for lines
  const lineGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: lines.map((line) => {
        const idx = dayIndex.get(line.day_id) ?? 0
        return {
          type: 'Feature' as const,
          properties: { color: getDayColor(idx) },
          geometry: {
            type: 'LineString' as const,
            coordinates: line.coordinates,
          },
        }
      }),
    }),
    [lines, dayIndex],
  )

  const center = spots[0] ?? { lat: 38.722, lng: -9.139 }

  return (
    <Map
      ref={mapRef}
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

      {lines.length > 0 && (
        <Source id="day-lines" type="geojson" data={lineGeoJSON}>
          <Layer
            id="day-lines-layer"
            type="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.6,
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>
      )}

      {spots.map((spot) => {
        const idx = spot.day_id ? dayIndex.get(spot.day_id) ?? 0 : 0
        const color = spot.day_id ? getDayColor(idx) : '#9ca3af' // gray-400 if orphan
        const active = spot.id === selectedSpotId
        const icon = CATEGORY_ICONS[spot.category] ?? '•'
        return (
          <Marker
            key={spot.id}
            latitude={spot.lat}
            longitude={spot.lng}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSpotClick(spot.id)
            }}
          >
            <button
              type="button"
              aria-label={`Spot ${spot.name}`}
              className={`flex items-center justify-center rounded-full border-2 border-white shadow-md transition-transform ${
                active ? 'w-9 h-9 ring-2 ring-white' : 'w-7 h-7 hover:scale-110'
              }`}
              style={{
                background: color,
                transform: active ? 'scale(1.3)' : undefined,
              }}
            >
              <span className="text-[11px] leading-none">{icon}</span>
            </button>
          </Marker>
        )
      })}
    </Map>
  )
}
