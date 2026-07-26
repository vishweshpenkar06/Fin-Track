import { describe, it, expect } from 'vitest'
import { suggestCategory, getSuggestionConfidence } from '@/lib/ai/categorizer'

describe('AI Categorizer - suggestCategory', () => {
  it('should categorize dining expenses', () => {
    expect(suggestCategory('Lunch at Starbucks')).toBe('Dining')
    expect(suggestCategory('Pizza delivery')).toBe('Dining')
    expect(suggestCategory('Uber Eats order')).toBe('Dining')
  })

  it('should categorize grocery expenses', () => {
    expect(suggestCategory('Weekly groceries at Walmart')).toBe('Groceries')
    expect(suggestCategory('Costco bulk shopping')).toBe('Groceries')
    expect(suggestCategory('Trader Joes produce')).toBe('Groceries')
  })

  it('should categorize transport expenses', () => {
    expect(suggestCategory('Gas station fill up')).toBe('Transport')
    expect(suggestCategory('Uber ride to airport')).toBe('Transport')
    expect(suggestCategory('Monthly parking pass')).toBe('Transport')
  })

  it('should categorize entertainment expenses', () => {
    expect(suggestCategory('Netflix subscription')).toBe('Entertainment')
    expect(suggestCategory('Spotify premium')).toBe('Entertainment')
    expect(suggestCategory('Movie tickets')).toBe('Entertainment')
  })

  it('should categorize utility expenses', () => {
    expect(suggestCategory('Electric bill')).toBe('Utilities')
    expect(suggestCategory('Internet Comcast')).toBe('Utilities')
    expect(suggestCategory('Phone Verizon')).toBe('Utilities')
  })

  it('should categorize rent expenses', () => {
    expect(suggestCategory('Monthly rent payment')).toBe('Rent')
    expect(suggestCategory('Apartment lease')).toBe('Rent')
  })

  it('should categorize healthcare expenses', () => {
    expect(suggestCategory('Doctor visit copay')).toBe('Healthcare')
    expect(suggestCategory('CVS pharmacy')).toBe('Healthcare')
    expect(suggestCategory('Dental cleaning')).toBe('Healthcare')
  })

  it('should categorize shopping expenses', () => {
    expect(suggestCategory('Amazon order')).toBe('Shopping')
    expect(suggestCategory('Best Buy electronics')).toBe('Shopping')
  })

  it('should return null for unknown descriptions', () => {
    expect(suggestCategory('xyz')).toBeNull()
    expect(suggestCategory('')).toBeNull()
    expect(suggestCategory('12345')).toBeNull()
  })

  it('should handle case insensitivity', () => {
    expect(suggestCategory('STARBUCKS COFFEE')).toBe('Dining')
    expect(suggestCategory('uber ride')).toBe('Transport')
  })

  it('should prefer longer keyword matches', () => {
    // "whole foods" should beat just "food"
    expect(suggestCategory('Whole Foods shopping')).toBe('Groceries')
  })
})

describe('AI Categorizer - getSuggestionConfidence', () => {
  it('should return 0 for empty description', () => {
    expect(getSuggestionConfidence('')).toBe(0)
  })

  it('should return higher confidence for more keyword matches', () => {
    const low = getSuggestionConfidence('coffee')
    const high = getSuggestionConfidence('Starbucks coffee lunch')
    expect(high).toBeGreaterThan(low)
  })

  it('should cap confidence at 100%', () => {
    const confidence = getSuggestionConfidence('restaurant food coffee starbucks lunch dinner meal')
    expect(confidence).toBeLessThanOrEqual(1)
  })
})
