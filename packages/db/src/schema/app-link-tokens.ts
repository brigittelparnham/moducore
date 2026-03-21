import { pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const appLinkTokens = pgTable('app_link_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantingTenantId: uuid('granting_tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  appSlug: text('app_slug').notNull(),
  token: text('token').notNull(),
  grantedToTenantId: uuid('granted_to_tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqToken: unique().on(t.token) }))

export type AppLinkToken = typeof appLinkTokens.$inferSelect
export type NewAppLinkToken = typeof appLinkTokens.$inferInsert
