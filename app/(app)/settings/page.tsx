'use client'

import { useState, useEffect } from 'react'
import { Bell, Lock, Download, Trash2, LogOut, User, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, deleteAllUserData, updateNotificationPreferences, updateUserName } from '@/app/actions/settings'
import { getExpenses } from '@/app/actions/expenses'
import { getBudgets } from '@/app/actions/budgets'
import { getIncome } from '@/app/actions/income'
import { authClient } from '@/lib/auth-client'

export default function SettingsPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
  })
  const [notificationPrefs, setNotificationPrefs] = useState({
    budgetAlerts: true,
    weeklySummary: true,
    aiInsights: false,
  })

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const userData = await getCurrentUser()
      setUser(userData)
      setFormData({
        name: userData.name || '',
      })
      if (userData.notificationPreferences) {
        setNotificationPrefs(userData.notificationPreferences as typeof notificationPrefs)
      }
    } catch (err) {
      console.error('Failed to load user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError('')
      setSuccess('')

      await updateUserName(formData.name)

      setUser((prev: typeof user) => prev ? { ...prev, name: formData.name } : prev)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      const [expenses, budgets, incomes] = await Promise.all([
        getExpenses(),
        getBudgets(),
        getIncome(),
      ])
      const data = {
        user,
        expenses,
        budgets,
        incomes,
        exportDate: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'fintrack-data.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export data')
      console.error('Export error:', err)
    }
  }

  const handleDeleteData = async () => {
    try {
      setIsDeleting(true)
      setError('')
      
      await deleteAllUserData()
      
      setShowDeleteConfirm(false)
      setSuccess('All your data has been deleted')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError('Failed to delete data')
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted mt-1">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 text-secondary">
          {success}
        </div>
      )}

      {/* Profile Section */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </h2>
            <p className="text-muted text-sm">Update your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary opacity-60"
              placeholder="Your email"
            />
            <p className="text-muted text-xs mt-1">Email updates coming soon</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Created</label>
            <p className="px-4 py-2 text-muted text-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </h2>
            <p className="text-muted text-sm">Manage your security settings</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg opacity-50">
            <span className="font-medium">Change Password</span>
            <span className="text-muted text-sm">Managed via email</span>
          </div>
          <div className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-lg opacity-50">
            <span className="font-medium">Two-Factor Authentication</span>
            <span className="text-muted text-sm">Not available yet</span>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
            <p className="text-muted text-sm">Control how you receive alerts</p>
          </div>
        </div>

        <div className="space-y-4">
          {([
            { key: 'budgetAlerts' as const, label: 'Budget Alerts', desc: "Get notified when you're close to your budget limits" },
            { key: 'weeklySummary' as const, label: 'Weekly Summary', desc: 'Receive a weekly summary of your spending' },
            { key: 'aiInsights' as const, label: 'AI Insights', desc: 'Get personalized spending insights and recommendations' },
          ]).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs[key]}
                onChange={async (e) => {
                  const updated = { ...notificationPrefs, [key]: e.target.checked }
                  setNotificationPrefs(updated)
                  try {
                    await updateNotificationPreferences({ [key]: e.target.checked })
                  } catch (err) {
                    console.error('Failed to save notification preference:', err)
                  }
                }}
                className="w-4 h-4 rounded border-border bg-input accent-primary"
              />
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-muted text-xs">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Data Management</h2>
            <p className="text-muted text-sm">Export or delete your data</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full btn-secondary flex items-center gap-2 justify-center"
          >
            <Download className="w-4 h-4" />
            Export My Data
          </button>
          <p className="text-muted text-xs">Download all your financial data as JSON</p>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete All Financial Data
          </button>
          <p className="text-muted text-xs">Permanently delete all expenses, budgets, and income records (keeps your account)</p>
        </div>
      </div>

      {/* Logout Section */}
      <div className="card p-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-card/50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Delete All Data">
          <div className="card max-w-md w-full p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Delete All Data?</h2>
              <p className="text-muted text-sm mt-2">
                This will permanently delete all your expenses, budgets, and income records. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={isDeleting}
                className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
