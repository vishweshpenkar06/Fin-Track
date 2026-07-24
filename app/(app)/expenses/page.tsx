'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react'
import { getExpenses, addExpense, updateExpense, deleteExpense } from '@/app/actions/expenses'
import { CATEGORIES } from '@/lib/categories'
import type { Expense } from '@/lib/types'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Groceries',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const data = await getExpenses()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddExpense = async () => {
    if (!formData.description || !formData.amount) return

    setSaving(true)
    try {
      if (editingId) {
        await updateExpense(editingId, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
        })
        setEditingId(null)
      } else {
        await addExpense({
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
        })
      }

      setShowAddModal(false)
      setFormData({
        description: '',
        amount: '',
        category: 'Groceries',
        date: new Date().toISOString().split('T')[0],
      })

      await loadExpenses()
    } catch (error) {
      console.error('Failed to save expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id)
    setFormData({
      description: exp.description ?? '',
      amount: exp.amount.toString(),
      category: exp.category,
      date: exp.date,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setDeletingId(id)
      try {
        await deleteExpense(id)
        await loadExpenses()
      } catch (error) {
        console.error('Failed to delete expense:', error)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const categoriesWithAll = ['All', ...CATEGORIES.filter(c => c !== 'Income')]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted mt-1">Track and manage your transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setFormData({
              description: '',
              amount: '',
              category: 'Groceries',
              date: new Date().toISOString().split('T')[0],
            })
            setShowAddModal(true)
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 space-y-4">
        <div className="relative">
          <label htmlFor="expense-search" className="sr-only">Search transactions</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="expense-search"
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by category">
          {categoriesWithAll.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-input border border-border hover:border-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted">Loading expenses...</div>
        ) : filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm font-semibold text-muted">
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{exp.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted text-sm">{exp.date}</td>
                    <td className="px-6 py-4 font-semibold text-right">-${parseFloat(exp.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          aria-label={`Edit ${exp.description || exp.category}`}
                          className="p-2 hover:bg-card/50 rounded-lg transition-colors text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          aria-label={`Delete ${exp.description || exp.category}`}
                          className="p-2 hover:bg-card/50 rounded-lg transition-colors text-muted hover:text-destructive disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {deletingId === exp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-muted">
            No expenses found. {expenses.length === 0 && "Add your first expense to get started."}
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Expense' : 'Add Expense'}>
          <div className="card max-w-md w-full p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
              <p className="text-muted text-sm mt-1">
                {editingId ? 'Update the transaction details' : 'Record a new transaction'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Coffee at Starbucks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="flex items-center">
                  <span className="text-muted mr-2">$</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.filter(c => c !== 'Income').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                onClick={handleAddExpense}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
