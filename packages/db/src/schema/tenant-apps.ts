import { pgTable, text, timestamp, uuid, boolean, jsonb, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const tenantApps = pgTable('tenant_apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  appSlug: text('app_slug').notNull(),
  config: jsonb('config').notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  installedAt: timestamp('installed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqTenantApp: unique().on(t.tenantId, t.appSlug) }))

export type TenantApp = typeof tenantApps.$inferSelect
export type NewTenantApp = typeof tenantApps.$inferInsert
