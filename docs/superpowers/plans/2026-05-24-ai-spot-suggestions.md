# AI Spot Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Première vraie UI d'ajout de spot dans MK Trip via suggestions IA contextualisées (`anthropic/claude-haiku-4-5` via Vercel AI Gateway), avec grounding Mapbox Search pour valider les coords. 3 triggers : auto-mount voyage vide / bouton sheet / bouton jour vide.

**Architecture:** Endpoint Next.js `POST /api/spots/suggest` qui chaîne `generateObject(schema Zod)` puis batch `mapboxGeocode()` en parallèle, retourne 8 suggestions. Côté client : composant `AISuggestionsPanel` Vaul overlay qui rend la liste avec checkboxes multi-select, puis `db.spots.add()` × N + sync queue existante pour l'acceptation. État dismissal local en Dexie sur `LocalTrip`.

**Tech Stack:** Next.js 16 App Router · Vercel AI Gateway (string `anthropic/claude-haiku-4-5`) · AI SDK 6 (`ai` package, `generateObject`) · Zod 3 · Mapbox Search Forward Geocoding · Dexie 4 · Vitest 4 + @testing-library + fetch mocks · Playwright (déjà installé sous-projet A)

**Spec:** `docs/superpowers/specs/2026-05-24-ai-spot-suggestions-design.md`
**Branche:** `feat/ai-spot-suggestions` (branchée depuis `feat/map-shell-v2`)

---

## Table des tâches

| # | Tâche | Type | Estimation |
|---|---|---|---|
| 1 | Install AI SDK + Zod + env setup | Setup | 30 min |
| 2 | `lib/ai/suggestSpotsSchema.ts` (Zod) + tests TDD | Pure logic | 30 min |
| 3 | `lib/ai/suggestSpotsPrompt.ts` (build prompt) + tests TDD | Pure logic | 45 min |
| 4 | `lib/ai/mapboxGeocode.ts` (wrapper Mapbox Search) + tests | API wrapper | 1 h |
| 5 | `lib/ai/rateLimit.ts` (in-memory limiter) + tests TDD | Pure logic | 30 min |
| 6 | `app/api/spots/suggest/route.ts` (endpoint) + tests | API integration | 1 h 30 |
| 7 | `components/ai/AISuggestionCard.tsx` + tests | UI | 45 min |
| 8 | `components/ai/AISuggestionsPanel.tsx` + tests | UI | 1 h 30 |
| 9 | Trigger 1 : auto-mount voyage vide + dismiss flag | Integration | 1 h |
| 10 | Trigger 2 : bouton "Suggérer" dans MapSpotSheet | Integration | 30 min |
| 11 | Trigger 3 : placeholder jour vide | Integration | 30 min |
| 12 | E2E Playwright (5 scénarios) | Tests | 1 h 30 |
| 13 | Acceptance + push + PR | Validation | 30 min |

**Total estimé : ~11h focused → 4-5 jours calendaires en réel.**

---

### Task 1: Install AI SDK + Zod + env setup

**Files:**
- Modify: `package.json` (deps)
- Modify: `.env.example` (ajouter `AI_GATEWAY_API_KEY`)

- [ ] **Step 1.1: Install deps**

```bash
cd "C:/Users/flori/Desktop/PROJETS DEV/mk-trip-app"
npm install ai zod
```

Expected: `ai@^6.x.x` and `zod@^3.x.x` added to dependencies.

NOTE: Per Vercel session knowledge update, we do NOT install `@ai-sdk/anthropic` — we use plain `"provider/model"` strings through Vercel AI Gateway. The `ai` package alone is sufficient.

- [ ] **Step 1.2: Update .env.example**

Read current `.env.example` and append:

```
# Vercel AI Gateway (auto-injected in Vercel preview/prod via OIDC; required locally)
AI_GATEWAY_API_KEY=YOUR_AI_GATEWAY_KEY
```

- [ ] **Step 1.3: Verify install succeeded**

```bash
npx tsc --noEmit 2>&1 | grep -E "(ai|zod)" || echo "OK no errors"
```

Expected: `OK no errors` (the install added types, nothing should break).

Test that the package imports work:

```bash
node -e "const { generateObject } = require('ai'); console.log(typeof generateObject)"
```

Expected: `function`

- [ ] **Step 1.4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(ai): installer ai v6 + zod + ajouter AI_GATEWAY_API_KEY à .env.example"
```

---

### Task 2: `lib/ai/suggestSpotsSchema.ts` (Zod schema) + tests TDD

**Files:**
- Create: `lib/ai/suggestSpotsSchema.ts`
- Test: `lib/ai/suggestSpotsSchema.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `lib/ai/suggestSpotsSchema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { rawSuggestionSchema, rawSuggestionsArraySchema, SPOT_CATEGORIES } from './suggestSpotsSchema'

describe('rawSuggestionSchema', () => {
  it('accepts a valid suggestion', () => {
    const valid = {
      name: 'Time Out Market',
      category: 'food',
      description: 'Food hall iconique de Lisbonne',
      address: 'Av. 24 de Julho, Lisboa',
    }
    expect(rawSuggestionSchema.parse(valid)).toEqual(valid)
  })

  it('rejects a suggestion with invalid category', () => {
    const invalid = {
      name: 'X',
      category: 'invalid',
      description: 'desc',
      address: 'addr',
    }
    expect(() => rawSuggestionSchema.parse(invalid)).toThrow()
  })

  it('rejects a suggestion missing required fields', () => {
    expect(() => rawSuggestionSchema.parse({ name: 'X' })).toThrow()
  })

  it('rejects a suggestion with empty name', () => {
    const invalid = {
      name: '',
      category: 'food',
      description: 'desc',
      address: 'addr',
    }
    expect(() => rawSuggestionSchema.parse(invalid)).toThrow()
  })

  it('SPOT_CATEGORIES contains exactly the 7 enum values', () => {
    expect(SPOT_CATEGORIES).toEqual([
      'food', 'culture', 'nightlife', 'nature', 'accommodation', 'activity', 'sport',
    ])
  })
})

describe('rawSuggestionsArraySchema', () => {
  const validItem = {
    name: 'X', category: 'food', description: 'd', address: 'a',
  }

  it('accepts an array of 8 valid suggestions', () => {
    const arr = Array.from({ length: 8 }, () => validItem)
    expect(rawSuggestionsArraySchema.parse(arr)).toHaveLength(8)
  })

  it('accepts arrays from 1 to 12 items', () => {
    expect(rawSuggestionsArraySchema.parse([validItem])).toHaveLength(1)
    const twelve = Array.from({ length: 12 }, () => validItem)
    expect(rawSuggestionsArraySchema.parse(twelve)).toHaveLength(12)
  })

  it('rejects an empty array', () => {
    expect(() => rawSuggestionsArraySchema.parse([])).toThrow()
  })

  it('rejects more than 12 items', () => {
    const thirteen = Array.from({ length: 13 }, () => validItem)
    expect(() => rawSuggestionsArraySchema.parse(thirteen)).toThrow()
  })
})
```

