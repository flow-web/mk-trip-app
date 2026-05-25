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
