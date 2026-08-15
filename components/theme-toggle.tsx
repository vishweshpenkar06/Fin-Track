'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const initial = stored || 'dark'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const applyTheme = (t: Theme) => {
    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', t === 'dark')
    }
  }

  const selectTheme = (t: Theme) => {
    setTheme(t)
    localStorage.setItem('theme', t)
    applyTheme(t)
    setOpen(false)
  }

  const icons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
        aria-expanded={open}
        className="p-2 rounded-lg hover:bg-card/50 transition-colors text-muted hover:text-foreground"
      >
        {icons[theme]}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 card p-1 min-w-[120px] z-50">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => selectTheme(t)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === t ? 'bg-primary/10 text-primary' : 'hover:bg-card/50 text-foreground'
              }`}
            >
              {icons[t]}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
