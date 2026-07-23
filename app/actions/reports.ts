'use server'

import { db } from '@/lib/db'
import { expense, income } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { getUserId } from '@/lib/auth-utils'
import { formatLocalDate } from '@/lib/date-utils'

export interface SpendingByCategory {
  category: string
  amount: number
}

export interface SpendingOverTime {
  date: string
  amount: number
}

export interface IncomeVsExpense {
  period: string
  income: number
  expense: number
}

function getDateRange(period: 'month' | 'year') {
  const now = new Date()
  const start = period === 'month' ? startOfMonth(now) : startOfYear(now)
  const end = period === 'month' ? endOfMonth(now) : endOfYear(now)
  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  }
}

export async function getSpendingByCategory(period: 'month' | 'year' = 'month'): Promise<SpendingByCategory[]> {
  const userId = await getUserId()
  const { startDate, endDate } = getDateRange(period)

  const expenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, startDate),
        lte(expense.date, endDate)
      )
    )

  const byCategory: Record<string, number> = {}

  for (const exp of expenses) {
    if (exp.category !== 'Income') {
      const amount = parseFloat(exp.amount)
      byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
    }
  }

  return Object.entries(byCategory).map(([category, amount]) => ({
    category,
    amount,
  }))
}

export async function getSpendingOverTime(period: 'month' | 'year' = 'month'): Promise<SpendingOverTime[]> {
  const userId = await getUserId()
  const { startDate, endDate } = getDateRange(period)

  const expenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, startDate),
        lte(expense.date, endDate)
      )
    )

  const byDate: Record<string, number> = {}

  for (const exp of expenses) {
    if (exp.category !== 'Income') {
      const amount = parseFloat(exp.amount)
      byDate[exp.date] = (byDate[exp.date] || 0) + amount
    }
  }

  return Object.entries(byDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getIncomeVsExpense(period: 'month' | 'year' = 'month'): Promise<IncomeVsExpense[]> {
  const userId = await getUserId()
  const { startDate, endDate } = getDateRange(period)

  const [expenses, incomes] = await Promise.all([
    db.select().from(expense).where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, startDate),
        lte(expense.date, endDate)
      )
    ),
    db.select().from(income).where(
      and(
        eq(income.userId, userId),
        gte(income.date, startDate),
        lte(income.date, endDate)
      )
    ),
  ])

  const totalExpense = expenses
    .filter(e => e.category !== 'Income')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0)

  const now = new Date()
  return [
    {
      period: period === 'month' ? now.toLocaleString('default', { month: 'long', year: 'numeric' }) : now.getFullYear().toString(),
      income: totalIncome,
      expense: totalExpense,
    },
  ]
}

export async function getCategoryBreakdown(period: 'month' | 'year' = 'month'): Promise<Array<{ category: string; amount: number; percentage: number }>> {
  const userId = await getUserId()
  const { startDate, endDate } = getDateRange(period)

  const expenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, startDate),
        lte(expense.date, endDate)
      )
    )

  const byCategory: Record<string, number> = {}
  let total = 0

  for (const exp of expenses) {
    if (exp.category !== 'Income') {
      const amount = parseFloat(exp.amount)
      byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
      total += amount
    }
  }

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}