- [ ] **Step 2.2: Run tests, verify FAIL**

```bash
npm test -- --run lib/ai/suggestSpotsSchema.test.ts
```

Expected: FAIL with "Cannot find module './suggestSpotsSchema'".

- [ ] **Step 2.3: Implement the schema**

Create `lib/ai/suggestSpotsSchema.ts`:

```typescript
import { z } from 'zod'

export const SPOT_CATEGORIES = [
  'food', 'culture', 'nightlife', 'nature', 'accommodation', 'activity', 'sport',
] as const

export const rawSuggestionSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(SPOT_CATEGORIES),
  description: z.string().min(1).max(300),
  address: z.string().min(1).max(200),
})

export type RawSuggestion = z.infer<typeof rawSuggestionSchema>

export const rawSuggestionsArraySchema = z
  .array(rawSuggestionSchema)
  .min(1, 'Expected at least 1 suggestion')
  .max(12, 'Expected at most 12 suggestions')

// Final type returned by the API route (after Mapbox grounding)
export interface AISuggestion extends RawSuggestion {
  id: string                 // UUID temp côté serveur (non persisté tant que pas accepté)
  lat: number
  lng: number
  mapbox_verified: boolean
}
```

- [ ] **Step 2.4: Run tests, verify PASS**

```bash
npm test -- --run lib/ai/suggestSpotsSchema.test.ts
```

Expected: 9 tests PASS.

- [ ] **Step 2.5: Commit**

```bash
git add lib/ai/suggestSpotsSchema.ts lib/ai/suggestSpotsSchema.test.ts
git commit -m "feat(ai): Zod schema pour suggestions IA spots + types"
```

---

### Task 3: `lib/ai/suggestSpotsPrompt.ts` (build prompt) + tests TDD

**Files:**
- Create: `lib/ai/suggestSpotsPrompt.ts`
- Test: `lib/ai/suggestSpotsPrompt.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `lib/ai/suggestSpotsPrompt.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildPrompt } from './suggestSpotsPrompt'

describe('buildPrompt', () => {
  it('includes destination and tripType in the prompt', () => {
    const p = buildPrompt({
      destination: 'Lisbonne',
      tripType: 'city_break',
      count: 8,
      excludeNames: [],
    })
    expect(p).toContain('Lisbonne')
    expect(p).toContain('city_break')
    expect(p).toContain('8')
  })

  it('requests JSON output with the expected fields', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
    })
    expect(p).toContain('name')
    expect(p).toContain('category')
    expect(p).toContain('description')
    expect(p).toContain('address')
  })

  it('mentions the 7 allowed categories', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
    })
    expect(p).toMatch(/food.+culture.+nightlife.+nature.+accommodation.+activity.+sport/s)
  })

  it('includes excludeNames in the prompt when provided', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8,
      excludeNames: ['Castelo', 'Time Out'],
    })
    expect(p).toContain('Castelo')
    expect(p).toContain('Time Out')
  })

  it('does not mention excludeNames section when list is empty', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
    })
    expect(p.toLowerCase()).not.toContain('exclude')
  })

  it('includes dayContext when provided', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
      dayContext: 'Jour 2 — Belém',
    })
    expect(p).toContain('Jour 2 — Belém')
  })

  it('includes promptHint when provided and escapes it safely', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
      promptHint: 'plus food de rue',
    })
    expect(p).toContain('plus food de rue')
  })

  it('truncates promptHint longer than 200 chars', () => {
    const long = 'a'.repeat(500)
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
      promptHint: long,
    })
    // Should contain at most 200 'a' in a row
    expect(p).not.toMatch(/a{201}/)
  })

  it('asks for diversity of categories', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
    })
    expect(p.toLowerCase()).toContain('vari')
  })
})
```

- [ ] **Step 3.2: Run tests, verify FAIL**

```bash
npm test -- --run lib/ai/suggestSpotsPrompt.test.ts
```

Expected: FAIL "Cannot find module './suggestSpotsPrompt'".

- [ ] **Step 3.3: Implement the prompt builder**

Create `lib/ai/suggestSpotsPrompt.ts`:

```typescript
export interface BuildPromptInput {
  destination: string
  tripType: string
  count: number
  excludeNames: string[]
  dayContext?: string
  promptHint?: string
}

export function buildPrompt(input: BuildPromptInput): string {
  const { destination, tripType, count, excludeNames, dayContext, promptHint } = input

  const hint = promptHint ? promptHint.slice(0, 200) : undefined

  const exclusion = excludeNames.length > 0
    ? `\nEXCLUSIONS — N'incluez aucun de ces lieux déjà connus :\n${excludeNames.map((n) => `- ${n}`).join('\n')}\n`
    : ''

  const dayLine = dayContext ? `\nContexte du jour : ${dayContext}` : ''

  const hintLine = hint ? `\nDirective utilisateur : ${hint}` : ''

  return `Tu es un guide local expert pour la destination "${destination}" (type de voyage : ${tripType}).${dayLine}${hintLine}

Propose ${count} spots/lieux à visiter. Varie les catégories pour offrir un panel équilibré (au moins 3 catégories différentes si possible).

Catégories autorisées (utilise EXACTEMENT ces valeurs) :
food, culture, nightlife, nature, accommodation, activity, sport

Pour chaque spot, renseigne :
- name : nom officiel et reconnaissable du lieu (string, ≤ 120 chars)
- category : l'une des 7 catégories ci-dessus
- description : 1-2 phrases qui expliquent pourquoi c'est intéressant (français, ≤ 300 chars)
- address : adresse postale ou repère géographique permettant un géocodage (≤ 200 chars)
${exclusion}
Priorité : lieux réels et notables. Évite les inventions.`
}
```

- [ ] **Step 3.4: Run tests, verify PASS**

```bash
npm test -- --run lib/ai/suggestSpotsPrompt.test.ts
```

Expected: 9 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
git add lib/ai/suggestSpotsPrompt.ts lib/ai/suggestSpotsPrompt.test.ts
git commit -m "feat(ai): buildPrompt pour suggestions IA spots (TDD)"
```

---

### Task 4: `lib/ai/mapboxGeocode.ts` + tests

**Files:**
- Create: `lib/ai/mapboxGeocode.ts`
- Test: `lib/ai/mapboxGeocode.test.ts`

- [ ] **Step 4.1: Write the failing test**

Create `lib/ai/mapboxGeocode.test.ts`:

```typescript
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
```

- [ ] **Step 4.2: Run tests, verify FAIL**

```bash
npm test -- --run lib/ai/mapboxGeocode.test.ts
```

Expected: FAIL "Cannot find module './mapboxGeocode'".

