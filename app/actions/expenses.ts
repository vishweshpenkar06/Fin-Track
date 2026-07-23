'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense } from '@/lib/db/schema'
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { parseISO } from 'date-fns'
import { CATEGORIES } from '@/lib/categories'

const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c !== 'Income') as unknown as [string, ...string[]]

const addExpenseSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Invalid category' }),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  paymentMethod: z.string().max(50).optional(),
  receipt: z.string().max(2000).optional(),
})

const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be a positive number').optional(),
  category: z.enum(EXPENSE_CATEGORIES, { message: 'Invalid category' }).optional(),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  paymentMethod: z.string().max(50).optional(),
  receipt: z.string().max(2000).optional(),
})

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getExpenses(filters?: { category?: string; startDate?: string; endDate?: string }) {
  const userId = await getUserId()
  
  const conditions = [eq(expense.userId, userId)]
  
  if (filters?.category) {
    conditions.push(eq(expense.category, filters.category))
  }
  
  if (filters?.startDate) {
    conditions.push(gte(expense.date, filters.startDate))
  }
  
  if (filters?.endDate) {
    conditions.push(lte(expense.date, filters.endDate))
  }
  
  return db
    .select()
    .from(expense)
    .where(and(...conditions))
    .orderBy(desc(expense.createdAt))
}

export async function addExpense(data: {
  amount: number
  category: string
  description?: string
  date: string
  paymentMethod?: string
  receipt?: string
}) {
  const parsed = addExpenseSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid expense data')
  }

  const userId = await getUserId()

  const id = crypto.randomUUID()
  await db.insert(expense).values({
    id,
    userId,
    amount: parsed.data.amount.toString(),
    category: parsed.data.category,
    description: parsed.data.description,
    date: parsed.data.date,
    paymentMethod: parsed.data.paymentMethod || 'cash',
    receipt: parsed.data.receipt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { id }
}

export async function updateExpense(
  id: string,
  data: {
    amount?: number
    category?: string
    description?: string
    date?: string
    paymentMethod?: string
    receipt?: string
  }
) {
  const parsed = updateExpenseSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid expense data')
  }

  const userId = await getUserId()

  await db
    .update(expense)
    .set({
      ...parsed.data,
      amount: parsed.data.amount?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(expense.id, id), eq(expense.userId, userId)))

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}

export async function deleteExpense(id: string) {
  const userId = await getUserId()
  
  await db.delete(expense).where(and(eq(expense.id, id), eq(expense.userId, userId)))
  
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}

export async function getExpensesByCategory(month?: string) {
  const userId = await getUserId()
  
  const conditions = [eq(expense.userId, userId)]
  
  if (month) {
    const startDate = `${month}-01`
    const endDate = new Date(parseISO(`${month}-01`))
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    conditions.push(gte(expense.date, startDate))
    conditions.push(lte(expense.date, endDateStr))
  }
  
  const expenses = await db
    .select()
    .from(expense)
    .where(and(...conditions))
  
  const grouped: Record<string, number> = {}
  for (const exp of expenses) {
    grouped[exp.category] = (grouped[exp.category] || 0) + parseFloat(exp.amount)
  }
  
  return grouped
}
