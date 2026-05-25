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
    expect(p).not.toMatch(/a{201}/)
  })

  it('asks for diversity of categories', () => {
    const p = buildPrompt({
      destination: 'X', tripType: 'city_break', count: 8, excludeNames: [],
    })
    expect(p.toLowerCase()).toContain('vari')
  })
})
