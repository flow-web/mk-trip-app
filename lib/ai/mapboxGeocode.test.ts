import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mapboxGeocode } from './mapboxGeocode'

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'fake-token-for-tests'
})

describe('mapboxGeocode', () => {
  it('returns lat/lng + verified:true when Mapbox finds a match', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        features: [
          { geometry: { coordinates: [-9.139, 38.722] } },
        ],
      }), { status: 200 }) as any,
    )
    const result = await mapboxGeocode('Time Out Market, Lisboa')
    expect(result).toEqual({ lat: 38.722, lng: -9.139, verified: true })
  })

  it('returns null when no features are returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ features: [] }), { status: 200 }) as any,
    )
    const result = await mapboxGeocode('nonexistent place 12345')
    expect(result).toBeNull()
  })

  it('returns null on Mapbox HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 500 }) as any,
    )
    const result = await mapboxGeocode('X')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const result = await mapboxGeocode('X')
    expect(result).toBeNull()
  })

  it('encodes the query in the URL', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ features: [] }), { status: 200 }) as any,
    )
    await mapboxGeocode('Café Pedro & Co, São Paulo')
    const calledUrl = spy.mock.calls[0]?.[0] as string
    expect(calledUrl).toContain(encodeURIComponent('Café Pedro & Co, São Paulo'))
  })

  it('returns null and does not call fetch when query is empty', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const result = await mapboxGeocode('')
    expect(result).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })
})
