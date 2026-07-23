'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { budget, expense } from '@/lib/db/schema'
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getBudgets(month?: string) {
  const userId = await getUserId()
  
  const conditions = [eq(budget.userId, userId)]
  if (month) {
    conditions.push(eq(budget.month, month))
  }
  
  const budgets = await db
    .select()
    .from(budget)
    .where(and(...conditions))
    .orderBy(desc(budget.createdAt))
  
  // Calculate spent for each budget
  const withSpent = await Promise.all(
    budgets.map(async (b) => {
      const expenses = await db
        .select()
        .from(expense)
        .where(
          and(
            eq(expense.userId, userId),
            eq(expense.category, b.category),
            gte(expense.date, `${b.month}-01`),
            lte(expense.date, b.month + '-31')
          )
        )
      
      const spent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      
      return {
        ...b,
        spent: spent.toString(),
      }
    })
  )
  
  return withSpent
}

export async function addBudget(data: {
  category: string
  limit: number
  month: string
  alerts?: boolean
}) {
  const userId = await getUserId()
  
  const id = crypto.randomUUID()
  await db.insert(budget).values({
    id,
    userId,
    category: data.category,
    limit: data.limit.toString(),
    spent: '0',
    month: data.month,
    alerts: data.alerts ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  
  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { id }
}

export async function updateBudget(
  id: string,
  data: {
    limit?: number
    alerts?: boolean
  }
) {
  const userId = await getUserId()
  
  await db
    .update(budget)
    .set({
      ...data,
      limit: data.limit?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(budget.id, id), eq(budget.userId, userId)))
  
  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}

export async function deleteBudget(id: string) {
  const userId = await getUserId()
  
  await db.delete(budget).where(and(eq(budget.id, id), eq(budget.userId, userId)))
  
  revalidatePath('/budgets')
  revalidatePath('/dashboard')
}
