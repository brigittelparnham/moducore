import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { DbClient } from '../client'
import { accounts, categories, merchantRules, transactions, budgetRules } from '../schema/finance'

type DB = DbClient

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAccounts(db: DB, tenantId: string) {
  return db.query.accounts.findMany({
    where: and(eq(accounts.tenantId, tenantId), eq(accounts.archived, false)),
    orderBy: [accounts.createdAt],
  })
}

export async function getAccount(db: DB, tenantId: string, id: string) {
  return db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)),
  })
}

export async function createAccount(
  db: DB,
  tenantId: string,
  data: Omit<typeof accounts.$inferInsert, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
) {
  const [account] = await db.insert(accounts).values({ tenantId, ...data }).returning()
  return account
}

export async function updateAccount(
  db: DB,
  tenantId: string,
  id: string,
  data: Partial<typeof accounts.$inferInsert>
) {
  const [account] = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)))
    .returning()
  return account
}

/** Running balance = starting_balance + sum of all transactions */
export async function getAccountBalance(
  db: DB,
  tenantId: string,
  accountId: string
): Promise<{ startingBalance: number; transactionSum: number; balance: number }> {
  const account = await getAccount(db, tenantId, accountId)
  if (!account) return { startingBalance: 0, transactionSum: 0, balance: 0 }

  const result = await db
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.accountId, accountId))

  const startingBalance = parseFloat(account.startingBalance)
  const transactionSum = parseFloat(result[0]?.total ?? '0')
  return { startingBalance, transactionSum, balance: startingBalance + transactionSum }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(db: DB, tenantId: string) {
  return db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
    orderBy: [categories.name],
  })
}

export async function createCategory(
  db: DB,
  tenantId: string,
  data: Omit<typeof categories.$inferInsert, 'id' | 'tenantId' | 'createdAt'>
) {
  const [category] = await db.insert(categories).values({ tenantId, ...data }).returning()
  return category
}

export async function updateCategory(
  db: DB,
  tenantId: string,
  id: string,
  data: Partial<typeof categories.$inferInsert>
) {
  const [category] = await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)))
    .returning()
  return category
}

