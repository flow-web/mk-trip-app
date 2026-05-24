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
