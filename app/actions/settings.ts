'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense, budget, income } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
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
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user data:', error)
    throw error
  }
}

export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }
}
