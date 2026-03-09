import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: jsonb('content').notNull().default({}),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
