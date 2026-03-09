import { pgTable, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { connectors } from './connectors'

export const connectorDataCache = pgTable('connector_data_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectorId: uuid('connector_id').notNull().references(() => connectors.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

export type ConnectorDataCache = typeof connectorDataCache.$inferSelect
