import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the `ai` package's generateObject before importing the route handler.
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))
// Mock mapboxGeocode so we don't hit the network.
vi.mock('@/lib/ai/mapboxGeocode', () => ({
  mapboxGeocode: vi.fn(),
}))

import { POST } from './route'
import { generateObject } from 'ai'
import { mapboxGeocode } from '@/lib/ai/mapboxGeocode'
import { _resetRateLimit } from '@/lib/ai/rateLimit'

const mockGenerateObject = vi.mocked(generateObject)
const mockMapboxGeocode = vi.mocked(mapboxGeocode)

// Note: zod v4 uses stricter RFC 4122 UUID validation — variant nibble must be 8/9/a/b.
// Use a valid nil UUID (all-zeros) which zod v4 explicitly allows.
const VALID_TRIP_ID = '00000000-0000-0000-0000-000000000000'

function makeReq(body: object): Request {
  return new Request('http://localhost/api/spots/suggest', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  _resetRateLimit()
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'fake'
  process.env.AI_GATEWAY_API_KEY = 'fake-gw-key'
})

describe('POST /api/spots/suggest', () => {
  it('returns 400 if body is invalid', async () => {
    const res = await POST(makeReq({ tripId: 'x' })) // missing required fields + invalid uuid
    expect(res.status).toBe(400)
  })

  it('returns 8 grounded suggestions on the happy path', async () => {
    mockGenerateObject.mockResolvedValue({
      object: Array.from({ length: 8 }, (_, i) => ({
        name: `Spot ${i}`,
        category: 'food',
        description: 'desc',
        address: `addr ${i}`,
      })),
    } as any)
    // Called for destination center + each of the 8 spots
    mockMapboxGeocode.mockResolvedValue({ lat: 38.7, lng: -9.1, verified: true })

    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'Lisbonne',
      tripType: 'city_break',
      excludeNames: [],
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toHaveLength(8)
    expect(body.suggestions[0]).toMatchObject({
      name: 'Spot 0', lat: 38.7, lng: -9.1, mapbox_verified: true,
    })
    expect(body.suggestions[0].id).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('flags suggestions as not verified when Mapbox returns null for spot (uses destination fallback)', async () => {
    mockGenerateObject.mockResolvedValue({
      object: [{ name: 'X', category: 'food', description: 'd', address: 'a' }],
    } as any)
    // First call: destination geocode returns a center; second call: spot geocode returns null
    mockMapboxGeocode
      .mockResolvedValueOnce({ lat: 48.8, lng: 2.3, verified: true }) // destination center
      .mockResolvedValueOnce(null) // spot not found

    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'Paris',
      tripType: 'city_break',
      excludeNames: [],
    }))

    const body = await res.json()
    expect(body.suggestions[0].mapbox_verified).toBe(false)
    // Falls back to destination center, NOT (0, 0)
    expect(body.suggestions[0].lat).toBe(48.8)
    expect(body.suggestions[0].lng).toBe(2.3)
  })

  it('falls back to (0, 0) only when both spot AND destination geocoding fail', async () => {
    mockGenerateObject.mockResolvedValue({
      object: [{ name: 'X', category: 'food', description: 'd', address: 'a' }],
    } as any)
    mockMapboxGeocode.mockResolvedValue(null) // both destination and spot return null

    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'UnknownPlace',
      tripType: 'city_break',
      excludeNames: [],
    }))

    const body = await res.json()
    expect(body.suggestions[0].mapbox_verified).toBe(false)
    expect(body.suggestions[0].lat).toBe(0)
    expect(body.suggestions[0].lng).toBe(0)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockGenerateObject.mockResolvedValue({ object: [] } as any)
    const body = {
      tripId: VALID_TRIP_ID,
      destination: 'X',
      tripType: 'city_break',
      excludeNames: [],
    }
    for (let i = 0; i < 10; i++) await POST(makeReq(body))
    const res = await POST(makeReq(body))
    expect(res.status).toBe(429)
  })

  it('returns 429 with rate_limited_global when the global limit is exceeded', async () => {
    mockGenerateObject.mockResolvedValue({ object: [] } as any)
    mockMapboxGeocode.mockResolvedValue(null)
    // Use 100 distinct tripIds so per-trip limit (10/min) never fires; only global cap (100) applies.
    // Zod v4 requires variant nibble 8/9/a/b in position 19 of the UUID.
    // Template: 00000000-0000-4000-8000-XXXXXXXXXXXX (variant=8, version=4)
    for (let i = 0; i < 100; i++) {
      const suffix = i.toString(16).padStart(12, '0')
      const tripId = `00000000-0000-4000-8000-${suffix}`
      await POST(makeReq({ tripId, destination: 'X', tripType: 'city_break', excludeSpotIds: [] }))
    }
    // 101st request hits the global cap
    const res = await POST(makeReq({
      tripId: '00000000-0000-4000-8001-000000000064',
      destination: 'X',
      tripType: 'city_break',
      excludeNames: [],
    }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('rate_limited_global')
  })

  it('returns 500 when the AI call throws', async () => {
    mockGenerateObject.mockRejectedValue(new Error('AI down'))
    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'X',
      tripType: 'city_break',
      excludeNames: [],
    }))
    expect(res.status).toBe(500)
  })
})
