'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense, budget } from '@/lib/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'
import { headers } from 'next/headers'

interface Insight {
  type: 'spending' | 'budget-suggestion' | 'anomaly'
  title: string
  description: string
  category?: string
  amount?: number
  severity: 'info' | 'warning' | 'alert'
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

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

export async function generateInsights(): Promise<Insight[]> {
  const userId = await getUserId()
  const insights: Insight[] = []

  // Get current and last month's date ranges
  const currentMonth = getMonthDateRange(0)
  const lastMonth = getMonthDateRange(1)

  // Fetch current month expenses
  const currentMonthExpenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, currentMonth.startDate),
        lt(expense.date, currentMonth.endDate)
      )
    )

  // Fetch last month expenses
  const lastMonthExpenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, lastMonth.startDate),
        lt(expense.date, lastMonth.endDate)
      )
    )

  // 1. Spending Insights - Compare current month to last month per category
  const currentByCategory: Record<string, number> = {}
  const lastByCategory: Record<string, number> = {}

  currentMonthExpenses.forEach((exp) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amount = parseFloat(exp.amount as any)
    currentByCategory[exp.category] = (currentByCategory[exp.category] || 0) + amount
  })

  lastMonthExpenses.forEach((exp) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amount = parseFloat(exp.amount as any)
    lastByCategory[exp.category] = (lastByCategory[exp.category] || 0) + amount
  })

  // Check for significant increases (>20%)
  Object.entries(currentByCategory).forEach(([category, currentAmount]) => {
    const lastAmount = lastByCategory[category] || 0
    if (lastAmount > 0) {
      const percentChange = ((currentAmount - lastAmount) / lastAmount) * 100
      if (percentChange > 20) {
        const formatted = ((currentAmount - lastAmount) / lastAmount * 100).toFixed(0)
        insights.push({
          type: 'spending',
          title: 'Increased Spending',
          description: `You spent ${formatted}% more on ${category} this month ($${currentAmount.toFixed(2)}) compared to last month ($${lastAmount.toFixed(2)}).`,
          category,
          severity: 'warning',
        })
      }
    }
  })

  // 2. Budget Recommendations - Suggest budget if category has 3+ expenses but no budget
  const budgets = await db
    .select()
    .from(budget)
    .where(eq(budget.userId, userId))

  const budgetedCategories = new Set(budgets.map((b) => b.category))

  // Group current month expenses by category to find ones with 3+ expenses
  const categoryExpenseCount: Record<string, { count: number; total: number }> = {}
  currentMonthExpenses.forEach((exp) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amount = parseFloat(exp.amount as any)
    if (!categoryExpenseCount[exp.category]) {
      categoryExpenseCount[exp.category] = { count: 0, total: 0 }
    }
    categoryExpenseCount[exp.category].count++
    categoryExpenseCount[exp.category].total += amount
  })

  Object.entries(categoryExpenseCount).forEach(([category, { count, total }]) => {
    if (count >= 3 && !budgetedCategories.has(category)) {
      const avgMonthlySpend = total / count
      const suggestedBudget = Math.round(avgMonthlySpend * 1.1 / 10) * 10 // Round to nearest 10
      insights.push({
        type: 'budget-suggestion',
        title: 'Set a Budget',
        description: `You've had ${count} transactions in ${category} this month (averaging $${avgMonthlySpend.toFixed(2)}). Consider setting a budget of $${suggestedBudget} for this category.`,
        category,
        amount: suggestedBudget,
        severity: 'info',
      })
    }
  })

  // 3. Anomaly Detection - Flag expenses >3x category average
  const categoryStats: Record<string, { sum: number; count: number; avg: number }> = {}

  currentMonthExpenses.forEach((exp) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amount = parseFloat(exp.amount as any)
    if (!categoryStats[exp.category]) {
      categoryStats[exp.category] = { sum: 0, count: 0, avg: 0 }
    }
    categoryStats[exp.category].sum += amount
    categoryStats[exp.category].count++
  })

  Object.keys(categoryStats).forEach((cat) => {
    categoryStats[cat].avg = categoryStats[cat].sum / categoryStats[cat].count
  })

  currentMonthExpenses.forEach((exp) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amount = parseFloat(exp.amount as any)
    const stats = categoryStats[exp.category]
    if (stats && amount > stats.avg * 3) {
      insights.push({
        type: 'anomaly',
        title: 'Unusual Transaction',
        description: `Your $${amount.toFixed(2)} ${exp.category} expense is unusually large (3x your average of $${stats.avg.toFixed(2)}). Double-check this transaction${exp.description ? ` (${exp.description})` : ''}.`,
        category: exp.category,
        amount,
        severity: 'alert',
      })
    }
  })

  return insights
}
