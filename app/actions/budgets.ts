'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { budget, expense } from '@/lib/db/schema'
import { and, eq, desc, gte, lte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { endOfMonth, parseISO } from 'date-fns'
import { CATEGORIES } from '@/lib/categories'
import { getUserId } from '@/lib/auth-utils'
import { formatLocalDate } from '@/lib/date-utils'

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

export async function getBudgets(month?: string) {
  const userId = await getUserId()

  const budgetConditions = [eq(budget.userId, userId)]
  if (month) {
    budgetConditions.push(eq(budget.month, month))
  }

  const budgets = await db
    .select()
    .from(budget)
    .where(and(...budgetConditions))
    .orderBy(desc(budget.createdAt))

  if (budgets.length === 0) return []

  // Single grouped query instead of N+1
  const monthStart = `${budgets[0].month}-01`
  const monthEnd = formatLocalDate(endOfMonth(parseISO(monthStart)))

  const spentResults = await db
    .select({
      category: expense.category,
      spent: sql<string>`sum(${expense.amount}::numeric)`,
    })
    .from(expense)
    .where(
      and(
        eq(expense.userId, userId),
        gte(expense.date, monthStart),
        lte(expense.date, monthEnd)
      )
    )
    .groupBy(expense.category)

  const spentByCategory: Record<string, string> = {}
  for (const row of spentResults) {
    spentByCategory[row.category] = row.spent
  }

  return budgets.map((b) => ({
    ...b,
    spent: spentByCategory[b.category] ?? '0',
  }))
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
