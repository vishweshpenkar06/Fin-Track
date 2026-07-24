import { describe, it, expect } from 'vitest'
import { formatLocalDate, getCurrentMonth } from '@/lib/date-utils'

describe('Income Calculation Logic', () => {
  it('should sum income amounts correctly', () => {
    const incomes = [
      { amount: '5000.00', source: 'Salary' },
      { amount: '500.00', source: 'Freelance' },
      { amount: '200.00', source: 'Investment' },
    ]

    const total = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
    expect(total).toBe(5700)
  })

  it('should handle empty income list', () => {
    const incomes: Array<{ amount: string; source: string }> = []
    const total = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
    expect(total).toBe(0)
  })

  it('should handle single income entry', () => {
    const incomes = [{ amount: '3000.00', source: 'Salary' }]
    const total = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
    expect(total).toBe(3000)
  })
})

describe('Income vs Expense Balance', () => {
  it('should calculate positive balance when income > expenses', () => {
    const totalIncome = 5000
    const totalExpenses = 3000
    const balance = totalIncome - totalExpenses
    expect(balance).toBe(2000)
  })

  it('should calculate negative balance when expenses > income', () => {
    const totalIncome = 3000
    const totalExpenses = 5000
    const balance = totalIncome - totalExpenses
    expect(balance).toBe(-2000)
  })

  it('should calculate zero balance when equal', () => {
    const totalIncome = 4000
    const totalExpenses = 4000
    const balance = totalIncome - totalExpenses
    expect(balance).toBe(0)
  })
})

describe('Income Filtering by Date', () => {
  const incomes = [
    { id: '1', amount: '5000', date: '2026-07-01', source: 'Salary' },
    { id: '2', amount: '500', date: '2026-07-15', source: 'Freelance' },
    { id: '3', amount: '3000', date: '2026-06-01', source: 'Salary' },
  ]

  it('should filter incomes by start date', () => {
    const filtered = incomes.filter(i => i.date >= '2026-07-01')
    expect(filtered).toHaveLength(2)
  })

  it('should filter incomes by end date', () => {
    const filtered = incomes.filter(i => i.date <= '2026-07-10')
    expect(filtered).toHaveLength(2) // July 1 and June 1 both <= July 10
  })

  it('should filter incomes by date range', () => {
    const filtered = incomes.filter(i =>
      i.date >= '2026-07-01' && i.date <= '2026-07-31'
    )
    expect(filtered).toHaveLength(2)
  })
})

describe('Monthly Aggregation', () => {
  it('should aggregate income by month correctly', () => {
    const incomes = [
      { amount: '5000', date: '2026-07-01' },
      { amount: '500', date: '2026-07-15' },
      { amount: '4800', date: '2026-06-01' },
    ]

    const byMonth: Record<string, number> = {}
    for (const inc of incomes) {
      const month = inc.date.slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + parseFloat(inc.amount)
    }

    expect(byMonth['2026-07']).toBe(5500)
    expect(byMonth['2026-06']).toBe(4800)
  })
})

describe('Date Utils for Income', () => {
  it('getCurrentMonth should be valid for month comparison', () => {
    const currentMonth = getCurrentMonth()
    const [year, month] = currentMonth.split('-').map(Number)
    expect(year).toBeGreaterThan(2020)
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })

  it('formatLocalDate should create valid date string for income filtering', () => {
    const date = new Date(2026, 6, 1) // July 1, 2026
    const formatted = formatLocalDate(date)
    expect(formatted).toBe('2026-07-01')

    // Should work with string comparison for filtering
    expect('2026-07-15' >= formatted).toBe(true)
    expect('2026-06-30' >= formatted).toBe(false)
  })
})
