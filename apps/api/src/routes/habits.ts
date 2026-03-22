/**
 * Authorization model for habits and finance:
 * Both are tenant-scoped shared resources (habits are household goals,
 * finances are shared accounts). All authenticated tenant members have
 * read/write access to all data in their tenant. Tenant isolation via
 * tenant_id on every query is the security boundary — not per-user ownership.
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getHabits, getHabit, createHabit, updateHabit, deleteHabit,
  upsertHabitTarget, deleteHabitTarget,
  logHabit, getHabitLogs,
  getRewards, createReward, redeemReward,
  addPoints, getPointsTotal, getPointsLedger,
  getHabitsDaySummary,
} from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { calcStreak, checkRewardUnlocks } from '../lib/habit-streaks'
import type { AppVariables } from '../types'

export const habitsRoutes = new Hono<{ Variables: AppVariables }>()

// ─── Health ingest (iPhone Shortcuts webhook) ─────────────────────────────────

habitsRoutes.post('/health-ingest', async (c) => {
  const secret = c.req.query('secret')
  const expected = process.env.HABITS_HEALTH_SECRET
  if (!expected || secret !== expected) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.metric !== 'string' || typeof body.value !== 'number') {
    return c.json({ ok: true })
  }

  const db = getDb()
  const tenant = await db.query.tenants.findFirst()
  if (!tenant) return c.json({ ok: true })

  // Find or create a habit matching this metric (e.g. "steps")
  const allHabits = await getHabits(db, tenant.id)
  const habit = allHabits.find((h) =>
    h.unit === body.metric || h.name.toLowerCase() === body.metric.toLowerCase()
  )
  if (!habit) return c.json({ ok: true, note: `No habit found for metric: ${body.metric}` })

  const loggedAt = body.date ? new Date(body.date) : new Date()
  await logHabit(db, tenant.id, habit.id, {
    value: String(body.value),
    loggedAt,
    source: 'health_shortcut',
  })
  return c.json({ ok: true })
})

// ─── Habits CRUD ──────────────────────────────────────────────────────────────

habitsRoutes.get('/', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const list = await getHabits(db, tenant.id)
  return c.json({ habits: list })
})

habitsRoutes.post(
  '/',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().optional(),
    unit: z.string().optional(),
    unitLabel: z.string().optional(),
    type: z.enum(['habit', 'limit']).optional(),
    pointsPerLog: z.string().optional(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const data = c.req.valid('json')
    const habit = await createHabit(db, tenant.id, data)
    return c.json({ habit }, 201)
  }
)

habitsRoutes.get('/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const habit = await getHabit(db, tenant.id, c.req.param('id'))
  if (!habit) return c.json({ error: 'Not found' }, 404)
  return c.json({ habit })
})

habitsRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    unit: z.string().optional(),
    unitLabel: z.string().optional(),
    type: z.enum(['habit', 'limit']).optional(),
    pointsPerLog: z.string().optional(),
    notes: z.string().optional(),
    archived: z.boolean().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const habit = await updateHabit(db, tenant.id, c.req.param('id'), c.req.valid('json'))
    return c.json({ habit })
  }
)

habitsRoutes.delete('/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  await deleteHabit(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})

// ─── Targets ─────────────────────────────────────────────────────────────────

habitsRoutes.put(
  '/:id/targets/:frequency',
  requireAuth,
  zValidator('json', z.object({
    targetValue: z.string(),
    targetType: z.enum(['min', 'max']).default('min'),
  })),
  async (c) => {
    const { targetValue, targetType } = c.req.valid('json')
    const db = getDb()
    const target = await upsertHabitTarget(
      db, c.req.param('id'), c.req.param('frequency'), targetValue, targetType
    )
    return c.json({ target })
  }
)

habitsRoutes.delete('/:id/targets/:frequency', requireAuth, async (c) => {
  const db = getDb()
  await deleteHabitTarget(db, c.req.param('id'), c.req.param('frequency'))
  return c.json({ ok: true })
})

// ─── Logging ─────────────────────────────────────────────────────────────────

habitsRoutes.post(
  '/:id/log',
  requireAuth,
  zValidator('json', z.object({
    value: z.string().optional(),
    loggedAt: z.string().datetime().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const habitId = c.req.param('id')
    const { value, loggedAt, source, notes } = c.req.valid('json')

    const habit = await getHabit(db, tenant.id, habitId)
    if (!habit) return c.json({ error: 'Not found' }, 404)

    const log = await logHabit(db, tenant.id, habitId, {
      value,
      loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      source,
      notes,
    })

    // Award points if configured
    const pts = parseFloat(habit.pointsPerLog ?? '0')
    if (pts > 0) {
      await addPoints(db, tenant.id, Math.round(pts), `${habit.name} logged`, log.id)
    }

    // Check for reward unlocks
    const unlocked = await checkRewardUnlocks(db, tenant.id, habitId)

    return c.json({ log, pointsEarned: Math.round(pts), rewardsUnlocked: unlocked })
  }
)

habitsRoutes.get('/:id/logs', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const logs = await getHabitLogs(db, tenant.id, c.req.param('id'), limit, offset)
  return c.json({ logs })
})

// ─── Streaks ─────────────────────────────────────────────────────────────────

habitsRoutes.get('/streaks', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const allHabits = await getHabits(db, tenant.id)

  const streaks = await Promise.all(
    allHabits.flatMap((h) =>
      (h.targets ?? []).map(async (t) => {
        const streak = await calcStreak(
          db, tenant.id, h.id,
          parseFloat(t.targetValue),
          t.targetType,
          t.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly'
        )
        return { habitId: h.id, habitName: h.name, frequency: t.frequency, ...streak }
      })
    )
  )
  return c.json({ streaks })
})

// ─── Rewards ──────────────────────────────────────────────────────────────────

habitsRoutes.get('/rewards', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const [rewardList, points] = await Promise.all([
    getRewards(db, tenant.id),
    getPointsTotal(db, tenant.id),
  ])
  return c.json({ rewards: rewardList, points })
})

habitsRoutes.post(
  '/rewards',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    monetaryValue: z.string().optional(),
    rewardType: z.enum(['unlock', 'points_spend']),
    pointsCost: z.number().int().optional(),
    conditionHabitId: z.string().uuid().optional(),
    conditionFrequency: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const reward = await createReward(db, tenant.id, c.req.valid('json'))
    return c.json({ reward }, 201)
  }
)

habitsRoutes.post('/rewards/:id/redeem', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const rewardId = c.req.param('id')

  const allRewards = await getRewards(db, tenant.id)
  const reward = allRewards.find((r) => r.id === rewardId)
  if (!reward) return c.json({ error: 'Not found' }, 404)
  if (!reward.earnedAt) return c.json({ error: 'Reward not yet earned' }, 400)
  if (reward.redeemedAt) return c.json({ error: 'Already redeemed' }, 400)

  if (reward.rewardType === 'points_spend' && reward.pointsCost) {
    const balance = await getPointsTotal(db, tenant.id)
    if (balance < reward.pointsCost) return c.json({ error: 'Not enough points' }, 400)
    await addPoints(db, tenant.id, -reward.pointsCost, `Redeemed: ${reward.name}`, reward.id)
  }

  const updated = await redeemReward(db, tenant.id, rewardId)
  return c.json({ reward: updated })
})

// ─── Day summary (for cross-app DayContextPanel) ──────────────────────────────

habitsRoutes.get('/day-summary', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10)
  const summary = await getHabitsDaySummary(db, tenant.id, date)
  return c.json(summary)
})

// ─── Points ───────────────────────────────────────────────────────────────────

habitsRoutes.get('/points', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const [total, ledger] = await Promise.all([
    getPointsTotal(db, tenant.id),
    getPointsLedger(db, tenant.id, 30),
  ])
  return c.json({ total, ledger })
})
