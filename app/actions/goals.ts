'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { goal } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth-utils'

const addGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  targetAmount: z.number().positive('Target must be positive'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().max(100).optional(),
})

const updateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().max(100).optional(),
})

export async function getGoals() {
  const userId = await getUserId()
  return db
    .select()
    .from(goal)
    .where(eq(goal.userId, userId))
    .orderBy(desc(goal.createdAt))
}

export async function addGoal(data: {
  name: string
  targetAmount: number
  deadline?: string
  category?: string
}) {
  const parsed = addGoalSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    throw new Error(Object.values(errors).flat().join('; ') || 'Invalid goal data')
  }

  const userId = await getUserId()
  const id = crypto.randomUUID()

  await db.insert(goal).values({
    id,
    userId,
    name: parsed.data.name,
    targetAmount: parsed.data.targetAmount.toString(),
    currentAmount: '0',
    deadline: parsed.data.deadline,
    category: parsed.data.category,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/dashboard')
  revalidatePath('/goals')
  return { id }
}

export async function updateGoal(
  id: string,
  data: {
    name?: string
    targetAmount?: number
    currentAmount?: number
    deadline?: string
    category?: string
  }
) {
  const parsed = updateGoalSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    throw new Error(Object.values(errors).flat().join('; ') || 'Invalid goal data')
  }

  const userId = await getUserId()

  await db
    .update(goal)
    .set({
      ...parsed.data,
      targetAmount: parsed.data.targetAmount?.toString(),
      currentAmount: parsed.data.currentAmount?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(goal.id, id), eq(goal.userId, userId)))

  revalidatePath('/dashboard')
  revalidatePath('/goals')
}

export async function deleteGoal(id: string) {
  const userId = await getUserId()
  await db.delete(goal).where(and(eq(goal.id, id), eq(goal.userId, userId)))
  revalidatePath('/dashboard')
  revalidatePath('/goals')
}
