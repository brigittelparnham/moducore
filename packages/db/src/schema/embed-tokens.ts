import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export type EmbedPermissions = {
  read: boolean
  write: boolean
}

export const embedTokens = pgTable('embed_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  token: text('token').notNull().unique(),
  appSlug: text('app_slug'), // null = all apps
  permissions: jsonb('permissions')
    .$type<EmbedPermissions>()
    .notNull()
    .default({ read: true, write: false }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
})

export type EmbedToken = typeof embedTokens.$inferSelect
export type NewEmbedToken = typeof embedTokens.$inferInsert
