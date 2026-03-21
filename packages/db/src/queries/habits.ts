import { eq, and, gte, lte, desc, sql, isNull } from 'drizzle-orm'
import type { DbClient } from '../client'
import { habits, habitTargets, habitLogs, rewards, pointsBalance } from '../schema/habits'

type DB = DbClient

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getHabits(db: DB, tenantId: string) {
  return db.query.habits.findMany({
    where: and(eq(habits.tenantId, tenantId), eq(habits.archived, false)),
    with: { targets: true },
    orderBy: [habits.createdAt],
  })
}

export async function getHabit(db: DB, tenantId: string, id: string) {
  return db.query.habits.findFirst({
    where: and(eq(habits.id, id), eq(habits.tenantId, tenantId)),
    with: { targets: true },
  })
}

export async function createHabit(
  db: DB,
  tenantId: string,
  data: {
    name: string
    icon?: string
    color?: string
    unit?: string
    unitLabel?: string
    type?: string
    pointsPerLog?: string
    notes?: string
  }
) {
  const [habit] = await db.insert(habits).values({ tenantId, ...data }).returning()
  return habit
}

export async function updateHabit(
  db: DB,
  tenantId: string,
  id: string,
  data: Partial<typeof habits.$inferInsert>
) {
  const [habit] = await db
    .update(habits)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(habits.id, id), eq(habits.tenantId, tenantId)))
    .returning()
  return habit
}

export async function deleteHabit(db: DB, tenantId: string, id: string) {
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.tenantId, tenantId)))
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export async function upsertHabitTarget(
  db: DB,
  habitId: string,
  frequency: string,
  targetValue: string,
  targetType: string
) {
  const [target] = await db
    .insert(habitTargets)
    .values({ habitId, frequency, targetValue, targetType })
    .onConflictDoUpdate({
      target: [habitTargets.habitId, habitTargets.frequency],
      set: { targetValue, targetType },
    })
    .returning()
  return target
}

export async function deleteHabitTarget(db: DB, habitId: string, frequency: string) {
  await db
    .delete(habitTargets)
    .where(and(eq(habitTargets.habitId, habitId), eq(habitTargets.frequency, frequency)))
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function logHabit(
  db: DB,
  tenantId: string,
  habitId: string,
  data: { value?: string; loggedAt?: Date; source?: string; notes?: string }
) {
  const [log] = await db
    .insert(habitLogs)
    .values({ tenantId, habitId, ...data })
    .returning()
  return log
}

export async function getHabitLogs(
  db: DB,
  tenantId: string,
  habitId: string,
  limit = 50,
  offset = 0
) {
  return db.query.habitLogs.findMany({
    where: and(eq(habitLogs.habitId, habitId), eq(habitLogs.tenantId, tenantId)),
    orderBy: [desc(habitLogs.loggedAt)],
    limit,
    offset,
  })
}

/** Sum of logs for a habit within a date range */
export async function getHabitLogSum(
  db: DB,
  tenantId: string,
  habitId: string,
  from: Date,
  to: Date
): Promise<number> {
  const result = await db
    .select({ total: sql<string>`coalesce(sum(${habitLogs.value}), 0)` })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.tenantId, tenantId),
        eq(habitLogs.habitId, habitId),
        gte(habitLogs.loggedAt, from),
        lte(habitLogs.loggedAt, to)
      )
    )
  return parseFloat(result[0]?.total ?? '0')
}

