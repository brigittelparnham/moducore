import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert
