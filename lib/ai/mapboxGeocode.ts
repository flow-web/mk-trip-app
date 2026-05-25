export interface GeocodeResult {
  lat: number
  lng: number
  verified: boolean
}

/**
 * Forward-geocode a free-form query using Mapbox Search Geocoding v6.
 * Returns null on any failure (no match, HTTP error, network error).
 *
 * Endpoint docs: https://docs.mapbox.com/api/search/geocoding/
 */
export async function mapboxGeocode(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length === 0) return null

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    console.error('mapboxGeocode: NEXT_PUBLIC_MAPBOX_TOKEN is missing')
    return null
  }

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}` +
    `&access_token=${token}&limit=1`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> }
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords || coords.length !== 2) return null
    const [lng, lat] = coords
    return { lat, lng, verified: true }
  } catch {
    return null
  }
}
