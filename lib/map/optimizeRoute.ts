type Profile = 'driving' | 'walking' | 'cycling'

interface Spot {
  id: string
  lat: number
  lng: number
}

export interface OptimizedResult {
  orderedSpotIds: string[]
  coordinates: [number, number][]
  duration: number
  distance: number
}

export async function optimizeRoute(
  spots: Spot[],
  profile: Profile = 'driving',
): Promise<OptimizedResult | null> {
  if (spots.length < 3) return null

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const coords = spots.map((s) => `${s.lng},${s.lat}`).join(';')
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${coords}?geometries=geojson&overview=full&roundtrip=false&source=first&access_token=${token}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const trip = data.trips?.[0]
    if (!trip) return null

    const waypoints: Array<{ waypoint_index: number }> = data.waypoints ?? []
    const orderedSpotIds = waypoints
      .sort((a, b) => a.waypoint_index - b.waypoint_index)
      .map((wp, i) => spots[waypoints.indexOf(wp)]?.id)
      .filter(Boolean) as string[]

    return {
      orderedSpotIds,
      coordinates: trip.geometry.coordinates,
      duration: trip.duration,
      distance: trip.distance,
    }
  } catch {
    return null
  }
}
