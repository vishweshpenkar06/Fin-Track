'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, Lock, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FinTrack</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-muted hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-block px-4 py-2 bg-card border border-primary/20 rounded-lg">
            <span className="text-sm text-primary">Track • Budget • Understand</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-balance leading-tight">
            Take Control of Your Money
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto text-balance">
            Track expenses automatically, set smart budgets, and get insights into your spending patterns. FinTrack makes financial management simple and intuitive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup" className="btn-primary inline-flex items-center justify-center gap-2">
              Start Tracking
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary inline-flex items-center justify-center">
              Already a member?
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid sm:grid-cols-3 gap-8 mt-20">
          <div className="card p-6 space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Track Expenses</h3>
            <p className="text-muted">Manually add expenses or connect your bank account for automatic transaction tracking</p>
          </div>
          <div className="card p-6 space-y-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-lg">Smart Budgets</h3>
            <p className="text-muted">Set category budgets and get alerted when you&apos;re approaching your limits</p>
          </div>
          <div className="card p-6 space-y-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Secure & Private</h3>
            <p className="text-muted">Your financial data is encrypted and never shared with third parties</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to understand your money?</h2>
          <p className="text-muted max-w-lg mx-auto">
            Join thousands of users who are taking control of their finances with FinTrack
          </p>
          <Link href="/signup" className="btn-primary inline-flex items-center justify-center gap-2">
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted text-sm">
          <p>&copy; 2026 FinTrack. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
