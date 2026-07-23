'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense, income } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

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

export async function getSpendingByCategory(period: 'month' | 'year' = 'month'): Promise<SpendingByCategory[]> {
  const userId = await getUserId()
  
  let startDate, endDate
  const now = new Date()
  
  if (period === 'month') {
    startDate = startOfMonth(now)
    endDate = endOfMonth(now)
  } else {
    startDate = startOfYear(now)
    endDate = endOfYear(now)
  }
  
  const expenses = await db
    .select()
    .from(expense)
    .where(eq(expense.userId, userId))
  
  const filtered = expenses.filter(e => {
    const expDate = new Date(e.date)
    return expDate >= startDate && expDate <= endDate
  })
  
  const byCategory: Record<string, number> = {}
  
  filtered.forEach(exp => {
    if (exp.category !== 'Income') {
      const amount = parseFloat(exp.amount)
      byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
    }
  })
  
  return Object.entries(byCategory).map(([category, amount]) => ({
    category,
    amount,
  }))
}

export async function getSpendingOverTime(period: 'month' | 'year' = 'month'): Promise<SpendingOverTime[]> {
  const userId = await getUserId()
  
  let startDate, endDate
  const now = new Date()
  
  if (period === 'month') {
    startDate = startOfMonth(now)
    endDate = endOfMonth(now)
  } else {
    startDate = startOfYear(now)
    endDate = endOfYear(now)
  }
  
  const expenses = await db
    .select()
    .from(expense)
    .where(eq(expense.userId, userId))
  
  const filtered = expenses.filter(e => {
    const expDate = new Date(e.date)
    return expDate >= startDate && expDate <= endDate && e.category !== 'Income'
  })
  
  const byDate: Record<string, number> = {}
  
  filtered.forEach(exp => {
    const amount = parseFloat(exp.amount)
    byDate[exp.date] = (byDate[exp.date] || 0) + amount
  })
  
  return Object.entries(byDate)
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function getIncomeVsExpense(period: 'month' | 'year' = 'month'): Promise<IncomeVsExpense[]> {
  const userId = await getUserId()
  
  let startDate, endDate
  const now = new Date()
  
  if (period === 'month') {
    startDate = startOfMonth(now)
    endDate = endOfMonth(now)
  } else {
    startDate = startOfYear(now)
    endDate = endOfYear(now)
  }
  
  const expenses = await db
    .select()
    .from(expense)
    .where(eq(expense.userId, userId))
  
  const incomes = await db
    .select()
    .from(income)
    .where(eq(income.userId, userId))
  
  const filteredExpenses = expenses.filter(e => {
    const expDate = new Date(e.date)
    return expDate >= startDate && expDate <= endDate && e.category !== 'Income'
  })
  
  const filteredIncomes = incomes.filter(i => {
    const incDate = new Date(i.date)
    return incDate >= startDate && incDate <= endDate
  })
  
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0)
  
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
  
  let startDate, endDate
  const now = new Date()
  
  if (period === 'month') {
    startDate = startOfMonth(now)
    endDate = endOfMonth(now)
  } else {
    startDate = startOfYear(now)
    endDate = endOfYear(now)
  }
  
  const expenses = await db
    .select()
    .from(expense)
    .where(eq(expense.userId, userId))
  
  const filtered = expenses.filter(e => {
    const expDate = new Date(e.date)
    return expDate >= startDate && expDate <= endDate && e.category !== 'Income'
  })
  
  const byCategory: Record<string, number> = {}
  let total = 0
  
  filtered.forEach(exp => {
    const amount = parseFloat(exp.amount)
    byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
    total += amount
  })
  
  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}
