import { describe, it, expect } from 'vitest'
import {
  predictNextMonthSpending,
  detectSpendingAnomalies,
  calculateBudgetRecommendation,
} from '@/lib/ai/predictor'

describe('AI Predictor - predictNextMonthSpending', () => {
  it('should predict stable spending', () => {
    const data = [
      { month: '2026-01', total: 1000 },
      { month: '2026-02', total: 1000 },
      { month: '2026-03', total: 1000 },
    ]
    const result = predictNextMonthSpending(data)
    expect(result.predictedAmount).toBeCloseTo(1000, 0)
    expect(result.trend).toBe('stable')
  })

  it('should predict increasing spending', () => {
    const data = [
      { month: '2026-01', total: 800 },
      { month: '2026-02', total: 1000 },
      { month: '2026-03', total: 1200 },
    ]
    const result = predictNextMonthSpending(data)
    expect(result.trend).toBe('increasing')
    expect(result.predictedAmount).toBeGreaterThan(1000)
  })

  it('should predict decreasing spending', () => {
    const data = [
      { month: '2026-01', total: 1500 },
      { month: '2026-02', total: 1200 },
      { month: '2026-03', total: 900 },
    ]
    const result = predictNextMonthSpending(data)
    expect(result.trend).toBe('decreasing')
    expect(result.predictedAmount).toBeLessThan(900)
  })

  it('should handle single month data', () => {
    const data = [{ month: '2026-01', total: 500 }]
    const result = predictNextMonthSpending(data)
    expect(result.predictedAmount).toBe(500)
    expect(result.confidence).toBe(0)
  })

  it('should handle empty data', () => {
    const result = predictNextMonthSpending([])
    expect(result.predictedAmount).toBe(0)
    expect(result.confidence).toBe(0)
  })

  it('should never predict negative spending', () => {
    const data = [
      { month: '2026-01', total: 100 },
      { month: '2026-02', total: 50 },
      { month: '2026-03', total: 10 },
    ]
    const result = predictNextMonthSpending(data)
    expect(result.predictedAmount).toBeGreaterThanOrEqual(0)
  })
})

describe('AI Predictor - detectSpendingAnomalies', () => {
  it('should detect high anomalies', () => {
    // Need enough data points (3+) and high variance
    const expenses = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      amount: 50 + Math.random() * 10, // ~50-60 range
      category: 'Dining',
    }))
    // Add one extreme anomaly
    expenses.push({ date: '2026-01-15', amount: 500, category: 'Dining' })

    const anomalies = detectSpendingAnomalies(expenses)
    // With 11 data points, the anomaly should be detected
    expect(anomalies.some(a => a.amount === 500)).toBe(true)
  })

  it('should not flag normal variations', () => {
    const expenses = [
      { date: '2026-01-01', amount: 28, category: 'Dining' },
      { date: '2026-01-05', amount: 32, category: 'Dining' },
      { date: '2026-01-10', amount: 30, category: 'Dining' },
      { date: '2026-01-15', amount: 29, category: 'Dining' },
    ]
    const anomalies = detectSpendingAnomalies(expenses)
    expect(anomalies.length).toBe(0)
  })

  it('should not flag categories with fewer than 3 data points', () => {
    const expenses = [
      { date: '2026-01-01', amount: 10, category: 'Other' },
      { date: '2026-01-05', amount: 1000, category: 'Other' },
    ]
    const anomalies = detectSpendingAnomalies(expenses)
    expect(anomalies.length).toBe(0)
  })

  it('should handle empty expenses', () => {
    const anomalies = detectSpendingAnomalies([])
    expect(anomalies.length).toBe(0)
  })
})

describe('AI Predictor - calculateBudgetRecommendation', () => {
  it('should recommend budget based on average', () => {
    const expenses = [
      { date: '2026-01-01', amount: 100, category: 'Dining' },
      { date: '2026-01-15', amount: 150, category: 'Dining' },
      { date: '2026-02-01', amount: 120, category: 'Dining' },
      { date: '2026-02-15', amount: 130, category: 'Dining' },
    ]
    const result = calculateBudgetRecommendation(expenses, 'Dining')
    expect(result.recommended).toBeGreaterThan(0)
    expect(result.basedOnMonths).toBe(2)
  })

  it('should return 0 for no expenses', () => {
    const result = calculateBudgetRecommendation([], 'Dining')
    expect(result.recommended).toBe(0)
    expect(result.basedOnMonths).toBe(0)
  })

  it('should round to nearest 10', () => {
    const expenses = [
      { date: '2026-01-01', amount: 33, category: 'Dining' },
      { date: '2026-01-15', amount: 37, category: 'Dining' },
    ]
    const result = calculateBudgetRecommendation(expenses, 'Dining')
    expect(result.recommended % 10).toBe(0)
  })

  it('should calculate confidence based on consistency', () => {
    // Consistent spending = higher confidence
    const consistent = [
      { date: '2026-01-01', amount: 100, category: 'Dining' },
      { date: '2026-02-01', amount: 105, category: 'Dining' },
      { date: '2026-03-01', amount: 98, category: 'Dining' },
    ]
    const inconsistent = [
      { date: '2026-01-01', amount: 50, category: 'Dining' },
      { date: '2026-02-01', amount: 200, category: 'Dining' },
      { date: '2026-03-01', amount: 75, category: 'Dining' },
    ]
    const consistentResult = calculateBudgetRecommendation(consistent, 'Dining')
    const inconsistentResult = calculateBudgetRecommendation(inconsistent, 'Dining')
    expect(consistentResult.confidence).toBeGreaterThan(inconsistentResult.confidence)
  })
})
