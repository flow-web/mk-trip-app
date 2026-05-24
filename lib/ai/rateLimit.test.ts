import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, checkGlobalRateLimit, _resetRateLimit } from './rateLimit'

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

describe('checkGlobalRateLimit', () => {
  it('allows up to N requests in the window', () => {
    for (let i = 0; i < 100; i++) {
      expect(checkGlobalRateLimit(100)).toBe(true)
    }
    expect(checkGlobalRateLimit(100)).toBe(false)
  })

  it('uses a separate bucket from per-key limits', () => {
    // Exhaust per-key bucket for userA
    for (let i = 0; i < 10; i++) checkRateLimit('userA')
    expect(checkRateLimit('userA')).toBe(false) // 11th fails for userA

    // Global bucket is independent: still has plenty of budget
    expect(checkGlobalRateLimit(100)).toBe(true)
  })
})