- [ ] **Step 4.3: Implement the wrapper**

Create `lib/ai/mapboxGeocode.ts`:

```typescript
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
```

NOTE: Mapbox Search Geocoding v6 endpoint URL : `/search/geocode/v6/forward` (not v5's `/geocoding/v5/mapbox.places/{q}.json`). If you find the v6 endpoint returns 404 in testing, fall back to v5 URL format — adjust accordingly and note it in your report.

- [ ] **Step 4.4: Run tests, verify PASS**

```bash
npm test -- --run lib/ai/mapboxGeocode.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 4.5: Commit**

```bash
git add lib/ai/mapboxGeocode.ts lib/ai/mapboxGeocode.test.ts
git commit -m "feat(ai): wrapper mapboxGeocode (Forward Geocoding v6) + tests fetch mock"
```

---

### Task 5: `lib/ai/rateLimit.ts` (in-memory) + tests TDD

**Files:**
- Create: `lib/ai/rateLimit.ts`
- Test: `lib/ai/rateLimit.test.ts`

NOTE: Vercel Functions can have multiple concurrent instances. An in-memory rate limit is a soft safeguard, not a hard guarantee. It's sufficient for MVP abuse prevention; a real distributed rate limit (Upstash etc.) is a follow-up.

- [ ] **Step 5.1: Write the failing test**

Create `lib/ai/rateLimit.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, _resetRateLimit } from './rateLimit'

beforeEach(() => {
  _resetRateLimit()
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    expect(checkRateLimit('key1')).toBe(true)
  })

  it('allows up to MAX_REQUESTS in the window', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('key1')).toBe(true)
    }
  })

  it('blocks the 11th request in the same minute', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('key1')
    expect(checkRateLimit('key1')).toBe(false)
  })

  it('isolates per key', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('keyA')
    expect(checkRateLimit('keyA')).toBe(false)
    expect(checkRateLimit('keyB')).toBe(true)
  })

  it('resets the counter after the window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T10:00:00Z'))
    for (let i = 0; i < 10; i++) checkRateLimit('key1')
    expect(checkRateLimit('key1')).toBe(false)

    vi.setSystemTime(new Date('2026-05-24T10:01:30Z')) // +90 seconds
    expect(checkRateLimit('key1')).toBe(true)
  })
})
```

- [ ] **Step 5.2: Run tests, verify FAIL**

```bash
npm test -- --run lib/ai/rateLimit.test.ts
```

Expected: FAIL "Cannot find module './rateLimit'".

- [ ] **Step 5.3: Implement the rate limiter**

Create `lib/ai/rateLimit.ts`:

```typescript
const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 10

const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Soft in-memory rate limit per key. Returns true if the request is allowed,
 * false if the limit is exceeded.
 *
 * NOTE: Vercel Functions can have multiple concurrent instances; this is a
 * best-effort safeguard, not a distributed guarantee. Replace with Upstash
 * Redis if hard rate limiting becomes necessary.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false
  }

  bucket.count += 1
  return true
}

// Test helper — not exported in production usage.
export function _resetRateLimit(): void {
  buckets.clear()
}
```

- [ ] **Step 5.4: Run tests, verify PASS**

```bash
npm test -- --run lib/ai/rateLimit.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5.5: Commit**

```bash
git add lib/ai/rateLimit.ts lib/ai/rateLimit.test.ts
git commit -m "feat(ai): rate limit en mémoire (10 req/min) pour protéger l'endpoint AI"
```

---

### Task 6: `app/api/spots/suggest/route.ts` (endpoint) + tests

**Files:**
- Create: `app/api/spots/suggest/route.ts`
- Test: `app/api/spots/suggest/route.test.ts`

- [ ] **Step 6.1: Write the failing test**

Create `app/api/spots/suggest/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the `ai` package's generateObject before importing the route handler.
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))
// Mock mapboxGeocode so we don't hit the network.
vi.mock('@/lib/ai/mapboxGeocode', () => ({
  mapboxGeocode: vi.fn(),
}))
// Reset rate limit between tests
vi.mock('@/lib/ai/rateLimit', async (orig) => {
  const actual = await orig() as any
  return { ...actual }
})

import { POST } from './route'
import { generateObject } from 'ai'
import { mapboxGeocode } from '@/lib/ai/mapboxGeocode'
import { _resetRateLimit } from '@/lib/ai/rateLimit'

const mockGenerateObject = vi.mocked(generateObject)
const mockMapboxGeocode = vi.mocked(mapboxGeocode)

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
    const res = await POST(makeReq({ tripId: 'x' })) // missing required fields
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
      tripId: 't1', destination: 'Lisbonne', tripType: 'city_break',
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
      tripId: 't1', destination: 'X', tripType: 'city_break', excludeSpotIds: [],
    }))

    const body = await res.json()
    expect(body.suggestions[0].mapbox_verified).toBe(false)
    expect(typeof body.suggestions[0].lat).toBe('number')
    expect(typeof body.suggestions[0].lng).toBe('number')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockGenerateObject.mockResolvedValue({ object: [] } as any)
    const body = {
      tripId: 't1', destination: 'X', tripType: 'city_break', excludeSpotIds: [],
    }
    for (let i = 0; i < 10; i++) await POST(makeReq(body))
    const res = await POST(makeReq(body))
    expect(res.status).toBe(429)
  })

  it('returns 500 when the AI call throws', async () => {
    mockGenerateObject.mockRejectedValue(new Error('AI down'))
    const res = await POST(makeReq({
      tripId: 't1', destination: 'X', tripType: 'city_break', excludeSpotIds: [],
    }))
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 6.2: Run tests, verify FAIL**

```bash
npm test -- --run app/api/spots/suggest/route.test.ts
```

Expected: FAIL "Cannot find module './route'".

- [ ] **Step 6.3: Implement the route handler**

Create `app/api/spots/suggest/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { rawSuggestionsArraySchema, type RawSuggestion, type AISuggestion } from '@/lib/ai/suggestSpotsSchema'
import { buildPrompt } from '@/lib/ai/suggestSpotsPrompt'
import { mapboxGeocode } from '@/lib/ai/mapboxGeocode'
import { checkRateLimit } from '@/lib/ai/rateLimit'

const requestSchema = z.object({
  tripId: z.string().uuid(),
  destination: z.string().min(1).max(120),
  tripType: z.enum(['city_break', 'road_trip', 'sport', 'hike', 'beach', 'other']),
  dayId: z.string().uuid().optional(),
  promptHint: z.string().max(200).optional(),
  excludeSpotIds: z.array(z.string()).default([]),
})

const COUNT_PER_BATCH = 8
const MODEL_ID = 'anthropic/claude-haiku-4-5'