/** Daily totals for a habit over N days (for streak calculation) */
export async function getDailyTotals(
  db: DB,
  tenantId: string,
  habitId: string,
  days: number
): Promise<{ date: string; total: number }[]> {
  const from = new Date()
  from.setDate(from.getDate() - days)
  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${habitLogs.loggedAt})::date::text`,
      total: sql<string>`sum(${habitLogs.value})`,
    })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.tenantId, tenantId),
        eq(habitLogs.habitId, habitId),
        gte(habitLogs.loggedAt, from)
      )
    )
    .groupBy(sql`date_trunc('day', ${habitLogs.loggedAt})`)
    .orderBy(sql`date_trunc('day', ${habitLogs.loggedAt})`)
  return rows.map((r) => ({ date: r.date, total: parseFloat(r.total ?? '0') }))
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export async function getRewards(db: DB, tenantId: string) {
  return db.query.rewards.findMany({
    where: eq(rewards.tenantId, tenantId),
    orderBy: [desc(rewards.createdAt)],
  })
}

export async function createReward(
  db: DB,
  tenantId: string,
  data: Omit<typeof rewards.$inferInsert, 'id' | 'tenantId' | 'createdAt'>
) {
  const [reward] = await db.insert(rewards).values({ tenantId, ...data }).returning()
  return reward
}

export async function earnReward(db: DB, tenantId: string, rewardId: string) {
  const [reward] = await db
    .update(rewards)
    .set({ earnedAt: new Date() })
    .where(and(eq(rewards.id, rewardId), eq(rewards.tenantId, tenantId)))
    .returning()
  return reward
}

export async function redeemReward(db: DB, tenantId: string, rewardId: string) {
  const [reward] = await db
    .update(rewards)
    .set({ redeemedAt: new Date() })
    .where(and(eq(rewards.id, rewardId), eq(rewards.tenantId, tenantId)))
    .returning()
  return reward
}

// ─── Points ───────────────────────────────────────────────────────────────────

export async function addPoints(
  db: DB,
  tenantId: string,
  delta: number,
  reason: string,
  refId?: string
) {
  const [entry] = await db
    .insert(pointsBalance)
    .values({ tenantId, delta, reason, refId })
    .returning()
  return entry
}

export async function getPointsTotal(db: DB, tenantId: string): Promise<number> {
  const result = await db
    .select({ total: sql<string>`coalesce(sum(${pointsBalance.delta}), 0)` })
    .from(pointsBalance)
    .where(eq(pointsBalance.tenantId, tenantId))
  return Math.max(0, parseInt(result[0]?.total ?? '0', 10))
}

export async function getPointsLedger(db: DB, tenantId: string, limit = 20) {
  return db.query.pointsBalance.findMany({
    where: eq(pointsBalance.tenantId, tenantId),
    orderBy: [desc(pointsBalance.createdAt)],
    limit,
  })
}

/** Check unlock-type rewards and mark as earned if their condition is now met */
export async function checkAndEarnRewards(
  db: DB,
  tenantId: string,
  habitId: string,
  getLogSum: (habitId: string, from: Date, to: Date) => Promise<number>
): Promise<string[]> {
  const pendingRewards = await db.query.rewards.findMany({
    where: and(
      eq(rewards.tenantId, tenantId),
      eq(rewards.rewardType, 'unlock'),
      eq(rewards.conditionHabitId, habitId),
      isNull(rewards.earnedAt)
    ),
  })

  const earned: string[] = []
  for (const reward of pendingRewards) {
    if (!reward.conditionFrequency) continue
    const target = await db.query.habitTargets.findFirst({
      where: and(
        eq(habitTargets.habitId, habitId),
        eq(habitTargets.frequency, reward.conditionFrequency)
      ),
    })
    if (!target) continue

    const { from, to } = periodBoundsFromFreq(reward.conditionFrequency, new Date())
    const total = await getLogSum(habitId, from, to)
    const targetNum = parseFloat(target.targetValue)
    const met = target.targetType === 'max' ? total <= targetNum : total >= targetNum
    if (met) {
      await db.update(rewards).set({ earnedAt: new Date() }).where(eq(rewards.id, reward.id))
      earned.push(reward.id)
    }
  }
  return earned
}

function periodBoundsFromFreq(freq: string, ref: Date): { from: Date; to: Date } {
  const d = new Date(ref)
  if (freq === 'daily') {
    const from = new Date(d); from.setHours(0, 0, 0, 0)
    const to = new Date(d); to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  if (freq === 'weekly') {
    const day = d.getDay()
    const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7)); mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999)
    return { from: mon, to: sun }
  }
  if (freq === 'monthly') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    return { from, to }
  }
  const from = new Date(d.getFullYear(), 0, 1)
  const to = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { from, to }
}
