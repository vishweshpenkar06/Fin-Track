'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Target, Loader2, TrendingUp } from 'lucide-react'
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/app/actions/goals'

interface Goal {
  id: string
  name: string
  targetAmount: string
  currentAmount: string
  deadline: string | null
  category: string | null
  createdAt: Date
  updatedAt: Date
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: '',
  })

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const data = await getGoals()
      setGoals(data as Goal[])
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!formData.name || !formData.targetAmount) return
    setSaving(true)
    try {
      if (editingId) {
        await updateGoal(editingId, {
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          deadline: formData.deadline || undefined,
          category: formData.category || undefined,
        })
      } else {
        await addGoal({
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          deadline: formData.deadline || undefined,
          category: formData.category || undefined,
        })
      }
      setShowAddModal(false)
      setEditingId(null)
      setFormData({ name: '', targetAmount: '', deadline: '', category: '' })
      await loadGoals()
    } catch (error) {
      console.error('Failed to save goal:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (g: Goal) => {
    setEditingId(g.id)
    setFormData({
      name: g.name,
      targetAmount: g.targetAmount,
      deadline: g.deadline || '',
      category: g.category || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this goal?')) {
      setDeletingId(id)
      try {
        await deleteGoal(id)
        await loadGoals()
      } catch (error) {
        console.error('Failed to delete goal:', error)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleAddProgress = async (g: Goal) => {
    const amount = prompt('Add progress amount ($):')
    if (amount && !isNaN(parseFloat(amount))) {
      const newAmount = parseFloat(g.currentAmount) + parseFloat(amount)
      await updateGoal(g.id, { currentAmount: newAmount })
      await loadGoals()
    }
  }

  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0)
  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || '0'), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-muted mt-1">Track your savings targets</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', targetAmount: '', deadline: '', category: '' }); setShowAddModal(true) }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Target</p>
          <p className="text-3xl font-bold">${totalTarget.toFixed(2)}</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Total Saved</p>
          <p className="text-3xl font-bold text-secondary">${totalSaved.toFixed(2)}</p>
        </div>
        <div className="card p-6 space-y-2">
          <p className="text-muted text-sm">Overall Progress</p>
          <p className="text-3xl font-bold">{totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%</p>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="card p-12 text-center text-muted">Loading goals...</div>
        ) : goals.length > 0 ? (
          goals.map((g) => {
            const current = parseFloat(g.currentAmount || '0')
            const target = parseFloat(g.targetAmount)
            const percentage = Math.min((current / target) * 100, 100)
            const isComplete = current >= target

            return (
              <div key={g.id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isComplete ? 'bg-secondary/10' : 'bg-primary/10'}`}>
                      <Target className={`w-6 h-6 ${isComplete ? 'text-secondary' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{g.name}</h3>
                      {g.category && <p className="text-muted text-sm">{g.category}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(g)} disabled={deletingId === g.id} className="p-2 hover:bg-card/50 rounded-lg text-muted hover:text-foreground disabled:opacity-50">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(g.id)} disabled={deletingId === g.id} className="p-2 hover:bg-card/50 rounded-lg text-muted hover:text-destructive disabled:opacity-50">
                      {deletingId === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">${current.toFixed(2)} saved</span>
                    <span className="font-semibold">${target.toFixed(2)} target</span>
                  </div>
                  <div className="w-full bg-input rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all ${isComplete ? 'bg-secondary' : percentage >= 80 ? 'bg-budget-warning' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {g.deadline && (
                    <p className="text-xs text-muted">Deadline: {new Date(g.deadline).toLocaleDateString()}</p>
                  )}
                </div>

                {!isComplete && (
                  <button onClick={() => handleAddProgress(g)} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Add Progress
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div className="card p-12 text-center text-muted">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No goals yet. Create your first savings goal!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="card max-w-md w-full p-6 space-y-6">
            <h2 className="text-2xl font-bold">{editingId ? 'Edit Goal' : 'New Goal'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Emergency Fund" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Amount ($)</label>
                <input type="number" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="10000" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Deadline (optional)</label>
                <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category (optional)</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Vacation, Emergency" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAddModal(false); setEditingId(null) }} disabled={saving} className="flex-1 btn-secondary disabled:opacity-50">Cancel</button>
              <button onClick={handleAddGoal} disabled={saving || !formData.name || !formData.targetAmount} className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'} Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
