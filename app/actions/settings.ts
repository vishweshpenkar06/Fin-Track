'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense, budget, income, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth-utils'

export async function getCurrentUser() {
  const userId = await getUserId()
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  return row
}

export async function updateUserCurrency(currency: string) {
  const userId = await getUserId()
  await db.update(user).set({ currency, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  revalidatePath('/settings')
}

export async function updateUserName(name: string) {
  if (!name.trim()) throw new Error('Name is required')
  const { headers } = await import('next/headers')
  await auth.api.updateUser({ body: { name: name.trim() }, headers: await headers() })
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export async function updateNotificationPreferences(prefs: {
  budgetAlerts?: boolean
  weeklySummary?: boolean
  aiInsights?: boolean
}) {
  const userId = await getUserId()
  const [current] = await db.select({ notificationPreferences: user.notificationPreferences }).from(user).where(eq(user.id, userId)).limit(1)
  const merged = { ...(current?.notificationPreferences as Record<string, boolean> ?? {}), ...prefs }
  await db.update(user).set({ notificationPreferences: merged, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/settings')
}

export async function deleteAllUserData() {
  const userId = await getUserId()

  try {
    // Delete all expenses
    await db.delete(expense).where(eq(expense.userId, userId))

    // Delete all budgets
    await db.delete(budget).where(eq(budget.userId, userId))

    // Delete all income
    await db.delete(income).where(eq(income.userId, userId))

    revalidatePath('/dashboard')
    revalidatePath('/expenses')
    revalidatePath('/budgets')
    revalidatePath('/reports')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user data:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { headers } = await import('next/headers')
    await auth.api.signOut({ headers: await headers() })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }
}