/** Seed default categories for a new tenant */
export async function seedDefaultCategories(db: DB, tenantId: string) {
  const defaults = [
    { name: 'Eating out', icon: '🍽️', color: '#f97316', type: 'expense' },
    { name: 'Takeaway', icon: '🥡', color: '#ef4444', type: 'expense' },
    { name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense' },
    { name: 'Transport', icon: '🚇', color: '#3b82f6', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#a855f7', type: 'expense' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
    { name: 'Health & fitness', icon: '💪', color: '#22c55e', type: 'expense' },
    { name: 'Subscriptions', icon: '📱', color: '#6366f1', type: 'expense' },
    { name: 'Bills & utilities', icon: '💡', color: '#eab308', type: 'expense' },
    { name: 'Savings', icon: '🏦', color: '#14b8a6', type: 'transfer' },
    { name: 'Salary', icon: '💰', color: '#22c55e', type: 'income' },
    { name: 'Other income', icon: '➕', color: '#84cc16', type: 'income' },
    { name: 'Other', icon: '📦', color: '#94a3b8', type: 'expense' },
  ]
  return db
    .insert(categories)
    .values(defaults.map((d) => ({ tenantId, ...d, isSystem: true })))
    .onConflictDoNothing()
    .returning()
}

// ─── Merchant rules (auto-categorisation) ────────────────────────────────────

export function normalizeMerchant(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(ltd|limited|plc|uk|gb|co|inc|llp)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

export async function suggestCategory(
  db: DB,
  tenantId: string,
  merchant: string
): Promise<string | null> {
  const pattern = normalizeMerchant(merchant)
  if (!pattern) return null

  // Exact match first
  const exact = await db.query.merchantRules.findFirst({
    where: and(
      eq(merchantRules.tenantId, tenantId),
      eq(merchantRules.merchantPattern, pattern)
    ),
  })
  if (exact) return exact.categoryId

  // Substring scan — find rule whose pattern is contained in the merchant string
  const rules = await db.query.merchantRules.findMany({
    where: eq(merchantRules.tenantId, tenantId),
    orderBy: [desc(merchantRules.matchCount)],
  })
  for (const rule of rules) {
    if (pattern.includes(rule.merchantPattern) || rule.merchantPattern.includes(pattern)) {
      return rule.categoryId
    }
  }
  return null
}

export async function learnMerchantCategory(
  db: DB,
  tenantId: string,
  merchant: string,
  categoryId: string
) {
  const pattern = normalizeMerchant(merchant)
  if (!pattern) return
  await db
    .insert(merchantRules)
    .values({ tenantId, merchantPattern: pattern, categoryId })
    .onConflictDoUpdate({
      target: [merchantRules.tenantId, merchantRules.merchantPattern],
      set: {
        categoryId,
        matchCount: sql`${merchantRules.matchCount} + 1`,
        updatedAt: new Date(),
      },
    })
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(
  db: DB,
  tenantId: string,
  opts: { accountId?: string; from?: string; to?: string; limit?: number; offset?: number } = {}
) {
  const { accountId, from, to, limit = 50, offset = 0 } = opts
  const conds = [eq(transactions.tenantId, tenantId)]
  if (accountId) conds.push(eq(transactions.accountId, accountId))
  if (from) conds.push(gte(transactions.date, from))
  if (to) conds.push(lte(transactions.date, to))

  return db.query.transactions.findMany({
    where: and(...conds),
    with: { category: true },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit,
    offset,
  })
}

export async function createTransaction(
  db: DB,
  tenantId: string,
  accountId: string,
  data: Omit<typeof transactions.$inferInsert, 'id' | 'tenantId' | 'accountId' | 'createdAt' | 'updatedAt'>
) {
  const [tx] = await db
    .insert(transactions)
    .values({ tenantId, accountId, ...data })
    .returning()
  return tx
}

export async function updateTransaction(
  db: DB,
  tenantId: string,
  id: string,
  data: Partial<typeof transactions.$inferInsert>
) {
  const [tx] = await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.tenantId, tenantId)))
    .returning()
  return tx
}

/** Bulk upsert — used by Starling sync + CSV import */
export async function bulkUpsertTransactions(
  db: DB,
  tenantId: string,
  rows: Array<Omit<typeof transactions.$inferInsert, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
) {
  if (rows.length === 0) return []
  return db
    .insert(transactions)
    .values(rows.map((r) => ({ tenantId, ...r })))
    .onConflictDoNothing()
    .returning()
}

// ─── Budget rules ─────────────────────────────────────────────────────────────

export async function getBudgetRules(db: DB, tenantId: string) {
  return db.query.budgetRules.findMany({
    where: eq(budgetRules.tenantId, tenantId),
    with: { category: true },
  })
}

export async function upsertBudgetRule(
  db: DB,
  tenantId: string,
  categoryId: string,
  period: string,
  limitAmount: string
) {
  const [rule] = await db
    .insert(budgetRules)
    .values({ tenantId, categoryId, period, limitAmount })
    .onConflictDoUpdate({
      target: [budgetRules.tenantId, budgetRules.categoryId, budgetRules.period],
      set: { limitAmount },
    })
    .returning()
  return rule
}

export async function deleteBudgetRule(db: DB, tenantId: string, id: string) {
  await db
    .delete(budgetRules)
    .where(and(eq(budgetRules.id, id), eq(budgetRules.tenantId, tenantId)))
}

/** Spending per category for a given date range */
export async function getCategorySpend(
  db: DB,
  tenantId: string,
  from: string,
  to: string
): Promise<{ categoryId: string | null; total: number }[]> {
  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<string>`sum(abs(${transactions.amount}))`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        sql`${transactions.amount} < 0`, // expenses only
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .groupBy(transactions.categoryId)
  return rows.map((r) => ({ categoryId: r.categoryId, total: parseFloat(r.total ?? '0') }))
}
