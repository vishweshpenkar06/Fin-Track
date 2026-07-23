import { describe, it, expect } from 'vitest'

// Helper to calculate spent amount for a budget category
function calculateSpent(expenses: Array<{ category: string; amount: string }>, category: string): number {
  return expenses
    .filter((e) => e.category === category)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
}

// Helper to determine budget status
function getBudgetStatus(spent: number, limit: number): 'under' | 'warning' | 'over' {
  const percentage = (spent / limit) * 100
  if (percentage >= 100) return 'over'
  if (percentage >= 80) return 'warning'
  return 'under'
}

describe('Budget Spent Calculation', () => {
  it('should calculate total spent for a category', () => {
    const expenses = [
      { category: 'Dining', amount: '25.50' },
      { category: 'Dining', amount: '30.00' },
      { category: 'Groceries', amount: '50.00' },
    ]

    const diningSpent = calculateSpent(expenses, 'Dining')
    expect(diningSpent).toBeCloseTo(55.5, 1)
  })

  it('should return 0 for category with no expenses', () => {
    const expenses = [{ category: 'Dining', amount: '25.00' }]

    const transportSpent = calculateSpent(expenses, 'Transport')
    expect(transportSpent).toBe(0)
  })

  it('should handle multiple expenses in same category', () => {
    const expenses = [
      { category: 'Utilities', amount: '120.00' },
      { category: 'Utilities', amount: '45.50' },
      { category: 'Utilities', amount: '32.75' },
    ]

    const utilitiesSpent = calculateSpent(expenses, 'Utilities')
    expect(utilitiesSpent).toBeCloseTo(198.25, 1)
  })

  it('should ignore expenses from other categories', () => {
    const expenses = [
      { category: 'Dining', amount: '50.00' },
      { category: 'Transport', amount: '30.00' },
      { category: 'Dining', amount: '25.00' },
    ]

    const diningSpent = calculateSpent(expenses, 'Dining')
    expect(diningSpent).toBe(75)
  })
})

describe('Budget Status Calculation', () => {
  it('should return "under" when spent < 80% of limit', () => {
    const status = getBudgetStatus(50, 100)
    expect(status).toBe('under')
  })

  it('should return "warning" when spent is 80-99% of limit', () => {
    const status1 = getBudgetStatus(80, 100)
    const status2 = getBudgetStatus(95, 100)

    expect(status1).toBe('warning')
    expect(status2).toBe('warning')
  })

  it('should return "over" when spent >= 100% of limit', () => {
    const status1 = getBudgetStatus(100, 100)
    const status2 = getBudgetStatus(150, 100)

    expect(status1).toBe('over')
    expect(status2).toBe('over')
  })

  it('should calculate percentage correctly', () => {
    const spent = 60
    const limit = 100
    const percentage = (spent / limit) * 100

    expect(percentage).toBe(60)
    expect(percentage).toBeLessThan(80)
  })
})

describe('Budget Recalculation Edge Cases', () => {
  it('should handle zero limit gracefully', () => {
    // This should not crash but also should be prevented at DB level
    const calculateSafely = (spent: number, limit: number) => {
      if (limit === 0) return 0
      return (spent / limit) * 100
    }

    const percentage = calculateSafely(50, 0)
    expect(percentage).toBe(0)
  })

  it('should handle very small amounts', () => {
    const expenses = [
      { category: 'Coffee', amount: '0.01' },
      { category: 'Coffee', amount: '0.02' },
    ]

    const spent = calculateSpent(expenses, 'Coffee')
    expect(spent).toBeCloseTo(0.03, 2)
  })

  it('should handle large amounts', () => {
    const expenses = [
      { category: 'Rent', amount: '1500.00' },
      { category: 'Rent', amount: '1500.00' },
    ]

    const spent = calculateSpent(expenses, 'Rent')
    expect(spent).toBe(3000)
  })

  it('should maintain precision with many transactions', () => {
    const expenses = Array.from({ length: 100 }, (_, i) => ({
      category: 'Test',
      amount: '1.50',
    }))

    const spent = calculateSpent(expenses, 'Test')
    expect(spent).toBeCloseTo(150, 1)
  })
})
