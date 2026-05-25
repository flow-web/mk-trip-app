import { useState, useEffect, useRef } from 'react'

type Profile = 'driving' | 'walking' | 'cycling'

interface Spot {
  id: string
  lat: number
  lng: number
}

export interface RouteLine {
  coordinates: [number, number][]
  duration: number
  distance: number
}

const cache = new Map<string, RouteLine>()

function cacheKey(spots: Spot[], profile: Profile): string {
  const coords = spots.map((s) => `${s.lng},${s.lat}`).join(';')
  return `${profile}:${coords}`
}

async function fetchRoute(spots: Spot[], profile: Profile): Promise<RouteLine | null> {
  if (spots.length < 2) return null

  const key = cacheKey(spots, profile)
  const cached = cache.get(key)
  if (cached) return cached

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const coords = spots.map((s) => `${s.lng},${s.lat}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full&access_token=${token}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null

    const result: RouteLine = {
      coordinates: route.geometry.coordinates,
      duration: route.duration,
      distance: route.distance,
    }
    cache.set(key, result)
    return result
  } catch {
    return null
  }
}

export function useRouteLines(
  spots: Spot[],
  dayId: string | 'all',
  profile: Profile = 'driving',
): { route: RouteLine | null; loading: boolean } {
  const [route, setRoute] = useState<RouteLine | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(0)
  const spotsKey = spots.map((s) => s.id).join(',')

  useEffect(() => {
    if (dayId === 'all' || spots.length < 2) {
      setRoute(null)
      return
    }

    const requestId = ++abortRef.current
    setLoading(true)

    fetchRoute(spots, profile).then((r) => {
      if (abortRef.current === requestId) {
        setRoute(r)
        setLoading(false)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotsKey, dayId, profile])

  return { route, loading }
}
