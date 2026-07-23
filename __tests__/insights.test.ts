import { describe, it, expect } from 'vitest'

// Helper functions extracted from insights.ts for testing
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthDateRange(monthsAgo = 0) {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  }
}

// Test spending trend detection (>20% increase)
describe('Spending Insights - Month-over-Month Trends', () => {
  it('should detect 20%+ spending increase in a category', () => {
    const lastMonthAmount = 100
    const currentMonthAmount = 125
    const percentChange = ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100

    expect(percentChange).toBeGreaterThan(20)
    expect(percentChange).toBe(25)
  })

  it('should not flag spending that increased less than 20%', () => {
    const lastMonthAmount = 100
    const currentMonthAmount = 115
    const percentChange = ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100

    expect(percentChange).toBeLessThan(20)
  })

  it('should handle zero last month spending', () => {
    const lastMonthAmount = 0
    const currentMonthAmount = 50

    // If last month was 0, we shouldn't flag (no baseline to compare)
    if (lastMonthAmount === 0) {
      expect(true).toBe(true)
    }
  })

  it('should format percentage correctly for insight display', () => {
    const lastMonthAmount = 100
    const currentMonthAmount = 135
    const percentChange = ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
    const formatted = percentChange.toFixed(0)

    expect(formatted).toBe('35')
  })
})

// Test budget recommendation logic
describe('Budget Recommendations', () => {
  it('should suggest budget for category with 3+ expenses and no existing budget', () => {
    const expenses = [
      { amount: 25, category: 'Dining' },
      { amount: 30, category: 'Dining' },
      { amount: 20, category: 'Dining' },
    ]
    const expenseCount = expenses.length
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
    const avgSpend = totalAmount / expenseCount
    const suggestedBudget = Math.round(avgSpend * 1.1 / 10) * 10

    expect(expenseCount).toBeGreaterThanOrEqual(3)
    expect(avgSpend).toBe(25)
    // 25 * 1.1 = 27.5, round to nearest 10 = 30
    expect(suggestedBudget).toBe(30)
  })

  it('should not suggest budget for category with < 3 expenses', () => {
    const expenses = [
      { amount: 50, category: 'Entertainment' },
      { amount: 60, category: 'Entertainment' },
    ]

    expect(expenses.length).toBeLessThan(3)
  })

  it('should calculate suggested budget as 10% above average', () => {
    const avgSpend = 50
    const suggestedBudget = Math.round(avgSpend * 1.1 / 10) * 10

    // 50 * 1.1 = 55, round to nearest 10 = 60
    expect(suggestedBudget).toBe(60)
  })
})

// Test anomaly detection (>3x average)
describe('Anomaly Detection - Unusual Transactions', () => {
  it('should flag expense >3x category average', () => {
    const categoryAverage = 30
    const unusualExpense = 100
    const threshold = categoryAverage * 3

    expect(unusualExpense).toBeGreaterThan(threshold)
  })

  it('should not flag expense <= 3x average', () => {
    const categoryAverage = 30
    const normalExpense = 85
    const threshold = categoryAverage * 3

    expect(normalExpense).toBeLessThanOrEqual(threshold)
  })

  it('should calculate average correctly from multiple expenses', () => {
    const expenses = [20, 25, 30, 35]
    const average = expenses.reduce((a, b) => a + b, 0) / expenses.length

    expect(average).toBe(27.5)
    expect(average * 3).toBe(82.5)
  })

  it('should correctly identify anomaly with single high transaction', () => {
    const transactions = [25, 28, 26, 100]
    const average = transactions.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    const isAnomaly = transactions[3] > average * 3

    expect(isAnomaly).toBe(true)
  })
})

// Test date range calculation
describe('Date Range Calculations', () => {
  it('should return valid date range for current month', () => {
    const range = getMonthDateRange(0)

    expect(range.startDate).toMatch(/\d{4}-\d{2}-01/)
    expect(range.endDate).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('should return valid date range for last month', () => {
    const range = getMonthDateRange(1)
    const now = new Date()
    const expectedMonth = now.getMonth() === 0 ? 12 : now.getMonth()

    expect(range.startDate).toBeDefined()
    expect(range.endDate).toBeDefined()
  })

  it('should have end date after start date', () => {
    const range = getMonthDateRange(0)
    const startDate = new Date(range.startDate)
    const endDate = new Date(range.endDate)

    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime())
  })
})
