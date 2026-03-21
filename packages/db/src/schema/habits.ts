import { pgTable, uuid, text, numeric, boolean, integer, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './index'

// ─── Habits ───────────────────────────────────────────────────────────────────

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color').default('#6366f1'),
  unit: text('unit').notNull().default('times'), // steps|times|minutes|£|custom
  unitLabel: text('unit_label'),                 // custom label e.g. "pages"
  type: text('type').notNull().default('habit'), // habit | limit
  pointsPerLog: numeric('points_per_log').default('0'),
  notes: text('notes'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const habitTargets = pgTable('habit_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  frequency: text('frequency').notNull(), // daily|weekly|monthly|yearly
  targetValue: numeric('target_value').notNull(),
  targetType: text('target_type').notNull().default('min'), // min (>=) | max (<=)
}, (t) => ({
  habitFreqUniq: unique().on(t.habitId, t.frequency),
}))

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  value: numeric('value').notNull().default('1'),
  loggedAt: timestamp('logged_at').notNull().defaultNow(),
  source: text('source').notNull().default('manual'), // manual|health_shortcut|bank_auto
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Rewards & Points ─────────────────────────────────────────────────────────

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  monetaryValue: numeric('monetary_value'),       // £ value if applicable
  rewardType: text('reward_type').notNull(),      // unlock | points_spend
  pointsCost: integer('points_cost'),             // if points_spend: costs this many pts
  conditionHabitId: uuid('condition_habit_id').references(() => habits.id, { onDelete: 'set null' }),
  conditionFrequency: text('condition_frequency'), // which period triggers unlock
  earnedAt: timestamp('earned_at'),
  redeemedAt: timestamp('redeemed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const pointsBalance = pgTable('points_balance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),   // positive = earned, negative = spent
  reason: text('reason').notNull(),
  refId: uuid('ref_id'),               // FK to habit_log or reward
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const habitsRelations = relations(habits, ({ many }) => ({
  targets: many(habitTargets),
  logs: many(habitLogs),
}))

export const habitTargetsRelations = relations(habitTargets, ({ one }) => ({
  habit: one(habits, { fields: [habitTargets.habitId], references: [habits.id] }),
}))

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}))
