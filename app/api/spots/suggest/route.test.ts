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
    mockMapboxGeocode.mockResolvedValue({ lat: 38.7, lng: -9.1, verified: true })

    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'Lisbonne',
      tripType: 'city_break',
      excludeSpotIds: [],
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.suggestions).toHaveLength(8)
    expect(body.suggestions[0]).toMatchObject({
      name: 'Spot 0', lat: 38.7, lng: -9.1, mapbox_verified: true,
    })
    expect(body.suggestions[0].id).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('flags suggestions as not verified when Mapbox returns null', async () => {
    mockGenerateObject.mockResolvedValue({
      object: [{ name: 'X', category: 'food', description: 'd', address: 'a' }],
    } as any)
    mockMapboxGeocode.mockResolvedValue(null)

    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'X',
      tripType: 'city_break',
      excludeSpotIds: [],
    }))

    const body = await res.json()
    expect(body.suggestions[0].mapbox_verified).toBe(false)
    expect(typeof body.suggestions[0].lat).toBe('number')
    expect(typeof body.suggestions[0].lng).toBe('number')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockGenerateObject.mockResolvedValue({ object: [] } as any)
    const body = {
      tripId: VALID_TRIP_ID,
      destination: 'X',
      tripType: 'city_break',
      excludeSpotIds: [],
    }
    for (let i = 0; i < 10; i++) await POST(makeReq(body))
    const res = await POST(makeReq(body))
    expect(res.status).toBe(429)
  })

  it('returns 500 when the AI call throws', async () => {
    mockGenerateObject.mockRejectedValue(new Error('AI down'))
    const res = await POST(makeReq({
      tripId: VALID_TRIP_ID,
      destination: 'X',
      tripType: 'city_break',
      excludeSpotIds: [],
    }))
    expect(res.status).toBe(500)
  })
})
