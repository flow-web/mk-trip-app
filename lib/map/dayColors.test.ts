import { describe, it, expect } from 'vitest'
import { getDayColor, DAY_PALETTE } from './dayColors'

describe('dayColors', () => {
  it('exposes a fixed palette of exactly 8 colors', () => {
    expect(DAY_PALETTE).toHaveLength(8)
    DAY_PALETTE.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i))
  })

  it('returns the first color for day index 0', () => {
    expect(getDayColor(0)).toBe(DAY_PALETTE[0])
  })

  it('returns the 8th color for day index 7', () => {
    expect(getDayColor(7)).toBe(DAY_PALETTE[7])
  })

  it('cycles back to the first color for day index 8 (9th day)', () => {
    expect(getDayColor(8)).toBe(DAY_PALETTE[0])
  })

  it('cycles correctly for high indices', () => {
    expect(getDayColor(15)).toBe(DAY_PALETTE[7])
    expect(getDayColor(16)).toBe(DAY_PALETTE[0])
  })

  it('clamps negative or NaN indices to 0', () => {
    expect(getDayColor(-1)).toBe(DAY_PALETTE[0])
    expect(getDayColor(NaN)).toBe(DAY_PALETTE[0])
  })
})
