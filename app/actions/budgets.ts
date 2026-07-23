'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { budget, expense } from '@/lib/db/schema'
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { endOfMonth, parseISO } from 'date-fns'
import { CATEGORIES } from '@/lib/categories'

const BUDGET_CATEGORIES = CATEGORIES.filter(c => c !== 'Income') as unknown as [string, ...string[]]

const addBudgetSchema = z.object({
  category: z.enum(BUDGET_CATEGORIES, { message: 'Invalid category' }),
  limit: z.number().positive('Budget limit must be a positive number'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  alerts: z.boolean().optional(),
})

const updateBudgetSchema = z.object({
  limit: z.number().positive('Budget limit must be a positive number').optional(),
  alerts: z.boolean().optional(),
})

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
      const monthStart = `${b.month}-01`
      const monthEnd = formatLocalDate(endOfMonth(parseISO(monthStart)))

      const expenses = await db
        .select()
        .from(expense)
        .where(
          and(
            eq(expense.userId, userId),
            eq(expense.category, b.category),
            gte(expense.date, monthStart),
            lte(expense.date, monthEnd)
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
  const parsed = addBudgetSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid budget data')
  }

  const userId = await getUserId()

  const id = crypto.randomUUID()
  await db.insert(budget).values({
    id,
    userId,
    category: parsed.data.category,
    limit: parsed.data.limit.toString(),
    spent: '0',
    month: parsed.data.month,
    alerts: parsed.data.alerts ?? true,
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
  const parsed = updateBudgetSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid budget data')
  }

  const userId = await getUserId()

  await db
    .update(budget)
    .set({
      ...parsed.data,
      limit: parsed.data.limit?.toString(),
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
