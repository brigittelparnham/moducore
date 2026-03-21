import { pgTable, uuid, text, numeric, boolean, integer, timestamp, date, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './index'
import { habits } from './habits'

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('current'), // current|savings|cash|credit|investment
  currency: text('currency').notNull().default('GBP'),
  startingBalance: numeric('starting_balance').notNull().default('0'),
  startingBalanceDate: date('starting_balance_date').notNull(),
  color: text('color').default('#6366f1'),
  provider: text('provider').notNull().default('manual'), // manual|starling
  starlingAccountUid: text('starling_account_uid'),
  starlingAccessToken: text('starling_access_token'),
  starlingLastSyncedAt: timestamp('starling_last_synced_at'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color').default('#6366f1'),
  type: text('type').notNull().default('expense'), // income|expense|transfer
  linkedHabitId: uuid('linked_habit_id').references(() => habits.id, { onDelete: 'set null' }),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Merchant auto-categorisation rules ──────────────────────────────────────

export const merchantRules = pgTable('merchant_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  merchantPattern: text('merchant_pattern').notNull(), // lowercase normalised fragment
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  matchCount: integer('match_count').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  tenantPatternUniq: unique().on(t.tenantId, t.merchantPattern),
}))

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  amount: numeric('amount').notNull(),        // positive = in, negative = out
  description: text('description').notNull(),
  merchant: text('merchant'),                 // normalised merchant name
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  categoryConfirmed: boolean('category_confirmed').notNull().default(false),
  date: date('date').notNull(),
  notes: text('notes'),
  source: text('source').notNull().default('manual'), // manual|starling_import|csv_import
  externalId: text('external_id'),            // dedup key for imports
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  accountExternalIdUniq: unique().on(t.accountId, t.externalId),
}))

// ─── Budget rules ──────────────────────────────────────────────────────────────

export const budgetRules = pgTable('budget_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),           // weekly|monthly|yearly
  limitAmount: numeric('limit_amount').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  tenantCategoryPeriodUniq: unique().on(t.tenantId, t.categoryId, t.period),
}))

// ─── Relations ────────────────────────────────────────────────────────────────

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgetRules: many(budgetRules),
  merchantRules: many(merchantRules),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}))

export const budgetRulesRelations = relations(budgetRules, ({ one }) => ({
  category: one(categories, { fields: [budgetRules.categoryId], references: [categories.id] }),
}))

export const merchantRulesRelations = relations(merchantRules, ({ one }) => ({
  category: one(categories, { fields: [merchantRules.categoryId], references: [categories.id] }),
}))
