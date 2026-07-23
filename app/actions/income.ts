'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { income } from '@/lib/db/schema'
import { and, eq, desc, gte, lte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

const addIncomeSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  source: z.string().min(1, 'Source is required').max(200, 'Source must be 200 characters or fewer'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
})

const updateIncomeSchema = z.object({
  amount: z.number().positive('Amount must be a positive number').optional(),
  source: z.string().min(1, 'Source is required').max(200, 'Source must be 200 characters or fewer').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
})

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getIncome(filters?: { startDate?: string; endDate?: string }) {
  const userId = await getUserId()
  
  const conditions = [eq(income.userId, userId)]
  
  if (filters?.startDate) {
    conditions.push(gte(income.date, filters.startDate))
  }
  
  if (filters?.endDate) {
    conditions.push(lte(income.date, filters.endDate))
  }
  
  return db
    .select()
    .from(income)
    .where(and(...conditions))
    .orderBy(desc(income.createdAt))
}

export async function addIncome(data: {
  amount: number
  source: string
  date: string
  description?: string
}) {
  const parsed = addIncomeSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid income data')
  }

  const userId = await getUserId()

  const id = crypto.randomUUID()
  await db.insert(income).values({
    id,
    userId,
    amount: parsed.data.amount.toString(),
    source: parsed.data.source,
    date: parsed.data.date,
    description: parsed.data.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/dashboard')
  return { id }
}

export async function updateIncome(
  id: string,
  data: {
    amount?: number
    source?: string
    date?: string
    description?: string
  }
) {
  const parsed = updateIncomeSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.values(errors).flat().join('; ')
    throw new Error(message || 'Invalid income data')
  }

  const userId = await getUserId()

  await db
    .update(income)
    .set({
      ...parsed.data,
      amount: parsed.data.amount?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(income.id, id), eq(income.userId, userId)))

  revalidatePath('/dashboard')
}

export async function deleteIncome(id: string) {
  const userId = await getUserId()
  
  await db.delete(income).where(and(eq(income.id, id), eq(income.userId, userId)))
  
  revalidatePath('/dashboard')
}

export async function getTotalIncome(month?: string) {
  const userId = await getUserId()
  
  const conditions = [eq(income.userId, userId)]
  
  if (month) {
    const startDate = `${month}-01`
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    conditions.push(gte(income.date, startDate))
    conditions.push(lte(income.date, endDateStr))
  }
  
  const incomes = await db
    .select()
    .from(income)
    .where(and(...conditions))
  const total = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0)
  
  return total
}
