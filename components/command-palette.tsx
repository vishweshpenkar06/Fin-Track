'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, LayoutDashboard, Receipt, PiggyBank, BarChart3, Settings, Target, X } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'actions'
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, action: () => router.push('/dashboard'), category: 'navigation' },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" />, action: () => router.push('/expenses'), category: 'navigation' },
    { id: 'budgets', label: 'Budgets', icon: <PiggyBank className="w-4 h-4" />, action: () => router.push('/budgets'), category: 'navigation' },
    { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" />, action: () => router.push('/goals'), category: 'navigation' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, action: () => router.push('/reports'), category: 'navigation' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, action: () => router.push('/settings'), category: 'navigation' },
    { id: 'add-expense', label: 'Add Expense', icon: <Plus className="w-4 h-4" />, action: () => router.push('/expenses'), category: 'actions' },
  ]

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(prev => !prev)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (cmd: CommandItem) => {
    cmd.action()
    setOpen(false)
  }

  const handleKeyDownInPalette = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="card max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInPalette}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent outline-none text-sm"
            suppressHydrationWarning
          />
          <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-4">No results found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  i === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-card/50 text-foreground'
                }`}
              >
                {cmd.icon}
                <span>{cmd.label}</span>
                {cmd.category === 'actions' && (
                  <span className="ml-auto text-xs text-muted">Action</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-xs text-muted flex items-center justify-between">
          <span>↑↓ Navigate · Enter Select · Esc Close</span>
          <span>⌘K Toggle</span>
        </div>
      </div>
    </div>
  )
}
