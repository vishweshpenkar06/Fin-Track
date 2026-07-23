'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from 'lucide-react'
import { getSpendingByCategory, getSpendingOverTime, getIncomeVsExpense, getCategoryBreakdown } from '@/app/actions/reports'

const COLORS = ['#4f8cff', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7']

export default function ReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categoryData, setCategoryData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendData, setTrendData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [incomeExpenseData, setIncomeExpenseData] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async () => {
    try {
      setLoading(true)
      const [categoryRes, trendRes, incomeExpenseRes, breakdownRes] = await Promise.all([
        getSpendingByCategory(period),
        getSpendingOverTime(period),
        getIncomeVsExpense(period),
        getCategoryBreakdown(period),
      ])

      setCategoryData(categoryRes.map(d => ({ name: d.category, value: d.amount })))
      
      // Group trend data by week if showing month, otherwise by month
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupedTrend = trendRes.reduce((acc: any, item) => {
        const date = new Date(item.date)
        const key = period === 'month' 
          ? `Week ${Math.ceil(date.getDate() / 7)}`
          : date.toLocaleString('default', { month: 'short' })
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = acc.find((d: any) => d.date === key)
        if (existing) {
          existing.spending += item.amount
        } else {
          acc.push({ date: key, spending: item.amount, income: 0 })
        }
        return acc
      }, [])

      setTrendData(groupedTrend)
      setIncomeExpenseData(incomeExpenseRes.map(d => ({
        category: d.period,
        income: d.income,
        expenses: d.expense,
      })))
      setBreakdown(breakdownRes)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalSpending = categoryData.reduce((sum, cat) => sum + cat.value, 0)
  const totalIncome = incomeExpenseData.length > 0 ? incomeExpenseData[0].income : 0

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted mt-1">Visualize your spending patterns</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                period === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                period === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted'
              }`}
            >
              Year
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
            <Calendar className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium">{currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Income</p>
          <p className="text-3xl font-bold text-secondary">${totalIncome.toFixed(2)}</p>
          <p className="text-muted text-xs">This {period}</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Spending</p>
          <p className="text-3xl font-bold text-destructive">${totalSpending.toFixed(2)}</p>
          <p className="text-muted text-xs">
            {totalIncome > 0 ? `${((totalSpending / totalIncome) * 100).toFixed(1)}% of income` : 'No income recorded'}
          </p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Saved</p>
          <p className="text-3xl font-bold text-secondary">${Math.max(0, totalIncome - totalSpending).toFixed(2)}</p>
          <p className="text-muted text-xs">
            {totalIncome > 0 ? `${((1 - totalSpending / totalIncome) * 100).toFixed(1)}% savings rate` : 'No expenses yet'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      {loading ? (
        <div className="card p-12 text-center text-muted">Loading reports...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xl font-bold">Spending by Category</h2>
              {categoryData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} $${entry.value.toFixed(0)}`}
                        outerRadius={100}
                        fill="#4f8cff"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#181b20',
                          border: '1px solid #2a2f37',
                          borderRadius: '0.5rem',
                          color: '#f5f6f7',
                        }}
                        formatter={(value) => `$${(value as number).toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted">No spending data</div>
              )}
            </div>

            {/* Spending Trend */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xl font-bold">Spending Trend</h2>
              {trendData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f37" />
                      <XAxis dataKey="date" stroke="#9aa1ab" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9aa1ab" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#181b20',
                          border: '1px solid #2a2f37',
                          borderRadius: '0.5rem',
                          color: '#f5f6f7',
                        }}
                        formatter={(value) => `$${(value as number).toFixed(2)}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="spending"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Spending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted">No trend data</div>
              )}
            </div>
          </div>

          {/* Income vs Expenses */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-bold">Income vs Expenses</h2>
            {incomeExpenseData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeExpenseData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2f37" />
                    <XAxis dataKey="category" stroke="#9aa1ab" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9aa1ab" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#181b20',
                        border: '1px solid #2a2f37',
                        borderRadius: '0.5rem',
                        color: '#f5f6f7',
                      }}
                      formatter={(value) => `$${(value as number).toFixed(2)}`}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted">No data available</div>
            )}
          </div>

          {/* Category Details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-bold">Category Breakdown</h2>
            {breakdown.length > 0 ? (
              <div className="space-y-3">
                {breakdown.map((cat, idx) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-medium">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${cat.amount.toFixed(2)}</p>
                        <p className="text-muted text-xs">{cat.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full bg-input rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted">No spending data available</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
