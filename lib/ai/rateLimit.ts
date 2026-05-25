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

/**
 * Global rate limit across all callers (all tripIds combined).
 * Uses a fixed internal key so it's decoupled from per-trip buckets.
 * Same caveat as checkRateLimit: best-effort, not distributed.
 */
export function checkGlobalRateLimit(maxRequestsPerMinute: number = 100): boolean {
  const GLOBAL_KEY = '__global__'
  const now = Date.now()
  const bucket = buckets.get(GLOBAL_KEY)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(GLOBAL_KEY, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= maxRequestsPerMinute) {
    return false
  }

  bucket.count += 1
  return true
}

// Test helper — not used in production code.
export function _resetRateLimit(): void {
  buckets.clear()
}
