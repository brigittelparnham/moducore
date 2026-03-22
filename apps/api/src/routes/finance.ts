import { Hono } from 'hono'
import { apiError } from '@moducore/core'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getAccounts, getAccount, createAccount, updateAccount, getAccountBalance,
  getCategories, createCategory, updateCategory, seedDefaultCategories,
  suggestCategory, learnMerchantCategory,
  getTransactions, createTransaction, updateTransaction, bulkUpsertTransactions,
  getBudgetRules, upsertBudgetRule, deleteBudgetRule, getCategorySpend,
} from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'

export const financeRoutes = new Hono<{ Variables: AppVariables }>()

// ─── Accounts ─────────────────────────────────────────────────────────────────

financeRoutes.get('/accounts', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const list = await getAccounts(db, tenant.id)
  return c.json({ accounts: list })
})

financeRoutes.post(
  '/accounts',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    type: z.enum(['current', 'savings', 'cash', 'credit', 'investment']).default('current'),
    currency: z.string().default('GBP'),
    startingBalance: z.string().default('0'),
    startingBalanceDate: z.string(), // ISO date
    color: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const data = c.req.valid('json')
    const account = await createAccount(db, tenant.id, {
      ...data,
      provider: 'manual',
    })
    // Seed default categories on first account creation
    await seedDefaultCategories(db, tenant.id)
    return c.json({ account }, 201)
  }
)

financeRoutes.get('/accounts/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const account = await getAccount(db, tenant.id, c.req.param('id'))
  if (!account) return c.json(apiError("NOT_FOUND", 'Not found'), 404)
  const balance = await getAccountBalance(db, tenant.id, account.id)
  return c.json({ account, ...balance })
})

financeRoutes.patch(
  '/accounts/:id',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    archived: z.boolean().optional(),
    startingBalance: z.string().optional(),
    startingBalanceDate: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const account = await updateAccount(db, tenant.id, c.req.param('id'), c.req.valid('json'))
    return c.json({ account })
  }
)

// ─── Transactions ─────────────────────────────────────────────────────────────

financeRoutes.get('/accounts/:id/transactions', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const from = c.req.query('from')
  const to = c.req.query('to')
  const list = await getTransactions(db, tenant.id, {
    accountId: c.req.param('id'),
    from, to, limit, offset,
  })
  return c.json({ transactions: list })
})

