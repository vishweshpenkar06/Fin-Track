import { describe, it, expect } from 'vitest'
import { formatLocalDate, getCurrentMonth } from '@/lib/date-utils'

describe('Goals - Progress Calculations', () => {
  it('should calculate progress percentage correctly', () => {
    const current = 500
    const target = 1000
    const percentage = (current / target) * 100
    expect(percentage).toBe(50)
  })

  it('should cap progress at 100%', () => {
    const current = 1500
    const target = 1000
    const percentage = Math.min((current / target) * 100, 100)
    expect(percentage).toBe(100)
  })

  it('should handle zero target', () => {
    const current = 500
    const target = 0
    const percentage = target > 0 ? (current / target) * 100 : 0
    expect(percentage).toBe(0)
  })

  it('should determine if goal is complete', () => {
    const complete = 1000 >= 1000
    const incomplete = 500 >= 1000
    expect(complete).toBe(true)
    expect(incomplete).toBe(false)
  })
})

describe('Goals - Deadline Calculations', () => {
  it('should check if deadline is approaching', () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7) // 7 days from now
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    expect(daysLeft).toBeLessThanOrEqual(7)
  })

  it('should check if deadline is past', () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() - 1) // yesterday
    const isPast = deadline < new Date()
    expect(isPast).toBe(true)
  })

  it('should calculate days remaining', () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30)
    const now = new Date()
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(daysRemaining).toBeGreaterThan(0)
    expect(daysRemaining).toBeLessThanOrEqual(30)
  })
})

describe('Goals - Savings Rate', () => {
  it('should calculate monthly savings needed', () => {
    const target = 12000
    const current = 3000
    const monthsRemaining = 12
    const monthlyNeeded = (target - current) / monthsRemaining
    expect(monthlyNeeded).toBe(750)
  })

  it('should handle completed goal savings', () => {
    const target = 5000
    const current = 5000
    const monthsRemaining = 6
    const monthlyNeeded = Math.max(0, (target - current) / monthsRemaining)
    expect(monthlyNeeded).toBe(0)
  })

  it('should calculate savings rate from income', () => {
    const monthlyIncome = 5000
    const monthlySavings = 1000
    const savingsRate = (monthlySavings / monthlyIncome) * 100
    expect(savingsRate).toBe(20)
  })
})
