'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Lightbulb, AlertTriangle } from 'lucide-react'
import { getExpenses } from '@/app/actions/expenses'
import { getBudgets } from '@/app/actions/budgets'
import { getIncome, getTotalIncome } from '@/app/actions/income'
import { generateInsights } from '@/app/actions/insights'
import { getCurrentMonth, formatLocalDate } from '@/lib/date-utils'
import { startOfMonth } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const currentMonth = getCurrentMonth()
  const monthStart = formatLocalDate(startOfMonth(new Date()))

  // Fetch data scoped to current month for totals, recent for transactions
  const expenses = await getExpenses({ startDate: monthStart })
  const budgets = await getBudgets(currentMonth)
  const incomes = await getIncome({ startDate: monthStart })
  const totalIncome = await getTotalIncome(currentMonth)
  const insights = await generateInsights()

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  const balance = totalIncome - totalExpenses

  // Get recent transactions from fetched data
  const allTransactions = [
    ...expenses.slice(0, 5).map((e) => ({
      id: e.id,
      description: e.description || e.category,
      amount: -parseFloat(e.amount),
      category: e.category,
      date: e.date,
      type: 'expense' as const,
    })),
    ...incomes.slice(0, 5).map((i) => ({
      id: i.id,
      description: i.description || i.source,
      amount: parseFloat(i.amount),
      category: i.source,
      date: i.date,
      type: 'income' as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  function getBudgetStatus(spent: number, limit: number) {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return { status: 'danger', color: 'text-destructive', bgColor: 'bg-destructive/10' }
    if (percentage >= 80) return { status: 'warning', color: 'text-budget-warning', bgColor: 'bg-budget-warning/10' }
    return { status: 'success', color: 'text-budget-success', bgColor: 'bg-budget-success/10' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name || 'User'}</h1>
        <p className="text-muted mt-2">Here&apos;s your financial summary for {currentMonth}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm font-medium">Total Balance</span>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
          <p className="text-xs text-muted">Income - Expenses</p>
        </div>

        {/* Income Card */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm font-medium">Total Income</span>
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="text-3xl font-bold text-secondary">${totalIncome.toFixed(2)}</div>
          <p className="text-xs text-muted">{incomes.length} sources</p>
        </div>

        {/* Expenses Card */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm font-medium">Total Expenses</span>
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <div className="text-3xl font-bold text-destructive">${totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-muted">{expenses.length} transactions</p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Budget Overview</h2>
          <Link href="/budgets" className="text-primary hover:underline text-sm">
            View all
          </Link>
        </div>
        {budgets.length > 0 ? (
          <div className="space-y-3">
            {budgets.slice(0, 3).map((b) => {
              const spent = parseFloat(b.spent)
              const limit = parseFloat(b.limit)
              const percentage = Math.min((spent / limit) * 100, 100)
              const status = getBudgetStatus(spent, limit)

              return (
                <div key={b.id} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.category}</span>
                    <span className={`text-sm font-semibold ${status.color}`}>
                      ${spent.toFixed(2)} / ${limit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentage >= 100
                          ? 'bg-destructive'
                          : percentage >= 80
                            ? 'bg-budget-warning'
                            : 'bg-budget-success'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card p-8 text-center text-muted">
            <p>No budgets set yet</p>
            <Link href="/budgets" className="text-primary hover:underline text-sm mt-2 inline-block">
              Create your first budget
            </Link>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link href="/expenses" className="text-primary hover:underline text-sm">
            View all
          </Link>
        </div>
        {allTransactions.length > 0 ? (
          <div className="card divide-y divide-border">
            {allTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted">{transaction.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-secondary' : 'text-foreground'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-muted">
            <p>No transactions yet</p>
          </div>
        )}
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Insights</h2>
          </div>
          <div className="grid gap-4">
            {insights.map((insight, idx) => {
              const severityStyles = {
                info: 'bg-primary/10 border-primary/20',
                warning: 'bg-budget-warning/10 border-budget-warning/20',
                alert: 'bg-destructive/10 border-destructive/20',
              }
              const iconStyles = {
                info: 'text-primary',
                warning: 'text-budget-warning',
                alert: 'text-destructive',
              }

              return (
                <div key={idx} className={`card p-4 border ${severityStyles[insight.severity]} space-y-2`}>
                  <div className="flex items-start gap-3">
                    {insight.severity === 'alert' ? (
                      <AlertTriangle className={`w-5 h-5 ${iconStyles[insight.severity]} flex-shrink-0 mt-0.5`} />
                    ) : (
                      <Lightbulb className={`w-5 h-5 ${iconStyles[insight.severity]} flex-shrink-0 mt-0.5`} />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{insight.title}</p>
                      <p className="text-sm text-muted">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card p-6 bg-primary/10 border-primary/20 text-center space-y-4">
        <h3 className="text-lg font-semibold">Start tracking your finances</h3>
        <p className="text-sm text-muted max-w-sm mx-auto">
          Add your first expense or income to get started with FinTrack
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/expenses" className="btn-primary">
            Add Expense
          </Link>
          <Link href="/budgets" className="btn-secondary">
            Set Budget
          </Link>
        </div>
      </div>
    </div>
  )
}