financeRoutes.post(
  '/accounts/:id/transactions',
  requireAuth,
  zValidator('json', z.object({
    amount: z.string(),              // positive=in, negative=out
    description: z.string().min(1),
    merchant: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    date: z.string(),                // ISO date YYYY-MM-DD
    notes: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const accountId = c.req.param('id')
    const data = c.req.valid('json')

    // Auto-suggest category if not provided
    let categoryId = data.categoryId
    let categoryConfirmed = !!categoryId
    if (!categoryId && data.merchant) {
      const suggested = await suggestCategory(db, tenant.id, data.merchant)
      if (suggested) { categoryId = suggested; categoryConfirmed = false }
    }

    const tx = await createTransaction(db, tenant.id, accountId, {
      ...data,
      categoryId,
      categoryConfirmed,
      source: 'manual',
    })

    // If category was user-supplied, learn the merchant mapping
    if (data.categoryId && data.merchant) {
      await learnMerchantCategory(db, tenant.id, data.merchant, data.categoryId)
    }

    return c.json({ transaction: tx }, 201)
  }
)

// Bulk import (CSV parsed client-side, posted as JSON)
financeRoutes.post(
  '/accounts/:id/import',
  requireAuth,
  zValidator('json', z.object({
    transactions: z.array(z.object({
      amount: z.string(),
      description: z.string(),
      merchant: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      date: z.string(),
      notes: z.string().optional(),
      externalId: z.string().optional(),
    })),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const accountId = c.req.param('id')
    const { transactions: rows } = c.req.valid('json')

    // Auto-categorise each row
    const enriched = await Promise.all(rows.map(async (row) => {
      let categoryId = row.categoryId
      let categoryConfirmed = !!categoryId
      if (!categoryId && row.merchant) {
        const suggested = await suggestCategory(db, tenant.id, row.merchant)
        if (suggested) { categoryId = suggested; categoryConfirmed = false }
      }
      return { ...row, accountId, categoryId, categoryConfirmed, source: 'csv_import' as const }
    }))

    const inserted = await bulkUpsertTransactions(db, tenant.id, enriched)
    return c.json({ inserted: inserted.length, total: rows.length })
  }
)

financeRoutes.patch(
  '/transactions/:id',
  requireAuth,
  zValidator('json', z.object({
    amount: z.string().optional(),
    description: z.string().optional(),
    merchant: z.string().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    categoryConfirmed: z.boolean().optional(),
    date: z.string().optional(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const data = c.req.valid('json')

    const tx = await updateTransaction(db, tenant.id, c.req.param('id'), {
      ...data,
      categoryConfirmed: data.categoryId ? true : data.categoryConfirmed,
    })

    // Learn merchant → category mapping when user confirms
    if (data.categoryId && tx?.merchant) {
      await learnMerchantCategory(db, tenant.id, tx.merchant, data.categoryId)
    }

    return c.json({ transaction: tx })
  }
)

// ─── All transactions across accounts ────────────────────────────────────────

financeRoutes.get('/transactions', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const from = c.req.query('from')
  const to = c.req.query('to')
  const list = await getTransactions(db, tenant.id, { from, to, limit, offset })
  return c.json({ transactions: list })
})

// ─── Categories ───────────────────────────────────────────────────────────────

financeRoutes.get('/categories', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const list = await getCategories(db, tenant.id)
  return c.json({ categories: list })
})

financeRoutes.post(
  '/categories',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().optional(),
    type: z.enum(['income', 'expense', 'transfer']).default('expense'),
    linkedHabitId: z.string().uuid().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const category = await createCategory(db, tenant.id, c.req.valid('json'))
    return c.json({ category }, 201)
  }
)

financeRoutes.patch(
  '/categories/:id',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    linkedHabitId: z.string().uuid().nullable().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const category = await updateCategory(db, tenant.id, c.req.param('id'), c.req.valid('json'))
    return c.json({ category })
  }
)

// ─── Budget rules ─────────────────────────────────────────────────────────────

financeRoutes.get('/budget', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const period = (c.req.query('period') ?? 'monthly') as 'weekly' | 'monthly' | 'yearly'

  const now = new Date()
  let from: string, to: string
  if (period === 'weekly') {
    const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    from = mon.toISOString().slice(0, 10)
    to = sun.toISOString().slice(0, 10)
  } else if (period === 'monthly') {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  } else {
    from = `${now.getFullYear()}-01-01`
    to = `${now.getFullYear()}-12-31`
  }

  const [rules, spend] = await Promise.all([
    getBudgetRules(db, tenant.id),
    getCategorySpend(db, tenant.id, from, to),
  ])

  const spendMap: Record<string, number> = {}
  for (const s of spend) if (s.categoryId) spendMap[s.categoryId] = s.total

  const budget = rules
    .filter((r) => r.period === period)
    .map((r) => ({
      ...r,
      spent: spendMap[r.categoryId] ?? 0,
      remaining: parseFloat(r.limitAmount) - (spendMap[r.categoryId] ?? 0),
    }))

  return c.json({ budget, period, from, to })
})

financeRoutes.put(
  '/budget',
  requireAuth,
  zValidator('json', z.object({
    categoryId: z.string().uuid(),
    period: z.enum(['weekly', 'monthly', 'yearly']),
    limitAmount: z.string(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { categoryId, period, limitAmount } = c.req.valid('json')
    const rule = await upsertBudgetRule(db, tenant.id, categoryId, period, limitAmount)
    return c.json({ rule })
  }
)

financeRoutes.delete('/budget/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  await deleteBudgetRule(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})