export async function POST(req: Request): Promise<NextResponse> {
  // Parse + validate body
  let parsed
  try {
    const json = await req.json()
    parsed = requestSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Rate limit per tripId (proxy for user; full user identity would need auth)
  const rlKey = `trip:${parsed.tripId}`
  if (!checkRateLimit(rlKey)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // Build prompt; for now excludeNames is just excludeSpotIds (no resolved names yet)
  // Future improvement: client could pass names instead of IDs.
  const prompt = buildPrompt({
    destination: parsed.destination,
    tripType: parsed.tripType,
    count: COUNT_PER_BATCH,
    excludeNames: parsed.excludeSpotIds, // best-effort; usually empty on first call
    dayContext: parsed.dayId ? `Jour ID ${parsed.dayId}` : undefined,
    promptHint: parsed.promptHint,
  })

  // Call AI
  let raw: RawSuggestion[]
  try {
    const result = await generateObject({
      model: MODEL_ID,
      schema: rawSuggestionsArraySchema,
      prompt,
    })
    raw = result.object
  } catch (err) {
    console.error('AI call failed', err)
    return NextResponse.json({ error: 'ai_failed' }, { status: 500 })
  }

  // Ground each suggestion with Mapbox in parallel
  const grounded: AISuggestion[] = await Promise.all(
    raw.map(async (r): Promise<AISuggestion> => {
      const geo = await mapboxGeocode(`${r.name}, ${r.address}`)
      return {
        id: crypto.randomUUID(),
        ...r,
        lat: geo?.lat ?? 0,
        lng: geo?.lng ?? 0,
        mapbox_verified: geo !== null,
      }
    }),
  )

  return NextResponse.json({ suggestions: grounded }, { status: 200 })
}
```

NOTE: This route does not currently require auth (an authenticated session). RLS protects writes when the client persists. For MVP, anyone with the public URL can call the endpoint; the rate limit per tripId is the only abuse guardrail. Real auth check is a follow-up.

- [ ] **Step 6.4: Update vitest config to include the route test path**

The current `vitest.config.ts` only includes `lib/**/*.test.ts`, `lib/**/*.test.tsx`, `components/**/*.test.tsx`. Add `app/**/*.test.ts` to the includes list.

Read `vitest.config.ts` and update the `include` array:

```typescript
include: [
  'lib/**/*.test.ts',
  'lib/**/*.test.tsx',
  'components/**/*.test.tsx',
  'app/**/*.test.ts',
],
```

- [ ] **Step 6.5: Run tests, verify PASS**

```bash
npm test -- --run app/api/spots/suggest/route.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 6.6: Commit**

```bash
git add app/api/spots/suggest/route.ts app/api/spots/suggest/route.test.ts vitest.config.ts
git commit -m "feat(ai): endpoint POST /api/spots/suggest + tests (mock AI + Mapbox)"
```

---

### Task 7: `components/ai/AISuggestionCard.tsx` + tests

**Files:**
- Create: `components/ai/AISuggestionCard.tsx`
- Test: `components/ai/AISuggestionCard.test.tsx`

- [ ] **Step 7.1: Write the failing test**

Create `components/ai/AISuggestionCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AISuggestionCard } from './AISuggestionCard'

const suggestion = {
  id: 'sug-1',
  name: 'Time Out Market',
  category: 'food' as const,
  description: 'Food hall iconique de Lisbonne',
  address: 'Av. 24 de Julho, Lisboa',
  lat: 38.7,
  lng: -9.1,
  mapbox_verified: true,
}

describe('AISuggestionCard', () => {
  it('renders the name, category, and description', () => {
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    expect(screen.getByText('Time Out Market')).toBeInTheDocument()
    expect(screen.getByText(/food/i)).toBeInTheDocument()
    expect(screen.getByText(/iconique/i)).toBeInTheDocument()
  })

  it('shows the verified badge when mapbox_verified is true', () => {
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    expect(screen.getByLabelText(/v[ée]rifi[ée]/i)).toBeInTheDocument()
  })

  it('shows an unverified badge when mapbox_verified is false', () => {
    render(
      <AISuggestionCard
        suggestion={{ ...suggestion, mapbox_verified: false }}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByLabelText(/approx/i)).toBeInTheDocument()
  })

  it('reflects the selected state via aria-checked', () => {
    const { rerender } = render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    const card = screen.getByRole('checkbox')
    expect(card).toHaveAttribute('aria-checked', 'false')
    rerender(
      <AISuggestionCard suggestion={suggestion} selected={true} onToggle={() => {}} />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggle with the suggestion id when clicked', async () => {
    const onToggle = vi.fn()
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={onToggle} />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('sug-1')
  })
})
```

- [ ] **Step 7.2: Run tests, verify FAIL**

```bash
npm test -- --run components/ai/AISuggestionCard.test.tsx
```

Expected: FAIL "Cannot find module './AISuggestionCard'".

- [ ] **Step 7.3: Implement the card**

Create `components/ai/AISuggestionCard.tsx`:

```typescript
'use client'

import { CATEGORY_ICONS } from '@/lib/map/categoryIcons'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'

interface Props {
  suggestion: AISuggestion
  selected: boolean
  onToggle: (id: string) => void
}

export function AISuggestionCard({ suggestion, selected, onToggle }: Props) {
  const icon = CATEGORY_ICONS[suggestion.category] ?? '•'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(suggestion.id)}
      className={`w-full flex items-start gap-3 py-3 text-left transition ${
        selected ? 'bg-hairline/40' : 'hover:bg-hairline/20'
      } px-3 rounded-md`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
          selected ? 'bg-black border-black text-white' : 'border-hairline-strong'
        }`}
        aria-hidden
      >
        {selected ? '✓' : ''}
      </div>
      <div className="w-8 h-8 rounded-xs bg-hairline/40 flex items-center justify-center text-base shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate">{suggestion.name}</div>
          {suggestion.mapbox_verified ? (
            <span
              className="text-[10px] text-emerald-600"
              aria-label="vérifié"
              title="Coordonnées vérifiées par Mapbox"
            >
              ✓
            </span>
          ) : (
            <span
              className="text-[10px] text-amber-600"
              aria-label="coords approximatives"
              title="Coordonnées approximatives — à vérifier"
            >
              ⚠
            </span>
          )}
        </div>
        <div className="mk-mono text-[10px] text-ink-mute dark:text-ink-mute-dark mt-0.5">
          {suggestion.category.toUpperCase()}
        </div>
        <div className="text-xs text-ink-mute dark:text-ink-mute-dark mt-1 leading-snug">
          {suggestion.description}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 7.4: Run tests, verify PASS**

```bash
npm test -- --run components/ai/AISuggestionCard.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 7.5: Commit**

```bash
git add components/ai/AISuggestionCard.tsx components/ai/AISuggestionCard.test.tsx
git commit -m "feat(ai): composant AISuggestionCard (checkbox + badge grounding)"
```

---

### Task 8: `components/ai/AISuggestionsPanel.tsx` + tests

**Files:**
- Create: `components/ai/AISuggestionsPanel.tsx`
- Test: `components/ai/AISuggestionsPanel.test.tsx`

- [ ] **Step 8.1: Write the failing test**

Create `components/ai/AISuggestionsPanel.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AISuggestionsPanel } from './AISuggestionsPanel'

