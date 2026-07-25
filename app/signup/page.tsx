'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import AuthForm from '@/components/auth-form'
import GoogleSignIn from '@/components/google-sign-in'

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/dashboard')

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

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-muted text-sm mt-1">Get started with FinTrack today</p>
            </div>

            <AuthForm mode="sign-up" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted">or</span>
              </div>
            </div>

            <GoogleSignIn />

            <div className="text-center text-sm">
              <span className="text-muted">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
