'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, TrendingUp, Loader2 } from 'lucide-react'
import { getBudgets, addBudget, updateBudget, deleteBudget } from '@/app/actions/budgets'
import { CATEGORIES } from '@/lib/categories'
import { getCurrentMonth } from '@/lib/date-utils'

function getBudgetStatus(spent: number, limit: number) {
  const percentage = (spent / limit) * 100
  if (percentage >= 100) return { status: 'danger', label: 'Over budget' }
  if (percentage >= 80) return { status: 'warning', label: 'Nearing limit' }
  return { status: 'success', label: 'On track' }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'danger':
      return 'text-destructive'
    case 'warning':
      return 'text-budget-warning'
    case 'success':
      return 'text-secondary'
    default:
      return 'text-foreground'
  }
}

export default function BudgetsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [budgets, setBudgets] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: 'Groceries',
    limit: '',
  })

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const currentMonth = getCurrentMonth()
      const data = await getBudgets(currentMonth)
      setBudgets(data)
    } catch (error) {
      console.error('Failed to load budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBudget = async () => {
    if (!formData.limit || !formData.category) return

    setSaving(true)
    try {
      const currentMonth = getCurrentMonth()

      if (editingId) {
        await updateBudget(editingId, {
          limit: parseFloat(formData.limit),
        })
        setEditingId(null)
      } else {
        await addBudget({
          category: formData.category,
          limit: parseFloat(formData.limit),
          month: currentMonth,
        })
      }

      setShowAddModal(false)
      setFormData({
        category: 'Groceries',
        limit: '',
      })

      await loadBudgets()
    } catch (error) {
      console.error('Failed to save budget:', error)
    } finally {
      setSaving(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (budget: any) => {
    setEditingId(budget.id)
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      setDeletingId(id)
      try {
        await deleteBudget(id)
        await loadBudgets()
      } catch (error) {
        console.error('Failed to delete budget:', error)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.limit), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const categoriesWithoutIncome = CATEGORIES.filter(c => c !== 'Income')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted mt-1">Manage your spending limits by category</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setFormData({
              category: 'Groceries',
              limit: '',
            })
            setShowAddModal(true)
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Budget</p>
          <p className="text-3xl font-bold">${totalBudget.toFixed(2)}</p>
          <p className="text-muted text-xs">{budgets.length} categories</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Spent</p>
          <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-destructive text-xs">{budgetUtilization.toFixed(0)}% utilization</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Remaining</p>
          <p className="text-3xl font-bold text-secondary">${Math.max(0, totalBudget - totalSpent).toFixed(2)}</p>
          <p className="text-secondary text-xs">Available to spend</p>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="card p-12 text-center text-muted">Loading budgets...</div>
        ) : budgets.length > 0 ? (
          budgets.map((budget) => {
            const spent = parseFloat(budget.spent || 0)
            const limit = parseFloat(budget.limit)
            const { status, label } = getBudgetStatus(spent, limit)
            const percentage = (spent / limit) * 100
            const statusColor = getStatusColor(status)

            return (
              <div key={budget.id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      {budget.category[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{budget.category}</h3>
                      <p className="text-muted text-sm">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      disabled={deletingId === budget.id}
                      aria-label={`Edit ${budget.category} budget`}
                      className="p-2 hover:bg-card/50 rounded-lg transition-colors text-muted hover:text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      aria-label={`Delete ${budget.category} budget`}
                      className="p-2 hover:bg-card/50 rounded-lg transition-colors text-muted hover:text-destructive disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {deletingId === budget.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${statusColor}`}>{label}</span>
                      <span className="text-muted text-xs">({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${spent.toFixed(2)} / ${limit.toFixed(2)}</p>
                      <p className="text-muted text-xs">${Math.max(0, limit - spent).toFixed(2)} left</p>
                    </div>
                  </div>

                  <div
                    className="w-full bg-input rounded-full h-3 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(percentage)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${budget.category} budget: ${percentage.toFixed(0)}% spent`}
                  >
                    <div
                      className={`h-full transition-all ${
                        status === 'danger'
                          ? 'bg-destructive'
                          : status === 'warning'
                            ? 'bg-budget-warning'
                            : 'bg-secondary'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Trend */}
                <div className="text-xs text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {percentage > 80 ? 'Approaching limit' : 'On track'}
                </div>
              </div>
            )
          })
        ) : (
          <div className="card p-12 text-center text-muted">
            No budgets yet. Create one to get started!
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Budget' : 'Create Budget'}>
          <div className="card max-w-md w-full p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{editingId ? 'Edit Budget' : 'Create Budget'}</h2>
              <p className="text-muted text-sm mt-1">
                {editingId ? 'Update the budget limit' : 'Set a spending limit for a category'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!!editingId}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  {categoriesWithoutIncome.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monthly Limit</label>
                <div className="flex items-center">
                  <span className="text-muted mr-2">$</span>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="500.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingId(null)
                }}
                disabled={saving}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBudget}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