const mockSuggestion = (id: string, name: string) => ({
  id, name, category: 'food', description: 'desc', address: 'addr',
  lat: 1, lng: 1, mapbox_verified: true,
})

function mockFetchOK(suggestions: any[]) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ suggestions }), { status: 200 }) as any,
  )
}

function mockFetchError(status: number) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('err', { status }) as any,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AISuggestionsPanel', () => {
  it('shows loading state initially then renders suggestions', async () => {
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="Lisbonne" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    expect(screen.getByText(/r[ée]fl[ée]chit/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('shows an error state when fetch fails', async () => {
    mockFetchError(500)
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /r[ée]essayer/i })).toBeInTheDocument()
  })

  it('disables the add button when no item is selected', async () => {
    mockFetchOK([mockSuggestion('s1', 'A')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    const addBtn = screen.getByRole('button', { name: /ajouter/i })
    expect(addBtn).toBeDisabled()
  })

  it('enables the add button and shows the count when items are selected', async () => {
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('checkbox', { name: /A/ }))
    const addBtn = screen.getByRole('button', { name: /ajouter 1/i })
    expect(addBtn).toBeEnabled()
  })

  it('calls onAccept with the selected suggestions when add is clicked', async () => {
    const onAccept = vi.fn()
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={onAccept}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('checkbox', { name: /A/ }))
    await userEvent.click(screen.getByRole('button', { name: /ajouter 1/i }))
    expect(onAccept).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 's1', name: 'A' })],
    )
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    mockFetchOK([mockSuggestion('s1', 'A')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={onClose} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('re-fetches with the prompt hint when the refresh button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ suggestions: [mockSuggestion('s1', 'A')] }), { status: 200 }) as any,
    )
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.type(screen.getByPlaceholderText(/guide-moi/i), 'plus food rue')
    await userEvent.click(screen.getByRole('button', { name: /r[ée]g[ée]n[ée]rer/i }))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
    const secondCallBody = JSON.parse((fetchSpy.mock.calls[1]?.[1] as RequestInit).body as string)
    expect(secondCallBody.promptHint).toBe('plus food rue')
  })
})
```

- [ ] **Step 8.2: Run tests, verify FAIL**

```bash
npm test -- --run components/ai/AISuggestionsPanel.test.tsx
```

Expected: FAIL "Cannot find module './AISuggestionsPanel'".

- [ ] **Step 8.3: Implement the panel**

Create `components/ai/AISuggestionsPanel.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Drawer } from 'vaul'
import { AISuggestionCard } from './AISuggestionCard'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'

interface Props {
  tripId: string
  destination: string
  tripType: 'city_break' | 'road_trip' | 'sport' | 'hike' | 'beach' | 'other'
  excludeSpotIds: string[]
  dayId: string | null
  onClose: () => void
  onAccept: (selected: AISuggestion[]) => void
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'results'; suggestions: AISuggestion[] }

