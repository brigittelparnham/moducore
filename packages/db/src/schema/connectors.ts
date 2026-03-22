import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const connectors = pgTable('connectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'rss' | 'rest'
  name: text('name').notNull(),
  // config is encrypted at the application layer (AES-256-GCM) before storage.
  // See apps/api/src/lib/secrets.ts — routes encrypt on write and decrypt on read.
  config: jsonb('config').notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Connector = typeof connectors.$inferSelect
export type NewConnector = typeof connectors.$inferInsert
