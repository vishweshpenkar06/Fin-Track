import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, expense, income, budget } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendWeeklySummary } from '@/lib/email'
import { formatLocalDate, getCurrentMonth } from '@/lib/date-utils'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const prevWeekStart = formatLocalDate(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }))
    const prevWeekEnd = formatLocalDate(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }))

    const usersWithWeeklySummary = await db
      .select()
      .from(user)
      .where(eq(user.notificationPreferences, { budgetAlerts: true, weeklySummary: true, aiInsights: false }))

    let emailsSent = 0

    for (const u of usersWithWeeklySummary) {
      try {
        const [weekExpenses, weekIncomes] = await Promise.all([
          db.select().from(expense).where(
            and(
              eq(expense.userId, u.id),
              gte(expense.date, prevWeekStart),
              lte(expense.date, prevWeekEnd)
            )
          ),
          db.select().from(income).where(
            and(
              eq(income.userId, u.id),
              gte(income.date, prevWeekStart),
              lte(income.date, prevWeekEnd)
            )
          ),
        ])

        const totalSpent = weekExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
        const totalIncome = weekIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0)

        if (totalSpent === 0 && totalIncome === 0) continue

        const categoryTotals: Record<string, number> = {}
        for (const e of weekExpenses) {
          categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount)
        }
        const topCategories = Object.entries(categoryTotals)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)

        const currentMonth = getCurrentMonth()

        const userBudgets = await db.select().from(budget).where(
          and(eq(budget.userId, u.id), eq(budget.month, currentMonth))
        )

        const budgetAlerts = userBudgets.map(b => {
          const spentInCategory = weekExpenses
            .filter(e => e.category === b.category)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0)
          return {
            category: b.category,
            spent: spentInCategory,
            limit: parseFloat(b.limit),
          }
        }).filter(b => b.spent > 0)

        await sendWeeklySummary({
          userName: u.name,
          userEmail: u.email,
          totalSpent,
          totalIncome,
          topCategories,
          budgetAlerts,
          period: `${prevWeekStart} to ${prevWeekEnd}`,
        })

        emailsSent++
      } catch (error) {
        console.error(`Failed to send weekly summary to ${u.email}:`, error)
      }
    }

    return NextResponse.json({ success: true, emailsSent })
  } catch (error) {
    console.error('Weekly summary cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
