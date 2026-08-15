'use client'

import { TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Sparkline from '@/components/sparkline'

interface SummaryCardsProps {
  balance: number
  totalIncome: number
  totalExpenses: number
  incomeTrend: number[]
  expenseTrend: number[]
}

export default function SummaryCards({ balance, totalIncome, totalExpenses, incomeTrend, expenseTrend }: SummaryCardsProps) {
  const balanceTrend = incomeTrend.map((inc, i) => inc - (expenseTrend[i] || 0))

  return (
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">Income - Expenses</p>
          <Sparkline data={balanceTrend} color="#6366f1" height={24} width={60} />
        </div>
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">This month</p>
          <Sparkline data={incomeTrend} color="#22C55E" height={24} width={60} />
        </div>
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">This month</p>
          <Sparkline data={expenseTrend} color="#EF4444" height={24} width={60} />
        </div>
      </div>
    </div>
  )
}
