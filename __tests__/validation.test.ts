import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/categories'

// Replicate the validation schemas from server actions for testing
const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c !== 'Income') as unknown as [string, ...string[]]

const addExpenseSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Invalid category' }),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  paymentMethod: z.string().max(50).optional(),
  receipt: z.string().max(2000).optional(),
})

const addBudgetSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Invalid category' }),
  limit: z.number().positive('Budget limit must be a positive number'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  alerts: z.boolean().optional(),
})

const addIncomeSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  source: z.string().min(1, 'Source is required').max(200, 'Source must be 200 characters or fewer'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
})

describe('Expense Validation', () => {
  it('should accept valid expense data', () => {
    const result = addExpenseSchema.safeParse({
      amount: 25.50,
      category: 'Dining',
      date: '2026-07-15',
      description: 'Lunch',
    })
    expect(result.success).toBe(true)
  })

  it('should reject negative amount', () => {
    const result = addExpenseSchema.safeParse({
      amount: -10,
      category: 'Dining',
      date: '2026-07-15',
    })
    expect(result.success).toBe(false)
  })

  it('should reject zero amount', () => {
    const result = addExpenseSchema.safeParse({
      amount: 0,
      category: 'Dining',
      date: '2026-07-15',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid category', () => {
    const result = addExpenseSchema.safeParse({
      amount: 25,
      category: 'InvalidCategory',
      date: '2026-07-15',
    })
    expect(result.success).toBe(false)
  })

  it('should accept all valid categories', () => {
    for (const cat of EXPENSE_CATEGORIES) {
      const result = addExpenseSchema.safeParse({
        amount: 25,
        category: cat,
        date: '2026-07-15',
      })
      expect(result.success).toBe(true)
    }
  })

  it('should reject invalid date format', () => {
    const result = addExpenseSchema.safeParse({
      amount: 25,
      category: 'Dining',
      date: '07-15-2026',
    })
    expect(result.success).toBe(false)
  })

  it('should reject description over 500 chars', () => {
    const result = addExpenseSchema.safeParse({
      amount: 25,
      category: 'Dining',
      date: '2026-07-15',
      description: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('should accept description at exactly 500 chars', () => {
    const result = addExpenseSchema.safeParse({
      amount: 25,
      category: 'Dining',
      date: '2026-07-15',
      description: 'x'.repeat(500),
    })
    expect(result.success).toBe(true)
  })
})

describe('Budget Validation', () => {
  it('should accept valid budget data', () => {
    const result = addBudgetSchema.safeParse({
      category: 'Groceries',
      limit: 500,
      month: '2026-07',
    })
    expect(result.success).toBe(true)
  })

  it('should reject negative limit', () => {
    const result = addBudgetSchema.safeParse({
      category: 'Groceries',
      limit: -100,
      month: '2026-07',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid month format', () => {
    const result = addBudgetSchema.safeParse({
      category: 'Groceries',
      limit: 500,
      month: '07-2026',
    })
    expect(result.success).toBe(false)
  })

  it('should accept alerts as optional boolean', () => {
    const result = addBudgetSchema.safeParse({
      category: 'Groceries',
      limit: 500,
      month: '2026-07',
      alerts: true,
    })
    expect(result.success).toBe(true)
  })
})

describe('Income Validation', () => {
  it('should accept valid income data', () => {
    const result = addIncomeSchema.safeParse({
      amount: 5000,
      source: 'Salary',
      date: '2026-07-01',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty source', () => {
    const result = addIncomeSchema.safeParse({
      amount: 5000,
      source: '',
      date: '2026-07-01',
    })
    expect(result.success).toBe(false)
  })

  it('should reject source over 200 chars', () => {
    const result = addIncomeSchema.safeParse({
      amount: 5000,
      source: 'x'.repeat(201),
      date: '2026-07-01',
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional description', () => {
    const result = addIncomeSchema.safeParse({
      amount: 5000,
      source: 'Salary',
      date: '2026-07-01',
      description: 'Monthly salary',
    })
    expect(result.success).toBe(true)
  })
})
