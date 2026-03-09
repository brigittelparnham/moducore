import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const apps = pgTable('apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type App = typeof apps.$inferSelect
export type NewApp = typeof apps.$inferInsert
