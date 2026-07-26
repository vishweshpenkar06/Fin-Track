'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { getAIInsights, type AIInsight } from '@/app/actions/ai-insights'

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadInsights() }, [])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const data = await getAIInsights()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-5 h-5" />
      case 'anomaly': return <AlertTriangle className="w-5 h-5" />
      case 'recommendation': return <Lightbulb className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getSeverityStyles = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'alert': return 'bg-destructive/10 border-destructive/30'
      case 'warning': return 'bg-budget-warning/10 border-budget-warning/30'
      default: return 'bg-primary/10 border-primary/30'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted mt-1">Smart analysis of your spending patterns</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          Analyzing your spending data...
        </div>
      ) : insights.length > 0 ? (
        <div className="grid gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className={`card p-5 border ${getSeverityStyles(insight.severity)}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  insight.severity === 'alert' ? 'bg-destructive/20 text-destructive' :
                  insight.severity === 'warning' ? 'bg-budget-warning/20 text-budget-warning' :
                  'bg-primary/20 text-primary'
                }`}>
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    {insight.confidence !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-card border border-border">
                        {insight.confidence}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{insight.description}</p>
                  {insight.amount !== undefined && (
                    <p className="text-lg font-bold mt-2">${insight.amount.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-muted">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Add more expenses to get AI-powered insights!</p>
          <p className="text-sm mt-2">We need at least a few months of data to generate predictions and recommendations.</p>
        </div>
      )}
    </div>
  )
}
