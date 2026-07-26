// Spending predictions using statistical methods
// No external API needed — uses linear regression and trend analysis

interface SpendingData {
  date: string
  amount: number
  category?: string
}

interface Prediction {
  predictedAmount: number
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercent: number
}

// Simple linear regression
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0, r2: 0 }

  const sumX = data.reduce((s, d) => s + d.x, 0)
  const sumY = data.reduce((s, d) => s + d.y, 0)
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0)
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R² calculation
  const meanY = sumY / n
  const ssRes = data.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0)
  const ssTot = data.reduce((s, d) => s + (d.y - meanY) ** 2, 0)
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  return { slope, intercept, r2 }
}

export function predictNextMonthSpending(monthlyData: { month: string; total: number }[]): Prediction {
  if (monthlyData.length < 2) {
    return {
      predictedAmount: monthlyData[0]?.total ?? 0,
      confidence: 0,
      trend: 'stable',
      changePercent: 0,
    }
  }

  const regressionData = monthlyData.map((d, i) => ({ x: i, y: d.total }))
  const { slope, intercept, r2 } = linearRegression(regressionData)

  const nextX = monthlyData.length
  const predictedAmount = Math.max(0, slope * nextX + intercept)

  // Determine trend
  const recentAvg = monthlyData.slice(-3).reduce((s, d) => s + d.total, 0) / Math.min(3, monthlyData.length)
  const olderAvg = monthlyData.slice(0, Math.max(1, monthlyData.length - 3)).reduce((s, d) => s + d.total, 0) / Math.max(1, monthlyData.length - 3)
  const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (changePercent > 10) trend = 'increasing'
  else if (changePercent < -10) trend = 'decreasing'

  return {
    predictedAmount,
    confidence: Math.round(r2 * 100),
    trend,
    changePercent: Math.round(changePercent),
  }
}

export function predictCategorySpending(
  expenses: SpendingData[],
  category: string,
  _monthsAhead: number = 1
): Prediction {
  const categoryExpenses = expenses.filter(e => e.category === category)
  if (categoryExpenses.length < 2) {
    return { predictedAmount: 0, confidence: 0, trend: 'stable', changePercent: 0 }
  }

  // Group by month
  const monthlyTotals: Record<string, number> = {}
  for (const exp of categoryExpenses) {
    const month = exp.date.slice(0, 7)
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount
  }

  const sortedMonths = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))

  return predictNextMonthSpending(sortedMonths)
}

export function detectSpendingAnomalies(
  expenses: SpendingData[],
  threshold: number = 2
): { date: string; amount: number; category: string; zScore: number }[] {
  const anomalies: { date: string; amount: number; category: string; zScore: number }[] = []

  // Group by category
  const byCategory: Record<string, number[]> = {}
  for (const exp of expenses) {
    const cat = exp.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(exp.amount)
  }

  // Calculate z-scores
  for (const exp of expenses) {
    const cat = exp.category || 'Other'
    const amounts = byCategory[cat]
    if (amounts.length < 3) continue

    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    const zScore = (exp.amount - mean) / stdDev
    if (Math.abs(zScore) > threshold) {
      anomalies.push({
        date: exp.date,
        amount: exp.amount,
        category: cat,
        zScore: Math.round(zScore * 100) / 100,
      })
    }
  }

  return anomalies
}

export function calculateBudgetRecommendation(
  expenses: SpendingData[],
  category: string,
  targetSavingsRate: number = 0.2
): { recommended: number; basedOnMonths: number; confidence: number } {
  const categoryExpenses = expenses.filter(e => e.category === category)
  if (categoryExpenses.length === 0) {
    return { recommended: 0, basedOnMonths: 0, confidence: 0 }
  }

  // Group by month
  const monthlyTotals: Record<string, number> = {}
  for (const exp of categoryExpenses) {
    const month = exp.date.slice(0, 7)
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount
  }

  const months = Object.values(monthlyTotals)
  const avgMonthly = months.reduce((s, m) => s + m, 0) / months.length

  // Apply target savings rate
  const recommended = Math.ceil(avgMonthly * (1 + targetSavingsRate) / 10) * 10

  // Confidence based on data consistency
  const variance = months.reduce((s, m) => s + (m - avgMonthly) ** 2, 0) / months.length
  const cv = Math.sqrt(variance) / avgMonthly // Coefficient of variation
  const confidence = Math.max(0, Math.round((1 - cv) * 100))

  return {
    recommended,
    basedOnMonths: months.length,
    confidence,
  }
}
