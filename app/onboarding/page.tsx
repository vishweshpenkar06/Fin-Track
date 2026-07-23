'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, ArrowRight, Check, Loader2 } from 'lucide-react'
import { addBudget } from '@/app/actions/budgets'
import { updateUserCurrency } from '@/app/actions/settings'
import { getCurrentMonth } from '@/lib/date-utils'
import { CATEGORIES } from '@/lib/categories'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [currency, setCurrency] = useState('USD')
  const [budget, setBudget] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNext = async () => {
    if (step === 1) {
      try {
        await updateUserCurrency(currency)
      } catch (err) {
        console.error('Failed to save currency:', err)
      }
    }
    if (step < 2) {
      setStep(step + 1)
    } else {
      handleCreateBudgetAndRedirect()
    }
  }

  const handleSkip = async () => {
    if (step === 1) {
      try {
        await updateUserCurrency(currency)
      } catch (err) {
        console.error('Failed to save currency:', err)
      }
    }
    router.push('/dashboard')
  }

  const handleCreateBudgetAndRedirect = async () => {
    if (step === 2 && budget) {
      try {
        setLoading(true)
        setError('')

        const currentMonth = getCurrentMonth()
        await addBudget({
          category,
          limit: parseFloat(budget),
          month: currentMonth,
        })

        router.push('/dashboard')
      } catch (err) {
        setError('Failed to create budget. Please try again.')
        console.error('Error creating budget:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const categoriesWithoutIncome = CATEGORIES.filter(c => c !== 'Income')

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-border py-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">FinTrack</span>
        </Link>
      </div>

      {/* Progress */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 max-w-md">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-input'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 space-y-6">
            {step === 1 && (
              <>
                <div>
                  <h1 className="text-2xl font-bold">Set Your Currency</h1>
                  <p className="text-muted text-sm mt-1">Choose your default currency for all transactions</p>
                </div>
                <div className="space-y-3">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-colors ${
                        currency === c
                          ? 'bg-primary/10 border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium">{c}</span>
                      {currency === c && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h1 className="text-2xl font-bold">Create Your First Budget</h1>
                  <p className="text-muted text-sm mt-1">Set a monthly budget for a spending category (optional)</p>
                </div>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="onboarding-category" className="block text-sm font-medium mb-2">Category</label>
                    <select
                      id="onboarding-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categoriesWithoutIncome.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="onboarding-budget" className="block text-sm font-medium mb-2">Monthly Budget Limit</label>
                    <div className="flex items-center">
                      <span className="text-muted mr-2">{currency}</span>
                      <input
                        id="onboarding-budget"
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="500.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSkip}
                className="flex-1 btn-secondary disabled:opacity-50"
                disabled={loading}
              >
                {step === 2 ? 'Skip' : 'Skip'}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading || (step === 2 && !budget)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    {step === 2 ? 'Get Started' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
