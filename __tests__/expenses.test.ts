import { describe, it, expect } from 'vitest'
import { CATEGORIES, getCategoryColor } from '@/lib/categories'
import { formatLocalDate, getCurrentMonth } from '@/lib/date-utils'

describe('Category Helpers', () => {
  it('should have all expected categories', () => {
    expect(CATEGORIES).toContain('Dining')
    expect(CATEGORIES).toContain('Rent')
    expect(CATEGORIES).toContain('Transport')
    expect(CATEGORIES).toContain('Groceries')
    expect(CATEGORIES).toContain('Entertainment')
    expect(CATEGORIES).toContain('Utilities')
    expect(CATEGORIES).toContain('Income')
    expect(CATEGORIES).toContain('Other')
  })

  it('should return correct color for known category', () => {
    expect(getCategoryColor('Dining')).toBe('#FF6B6B')
    expect(getCategoryColor('Rent')).toBe('#4F8CFF')
    expect(getCategoryColor('Groceries')).toBe('#22C55E')
  })

  it('should return default color for unknown category', () => {
    expect(getCategoryColor('Unknown')).toBe('#9AA1AB')
  })
})

describe('Date Utilities', () => {
  it('formatLocalDate should produce YYYY-MM-DD format', () => {
    const date = new Date(2026, 0, 5) // Jan 5, 2026
    expect(formatLocalDate(date)).toBe('2026-01-05')
  })

  it('formatLocalDate should pad single-digit months and days', () => {
    const date = new Date(2026, 2, 3) // Mar 3, 2026
    expect(formatLocalDate(date)).toBe('2026-03-03')
  })

  it('formatLocalDate should handle end of year', () => {
    const date = new Date(2026, 11, 31) // Dec 31, 2026
    expect(formatLocalDate(date)).toBe('2026-12-31')
  })

  it('getCurrentMonth should return YYYY-MM format', () => {
    const month = getCurrentMonth()
    expect(month).toMatch(/^\d{4}-\d{2}$/)
  })

  it('getCurrentMonth should match current date', () => {
    const month = getCurrentMonth()
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(month).toBe(expected)
  })
})

describe('Expense Filtering Logic', () => {
  const expenses = [
    { id: '1', category: 'Dining', amount: '25.00', description: 'Lunch', date: '2026-07-01' },
    { id: '2', category: 'Groceries', amount: '50.00', description: 'Weekly shop', date: '2026-07-05' },
    { id: '3', category: 'Dining', amount: '30.00', description: 'Dinner', date: '2026-07-10' },
    { id: '4', category: 'Transport', amount: '15.00', description: 'Bus pass', date: '2026-07-15' },
  ]

  it('should filter by category', () => {
    const filtered = expenses.filter(e => e.category === 'Dining')
    expect(filtered).toHaveLength(2)
  })

  it('should filter by search term in description', () => {
    const searchTerm = 'lunch'
    const filtered = expenses.filter(e =>
      e.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })

  it('should filter by date range', () => {
    const filtered = expenses.filter(e =>
      e.date >= '2026-07-05' && e.date <= '2026-07-10'
    )
    expect(filtered).toHaveLength(2)
  })

  it('should combine filters', () => {
    const filtered = expenses.filter(e =>
      e.category === 'Dining' && e.date >= '2026-07-10'
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('3')
  })
})

describe('Amount Formatting', () => {
  it('should format amounts to 2 decimal places', () => {
    const amount = 25.5
    expect(amount.toFixed(2)).toBe('25.50')
  })

  it('should handle zero amount', () => {
    expect((0).toFixed(2)).toBe('0.00')
  })

  it('should parse string amounts correctly', () => {
    expect(parseFloat('25.50')).toBe(25.5)
    expect(parseFloat('0.01')).toBe(0.01)
    expect(parseFloat('1000.00')).toBe(1000)
  })
})