export function AISuggestionsPanel({
  tripId, destination, tripType, excludeSpotIds, dayId, onClose, onAccept,
}: Props) {
  const [state, setState] = useState<FetchState>({ kind: 'loading' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promptHint, setPromptHint] = useState('')

  const doFetch = useCallback(async (hint?: string) => {
    setState({ kind: 'loading' })
    setSelectedIds(new Set())
    try {
      const res = await fetch('/api/spots/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tripId, destination, tripType, dayId: dayId ?? undefined,
          promptHint: hint || undefined,
          excludeSpotIds,
        }),
      })
      if (!res.ok) {
        setState({ kind: 'error', message: `HTTP ${res.status}` })
        return
      }
      const body = await res.json() as { suggestions: AISuggestion[] }
      setState({ kind: 'results', suggestions: body.suggestions })
    } catch (err) {
      setState({ kind: 'error', message: String(err) })
    }
  }, [tripId, destination, tripType, dayId, excludeSpotIds])

  useEffect(() => { doFetch() }, [doFetch])

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAccept = () => {
    if (state.kind !== 'results') return
    const selected = state.suggestions.filter((s) => selectedIds.has(s.id))
    onAccept(selected)
  }

  const selectedCount = selectedIds.size
  const headerLabel = dayId
    ? `Suggestions IA · jour sélectionné`
    : `Suggestions IA pour ${destination}`

  return (
    <Drawer.Root open onOpenChange={(o) => !o && onClose()} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white dark:bg-paper-dark-deep rounded-t-[20px] outline-none shadow-2xl flex flex-col">
          <div className="w-[38px] h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-3.5" />
          <Drawer.Title className="sr-only">{headerLabel}</Drawer.Title>

          <div className="px-5 pb-3 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="mk-mono text-[10px] uppercase tracking-wider text-ink-mute dark:text-ink-mute-dark mb-1">
                ✨ Claude Haiku
              </div>
              <h2 className="font-display font-bold text-lg truncate">{headerLabel}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-full bg-hairline/40 flex items-center justify-center text-lg shrink-0"
            >
              ×
            </button>
          </div>

          <div className="px-5 pb-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={promptHint}
              onChange={(e) => setPromptHint(e.target.value)}
              placeholder="Guide-moi : plus food de rue, moins touristique..."
              maxLength={200}
              className="flex-1 px-3 py-2 text-xs rounded-md bg-hairline/30 outline-none focus:bg-hairline/50"
            />
            <button
              type="button"
              onClick={() => doFetch(promptHint)}
              aria-label="Régénérer"
              className="w-9 h-9 rounded-md bg-hairline/40 flex items-center justify-center text-sm"
              disabled={state.kind === 'loading'}
            >
              ↻
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 mk-noscroll">
            {state.kind === 'loading' && (
              <div className="px-5 py-12 text-center text-sm text-ink-mute dark:text-ink-mute-dark">
                <div className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
                <div>Claude réfléchit...</div>
              </div>
            )}
            {state.kind === 'error' && (
              <div className="px-5 py-12 text-center text-sm">
                <div className="text-red-600 mb-3">Erreur : {state.message}</div>
                <button
                  type="button"
                  onClick={() => doFetch(promptHint)}
                  className="px-4 py-2 bg-hairline/40 rounded-md text-xs"
                >
                  Réessayer
                </button>
              </div>
            )}
            {state.kind === 'results' && state.suggestions.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-ink-mute dark:text-ink-mute-dark">
                Aucune suggestion. Change le prompt et réessaie.
              </div>
            )}
            {state.kind === 'results' && state.suggestions.map((s) => (
              <AISuggestionCard
                key={s.id}
                suggestion={s}
                selected={selectedIds.has(s.id)}
                onToggle={toggleId}
              />
            ))}
          </div>

          <div className="border-t border-hairline px-5 py-3 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-md bg-hairline/30"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 text-sm rounded-md bg-black text-white disabled:bg-hairline disabled:text-ink-mute"
            >
              Ajouter {selectedCount > 0 ? `${selectedCount} spot${selectedCount > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

- [ ] **Step 8.4: Run tests, verify PASS**

```bash
npm test -- --run components/ai/AISuggestionsPanel.test.tsx
```

Expected: 7 tests PASS. NOTE: Vaul `setPointerCapture` jsdom warning will appear (cosmetic) — same pattern as MapSpotDetailSheet tests in sub-project A.

- [ ] **Step 8.5: Commit**

```bash
git add components/ai/AISuggestionsPanel.tsx components/ai/AISuggestionsPanel.test.tsx
git commit -m "feat(ai): composant AISuggestionsPanel (états + multi-select + tweak prompt)"
```

---

### Task 9: Trigger 1 — auto-mount voyage vide + dismiss flag

**Files:**
- Modify: `lib/db/schema.ts` (ajouter champ local `ai_suggestions_dismissed?: boolean` à `LocalTrip`)
- Modify: `components/map/MapShell.tsx` (logique trigger + accept handler)

- [ ] **Step 9.1: Add the local-only field to LocalTrip**

Modify `lib/db/schema.ts`. Find the `LocalTrip` type definition and add the optional field:

```typescript
export type LocalTrip = LocalRow<Tables['trips']['Row']> & {
  // Local-only flag — non synchronisé. True quand l'user a dismissé le panel
  // de suggestions IA pour ce voyage (évite la ré-ouverture auto au mount).
  ai_suggestions_dismissed?: boolean
}
```

No Dexie version bump needed because we're not adding an index — Dexie stores arbitrary fields without schema changes when they're not indexed.

- [ ] **Step 9.2: Verify TS compiles**

```bash
cd "C:/Users/flori/Desktop/PROJETS DEV/mk-trip-app"
npx tsc --noEmit 2>&1 | grep -E "LocalTrip|schema.ts" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 9.3: Modify MapShell to wire trigger 1**

Read `components/map/MapShell.tsx`. After the existing `useState` and `useMemo` calls, add:

```typescript
  // Trigger 1 : panel auto-ouvert si voyage vide ET pas encore dismissé
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  useEffect(() => {
    if (!trip) return
    const dismissed = (trip as any).ai_suggestions_dismissed === true
    if (spots.length === 0 && !dismissed) setAiPanelOpen(true)
  }, [trip, spots.length])

  const handleDismissAiPanel = useCallback(async () => {
    setAiPanelOpen(false)
    if (trip) {
      await db.trips.update(trip.id, { ai_suggestions_dismissed: true } as any)
    }
  }, [trip])

  const handleAcceptSuggestions = useCallback(async (selected: AISuggestion[]) => {
    if (!trip) return
    for (const s of selected) {
      await db.spots.add({
        id: crypto.randomUUID(),
        trip_id: trip.id,
        day_id: selectedDayId === 'all' ? null : selectedDayId,
        name: s.name,
        description: s.description,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        zone: null,
        price: null,
        tags: [],
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      // NOTE: sync queue enqueue is handled by existing wrapper if any.
      // If db.spots.add() doesn't trigger sync automatically in this codebase,
      // wrap with the existing pattern used elsewhere in MK Trip (look at
      // how AddExpenseDialog persists). Adjust if needed.
    }
    setAiPanelOpen(false)
    // Don't set the dismiss flag here — user actively used the panel.
  }, [trip, selectedDayId])
```

Add the imports at the top of the file:

```typescript
import { useState, useMemo, useEffect, useCallback } from 'react'
// ... existing imports ...
import { AISuggestionsPanel } from '@/components/ai/AISuggestionsPanel'
import type { AISuggestion } from '@/lib/ai/suggestSpotsSchema'
```

Then in the JSX, after `<MapSpotDetailSheet ... />`, add:

```typescript
      {/* Panel suggestions IA (overlay) */}
      {aiPanelOpen && trip && (
        <AISuggestionsPanel
          tripId={trip.id}
          destination={trip.destination ?? trip.name}
          tripType={trip.trip_type}
          dayId={selectedDayId === 'all' ? null : selectedDayId}
          excludeSpotIds={spots.map((s) => s.id)}
          onClose={handleDismissAiPanel}
          onAccept={handleAcceptSuggestions}
        />
      )}
```

- [ ] **Step 9.4: Verify TS compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "MapShell" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 9.5: Manual smoke test**

```bash
npm run dev
```

Wait for "Ready in Xms". Don't open the browser — just check stdout. Kill the dev server. The actual UI verification is in Task 12 (E2E) and Task 13 (manual acceptance).

- [ ] **Step 9.6: Commit**

```bash
git add lib/db/schema.ts components/map/MapShell.tsx
git commit -m "feat(ai): trigger 1 — panel suggestions IA auto-ouvert sur voyage vide + dismiss flag local"
```

---

### Task 10: Trigger 2 — bouton "Suggérer" dans MapSpotSheet

**Files:**
- Modify: `components/map/MapSpotSheet.tsx`

- [ ] **Step 10.1: Add the button + callback prop**

Read `components/map/MapSpotSheet.tsx`. Add a new optional prop `onSuggestAI?: () => void` and a button in the header.

Update the Props interface:

```typescript
interface Props {
  spots: MapSpot[]
  label: string
  onSpotClick: (spotId: string) => void
  onSuggestAI?: () => void
}
```

In the header section (near the existing label/count display), add a button:

```tsx
{onSuggestAI && (
  <button
    type="button"
    onClick={onSuggestAI}
    className="px-3 py-1.5 text-[11px] font-medium rounded-pill bg-black text-white flex items-center gap-1.5"
  >
    ✨ Suggérer
  </button>
)}
```

Place this button on the right side of the header row (alongside the existing label/count layout).

- [ ] **Step 10.2: Wire it in MapShell**

In `components/map/MapShell.tsx`, find the `<MapSpotSheet ... />` JSX and add the `onSuggestAI` prop:

```tsx
<MapSpotSheet
  spots={visibleSpots}
  label={dayLabel}
  onSpotClick={setSelectedSpotId}
  onSuggestAI={() => setAiPanelOpen(true)}
/>
```

- [ ] **Step 10.3: Update MapSpotSheet test for the new button**

Read `components/map/MapSpotSheet.test.tsx`. Add one test:

```typescript
  it('renders the AI suggest button when onSuggestAI is provided', () => {
    render(
      <MapSpotSheet spots={spots as any} label="Tous" onSpotClick={() => {}}
        onSuggestAI={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /sugg[ée]rer/i })).toBeInTheDocument()
  })

  it('does NOT render the AI suggest button when onSuggestAI is undefined', () => {
    render(
      <MapSpotSheet spots={spots as any} label="Tous" onSpotClick={() => {}} />,
    )
    expect(screen.queryByRole('button', { name: /sugg[ée]rer/i })).not.toBeInTheDocument()
  })
```

- [ ] **Step 10.4: Run tests**

```bash
npm test -- --run components/map/MapSpotSheet.test.tsx
```

Expected: 6 tests PASS (4 original + 2 new).

- [ ] **Step 10.5: Commit**

```bash
git add components/map/MapSpotSheet.tsx components/map/MapShell.tsx components/map/MapSpotSheet.test.tsx
git commit -m "feat(ai): trigger 2 — bouton ✨ Suggérer dans MapSpotSheet header"
```

---

### Task 11: Trigger 3 — placeholder jour vide

**Files:**
- Modify: `components/map/MapSpotSheet.tsx`

The empty state in MapSpotSheet currently shows "Aucun spot pour ce filtre." When `onSuggestAI` is provided AND the label indicates a day (not "Tous les spots"), we want the empty state to include a suggest button.

- [ ] **Step 11.1: Update the empty state**

Read `components/map/MapSpotSheet.tsx`. Replace the existing empty state block:

```tsx
{spots.length === 0 ? (
  <div className="px-5 mt-6 pb-8 text-sm text-ink-mute dark:text-ink-mute-dark">
    Aucun spot pour ce filtre.
  </div>
) : (
```

with:

```tsx
{spots.length === 0 ? (
  <div className="px-5 mt-6 pb-8 text-sm text-ink-mute dark:text-ink-mute-dark">
    <div className="mb-3">Aucun spot pour ce filtre.</div>
    {onSuggestAI && (
      <button
        type="button"
        onClick={onSuggestAI}
        className="px-3 py-2 text-xs rounded-md bg-black text-white flex items-center gap-1.5"
      >
        ✨ Suggérer pour ce jour
      </button>
    )}
  </div>
) : (
```

- [ ] **Step 11.2: Update the empty-state test**

Read `components/map/MapSpotSheet.test.tsx`. Update the existing "renders empty state" test and add one more for the suggest variant:

```typescript
  it('renders empty state when spots is empty', () => {
    render(
      <MapSpotSheet spots={[]} label="Jour 2" onSpotClick={() => {}} />,
    )
    expect(screen.getByText(/aucun spot/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sugg[ée]rer pour ce jour/i })).not.toBeInTheDocument()
  })

  it('renders the per-day suggest button in empty state when onSuggestAI is provided', () => {
    render(
      <MapSpotSheet spots={[]} label="Jour 2" onSpotClick={() => {}}
        onSuggestAI={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /sugg[ée]rer pour ce jour/i })).toBeInTheDocument()
  })
```

- [ ] **Step 11.3: Run tests**

```bash
npm test -- --run components/map/MapSpotSheet.test.tsx
```

Expected: 7 tests PASS (6 from Task 10 + 1 new — the empty state already existed, just verifies the button doesn't appear without prop).

- [ ] **Step 11.4: Commit**

```bash
git add components/map/MapSpotSheet.tsx components/map/MapSpotSheet.test.tsx
git commit -m "feat(ai): trigger 3 — bouton ✨ Suggérer pour ce jour dans empty state MapSpotSheet"
```

---

### Task 12: E2E Playwright (5 scénarios)

**Files:**
- Create: `e2e/ai-suggestions.spec.ts`

NOTE: For E2E, the real AI Gateway endpoint is not desired (cost, flakiness, requires AI_GATEWAY_API_KEY in test env). We'll mock the `/api/spots/suggest` response by intercepting the request in Playwright via `page.route`.

- [ ] **Step 12.1: Create the spec**

Create `e2e/ai-suggestions.spec.ts`:

```typescript
import { test, expect, type Route } from '@playwright/test'

const DEMO_TRIP_MAP_URL = '/demo/demo-trip-lisboa/map'

function makeSuggestions() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `sug-${i}`,
    name: `Mock Spot ${i}`,
    category: ['food','culture','nature','sport','activity'][i % 5],
    description: `Description for spot ${i}`,
    address: `address ${i}`,
    lat: 38.7 + i * 0.001,
    lng: -9.1 + i * 0.001,
    mapbox_verified: i % 3 !== 0,
  }))
}

async function mockSuggestEndpoint(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ suggestions: makeSuggestions() }),
  })
}

test.describe('AI Suggestions Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/spots/suggest', mockSuggestEndpoint)
  })

  test('Scenario 1: panel opens when user clicks "Suggérer" in the sheet', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    const suggestBtn = page.getByRole('button', { name: /sugg[ée]rer/i }).first()
    await expect(suggestBtn).toBeVisible({ timeout: 15_000 })
    await suggestBtn.click()
    await expect(page.getByText(/claude haiku/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Mock Spot 0')).toBeVisible()
  })

  test('Scenario 2: multi-select + add inserts spots into the trip', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await page.getByRole('button', { name: /sugg[ée]rer/i }).first().click()
    await expect(page.getByText('Mock Spot 0')).toBeVisible()
    await page.getByRole('checkbox', { name: /Mock Spot 0/ }).click()
    await page.getByRole('checkbox', { name: /Mock Spot 1/ }).click()
    const addBtn = page.getByRole('button', { name: /ajouter 2 spots/i })
    await expect(addBtn).toBeEnabled()
    await addBtn.click()
    // After acceptance, the panel closes and the sheet shows new spots
    await expect(page.getByText(/claude haiku/i)).not.toBeVisible({ timeout: 5_000 })
  })

  test('Scenario 3: error state appears when the endpoint fails', async ({ page }) => {
    // Override: this test wants the endpoint to fail.
    await page.unroute('**/api/spots/suggest')
    await page.route('**/api/spots/suggest', (r) => r.fulfill({ status: 500, body: 'oops' }))
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await page.getByRole('button', { name: /sugg[ée]rer/i }).first().click()
    await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /r[ée]essayer/i })).toBeVisible()
  })

  test('Scenario 4: tweak prompt triggers a re-fetch', async ({ page }) => {
    let callCount = 0
    await page.unroute('**/api/spots/suggest')
    await page.route('**/api/spots/suggest', async (route) => {
      callCount++
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ suggestions: makeSuggestions() }),
      })
    })
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await page.getByRole('button', { name: /sugg[ée]rer/i }).first().click()
    await expect(page.getByText('Mock Spot 0')).toBeVisible()
    await page.getByPlaceholder(/guide-moi/i).fill('plus food rue')
    await page.getByRole('button', { name: /r[ée]g[ée]n[ée]rer/i }).click()
    await expect.poll(() => callCount, { timeout: 5_000 }).toBe(2)
  })

  test('Scenario 5: close button dismisses the panel', async ({ page }) => {
    await page.goto(DEMO_TRIP_MAP_URL)
    await page.waitForSelector('[data-testid="map-shell"]')
    await page.getByRole('button', { name: /sugg[ée]rer/i }).first().click()
    await expect(page.getByText(/claude haiku/i)).toBeVisible()
    await page.getByRole('button', { name: /fermer/i }).click()
    await expect(page.getByText(/claude haiku/i)).not.toBeVisible({ timeout: 5_000 })
  })
})
```

- [ ] **Step 12.2: Run the E2E**

```bash
npm run test:e2e -- e2e/ai-suggestions.spec.ts --project=chromium
```

Expected: 5 tests PASS.

NOTE: If trigger 1 (auto-mount) fires before the click (because lisboa demo might be empty at first reload or because dismiss flag is wiped), the panel might be already open. Adjust tests as needed — if a test expects the panel to be closed initially, ensure the demo trip has spots seeded (which it does after sub-project A's `fca0851`).

- [ ] **Step 12.3: Commit**

```bash
git add e2e/ai-suggestions.spec.ts
git commit -m "test(e2e): 5 scénarios AI Suggestions Panel (endpoint mocké via page.route)"
```

---

### Task 13: Acceptance manuelle + push + PR

- [ ] **Step 13.1: Push the branch**

```bash
cd "C:/Users/flori/Desktop/PROJETS DEV/mk-trip-app"
git push -u origin feat/ai-spot-suggestions
```

- [ ] **Step 13.2: Verify Vercel preview env vars**

Critical: `AI_GATEWAY_API_KEY` must be set in Vercel for the preview. Check via `vercel env ls --environment=preview` if Vercel CLI is installed; otherwise verify in Vercel dashboard → Settings → Environment Variables.

If the env var is NOT set, the preview will fail with 500 on the suggest endpoint. Either:
- Set it (one-time): `vercel env add AI_GATEWAY_API_KEY preview`
- OR document this in the PR description so the user sets it before testing

`NEXT_PUBLIC_MAPBOX_TOKEN` should already be set from sub-project A; verify.

- [ ] **Step 13.3: Acceptance checklist manuelle sur preview**

Wait for Vercel deployment to complete. Open the preview URL on **mobile (iOS Safari) + desktop Chrome**.

Test on Lisbonne demo trip:

| # | Critère | OK ? |
|---|---|---|
| 1 | Voyage Lisbonne vide → panel s'ouvre auto en mid-snap | ☐ |
| 2 | Panel affiche 8 suggestions Lisbonne réalistes | ☐ |
| 3 | Multi-select 3 → bouton "Ajouter 3 spots" enabled | ☐ |
| 4 | Click Ajouter → spots apparaissent sur la carte | ☐ |
| 5 | Reload → spots persistent (Supabase sync OK) | ☐ |
| 6 | Bouton "Suggérer" dans sheet remplie → 8 nouvelles suggestions (pas de doublons) | ☐ |
| 7 | Day filter J2 vide → "Suggérer pour ce jour" → ajout avec day_id J2 | ☐ |
| 8 | Tweak prompt "plus food rue" → re-fetch produit suggestions food | ☐ |
| 9 | Badge ✓ vert sur >=6/8 suggestions (grounding Mapbox OK) | ☐ |
| 10 | Latence < 4s mobile 4G | ☐ |
| 11 | Aucune régression sur sub-projet A | ☐ |
| 12 | Mode sombre OK | ☐ |

- [ ] **Step 13.4: Open PR**

```bash
gh pr create --base main --head feat/ai-spot-suggestions --title "feat(ai): suggestions IA spots via Vercel AI Gateway + Mapbox Search (sous-projet B)" --body "$(cat <<'EOF'
## Summary

Premier sous-projet AI de MK Trip. Endpoint `POST /api/spots/suggest` qui chaîne `generateObject(anthropic/claude-haiku-4-5)` + grounding parallèle Mapbox Search. Panel `AISuggestionsPanel` (Vaul overlay) avec multi-select + tweak prompt. 3 triggers : auto-mount voyage vide, bouton "Suggérer" dans sheet, bouton "Suggérer pour ce jour" sur jour vide.

- ✨ 8 suggestions IA contextualisées par destination/type voyage/jour
- 🗺️ Grounding Mapbox Search (badges ✓/⚠)
- ✅ Multi-select bulk add → Dexie + sync queue existante
- 🔌 Rate limit 10 req/min par tripId
- 🚀 Modèle peu cher (~$0.001 par batch)

## Pré-requis env vars Vercel
- `AI_GATEWAY_API_KEY` (à ajouter sur preview/prod)
- `NEXT_PUBLIC_MAPBOX_TOKEN` (déjà présent depuis sub-projet A)

## Spec & Plan
- Spec : `docs/superpowers/specs/2026-05-24-ai-spot-suggestions-design.md`
- Plan : `docs/superpowers/plans/2026-05-24-ai-spot-suggestions.md`

## Tests
- Unit/composant Vitest : ajoutés
- E2E Playwright : 5 scénarios (endpoint mocké via page.route)
- Build TSC : 0 erreur

## ⚠️ Note branche
Cette PR est branchée depuis `feat/map-shell-v2` (sous-projet A). Pour isoler : merger A d'abord, puis rebase B sur main.

## Test plan
- [ ] Voir checklist 12 critères dans la description (preview Vercel)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL.

---

## Hors-scope confirmé (NE PAS faire dans ce plan)

- Chat conversationnel multi-tour → sous-projet B2
- Édition manuelle d'une suggestion avant ajout → sous-projet UI ajout spot
- Photos auto (Google Places, Unsplash) → futur
- Streaming UI (suggestions arrivant une par une) → polish post-MVP
- Cache serveur des suggestions → optim post-MVP
- Rate limit distribué (Upstash Redis) → follow-up si abuse réel
- Auth check sur l'endpoint → follow-up
- Suggestions à partir de météo/événements/agenda → futur

## Risques connus & mitigations

| Risque | Mitigation |
|---|---|
| `AI_GATEWAY_API_KEY` non set en preview | Step 13.2 vérifie explicitement avant acceptance |
| Mapbox v6 endpoint return 404 (API changes) | Step 4.3 note fallback v5 format |
| Vaul drag-handle warning en jsdom | Tests passent quand même (cosmetic) |
| Trigger 1 spam ouverture intrusive | Flag `ai_suggestions_dismissed` local persiste après dismiss |
| AI hallucine + Mapbox ne trouve pas | Badge ⚠ explicite, user voit + peut ajouter quand même |
| Coût AI dérape | Rate limit + alarmes coût dashboard AI Gateway |
| Régression sur sub-projet A | Step 13.3 critère #11 (acceptance manuelle) |
