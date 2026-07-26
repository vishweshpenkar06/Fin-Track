'use server'

import { db } from '@/lib/db'
import { expense, budget } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { getUserId } from '@/lib/auth-utils'
import { suggestCategory, getSuggestionConfidence } from '@/lib/ai/categorizer'
import { predictNextMonthSpending, detectSpendingAnomalies, calculateBudgetRecommendation } from '@/lib/ai/predictor'

export interface AIInsight {
  type: 'prediction' | 'anomaly' | 'recommendation' | 'suggestion'
  title: string
  description: string
  severity: 'info' | 'warning' | 'alert'
  category?: string
  amount?: number
  confidence?: number
}

export async function getAIInsights(): Promise<AIInsight[]> {
  const userId = await getUserId()
  const insights: AIInsight[] = []

  // Get last 6 months of expenses
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const startDate = formatLocalDate(sixMonthsAgo)

  const expenses = await db
    .select()
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, startDate)
      )
    )

  if (expenses.length === 0) return insights

  // 1. Spending predictions
  const monthlyTotals: Record<string, number> = {}
  for (const exp of expenses) {
    const month = exp.date.slice(0, 7)
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(exp.amount)
  }

  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))

  if (monthlyData.length >= 2) {
    const prediction = predictNextMonthSpending(monthlyData)
    if (prediction.confidence >= 30) {
      insights.push({
        type: 'prediction',
        title: 'Spending Forecast',
        description: `Based on your trend, you're predicted to spend ~$${prediction.predictedAmount.toFixed(0)} next month. Spending is ${prediction.trend} (${prediction.changePercent > 0 ? '+' : ''}${prediction.changePercent}%).`,
        severity: prediction.trend === 'increasing' ? 'warning' : 'info',
        amount: prediction.predictedAmount,
        confidence: prediction.confidence,
      })
    }
  }

  // 2. Category predictions
  const categories = [...new Set(expenses.map(e => e.category))]
  for (const category of categories.slice(0, 5)) {
    const prediction = predictNextMonthSpending(
      Object.entries(
        expenses
          .filter(e => e.category === category)
          .reduce((acc, e) => {
            const m = e.date.slice(0, 7)
            acc[m] = (acc[m] || 0) + parseFloat(e.amount)
            return acc
          }, {} as Record<string, number>)
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total }))
    )

    if (prediction.confidence >= 40 && prediction.trend === 'increasing') {
      insights.push({
        type: 'prediction',
        title: `${category} Spending Rising`,
        description: `Your ${category} spending has been increasing. Predicted: $${prediction.predictedAmount.toFixed(0)} next month.`,
        severity: 'warning',
        category,
        amount: prediction.predictedAmount,
        confidence: prediction.confidence,
      })
    }
  }

  // 3. Anomaly detection
  const anomalies = detectSpendingAnomalies(
    expenses.map(e => ({
      date: e.date,
      amount: parseFloat(e.amount),
      category: e.category,
    }))
  )

  for (const anomaly of anomalies.slice(0, 3)) {
    insights.push({
      type: 'anomaly',
      title: 'Unusual Transaction',
      description: `Your $${anomaly.amount.toFixed(2)} ${anomaly.category} expense on ${anomaly.date} is ${Math.abs(anomaly.zScore).toFixed(1)}x your average.`,
      severity: 'alert',
      category: anomaly.category,
      amount: anomaly.amount,
    })
  }

  // 4. Budget recommendations
  const budgets = await db
    .select()
    .from(budget)
    .where(eq(budget.userId, userId))

  const budgetedCategories = new Set(budgets.map(b => b.category))

  for (const category of categories.slice(0, 3)) {
    if (!budgetedCategories.has(category)) {
      const recommendation = calculateBudgetRecommendation(
        expenses.map(e => ({
          date: e.date,
          amount: parseFloat(e.amount),
          category: e.category,
        })),
        category
      )

      if (recommendation.basedOnMonths >= 2 && recommendation.confidence >= 40) {
        insights.push({
          type: 'recommendation',
          title: `Suggested Budget: ${category}`,
          description: `Based on ${recommendation.basedOnMonths} months of data, consider setting a $${recommendation.recommended}/month budget for ${category}.`,
          severity: 'info',
          category,
          amount: recommendation.recommended,
          confidence: recommendation.confidence,
        })
      }
    }
  }

  return insights
}

export async function suggestCategoryForDescription(description: string): Promise<{
  category: string | null
  confidence: number
} | null> {
  if (!description || description.length < 3) return null

  const category = suggestCategory(description)
  if (!category) return null

  return {
    category,
    confidence: getSuggestionConfidence(description),
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
