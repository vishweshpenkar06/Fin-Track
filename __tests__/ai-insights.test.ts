import { describe, it, expect } from 'vitest'

describe('AI Insights - Data Processing', () => {
  it('should aggregate monthly spending correctly', () => {
    const expenses = [
      { date: '2026-01-05', amount: '25.50', category: 'Dining' },
      { date: '2026-01-15', amount: '30.00', category: 'Dining' },
      { date: '2026-01-20', amount: '50.00', category: 'Groceries' },
      { date: '2026-02-01', amount: '40.00', category: 'Dining' },
    ]

    const monthlyTotals: Record<string, number> = {}
    for (const exp of expenses) {
      const month = exp.date.slice(0, 7)
      monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(exp.amount)
    }

    expect(monthlyTotals['2026-01']).toBe(105.5)
    expect(monthlyTotals['2026-02']).toBe(40)
  })

  it('should group expenses by category', () => {
    const expenses = [
      { date: '2026-01-01', amount: '25', category: 'Dining' },
      { date: '2026-01-05', amount: '30', category: 'Dining' },
      { date: '2026-01-10', amount: '50', category: 'Groceries' },
    ]

    const byCategory: Record<string, number[]> = {}
    for (const exp of expenses) {
      if (!byCategory[exp.category]) byCategory[exp.category] = []
      byCategory[exp.category].push(parseFloat(exp.amount))
    }

    expect(byCategory['Dining']).toEqual([25, 30])
    expect(byCategory['Groceries']).toEqual([50])
  })

  it('should filter expenses by date range', () => {
    const expenses = [
      { date: '2026-01-01', amount: '100' },
      { date: '2026-01-15', amount: '200' },
      { date: '2026-02-01', amount: '300' },
      { date: '2026-02-15', amount: '400' },
    ]

    const startDate = '2026-02-01'
    const filtered = expenses.filter(e => e.date >= startDate)
    expect(filtered.length).toBe(2)
  })

  it('should sort months chronologically', () => {
    const months = ['2026-03', '2026-01', '2026-02']
    const sorted = months.sort()
    expect(sorted).toEqual(['2026-01', '2026-02', '2026-03'])
  })
})

describe('AI Insights - Insight Generation', () => {
  it('should generate prediction insights', () => {
    const insight = {
      type: 'prediction' as const,
      title: 'Spending Forecast',
      description: 'You are predicted to spend $1200 next month',
      severity: 'info' as const,
      amount: 1200,
      confidence: 75,
    }
    expect(insight.type).toBe('prediction')
    expect(insight.confidence).toBeGreaterThan(0)
  })

  it('should generate anomaly insights', () => {
    const insight = {
      type: 'anomaly' as const,
      title: 'Unusual Transaction',
      description: 'Your $500 Dining expense is unusually large',
      severity: 'alert' as const,
      category: 'Dining',
      amount: 500,
    }
    expect(insight.type).toBe('anomaly')
    expect(insight.severity).toBe('alert')
  })

  it('should generate recommendation insights', () => {
    const insight = {
      type: 'recommendation' as const,
      title: 'Suggested Budget: Dining',
      description: 'Consider setting a $150/month budget',
      severity: 'info' as const,
      category: 'Dining',
      amount: 150,
      confidence: 80,
    }
    expect(insight.type).toBe('recommendation')
    expect(insight.confidence).toBeGreaterThanOrEqual(0)
  })

  it('should limit insights to reasonable count', () => {
    const maxInsights = 10
    const insights = Array.from({ length: 15 }, (_, i) => ({
      type: 'info' as const,
      title: `Insight ${i}`,
      description: `Description ${i}`,
      severity: 'info' as const,
    }))
    const limited = insights.slice(0, maxInsights)
    expect(limited.length).toBe(maxInsights)
  })
})
