import { pgTable, text, timestamp, uuid, jsonb, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export type NavLink = { label: string; href: string }
export type PageStyle = {
  accentColor?: string
  backgroundColor?: string
  fontFamily?: string
  maxWidth?: number
  showHeader?: boolean
  showFooter?: boolean
  showNav?: boolean
}

export const siteConfigs = pgTable('site_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  siteName: text('site_name'),
  logoUrl: text('logo_url'),
  accentColor: text('accent_color').notNull().default('#111111'),
  fontFamily: text('font_family').notNull().default('system-ui'),
  navLinks: jsonb('nav_links').notNull().default([]).$type<NavLink[]>(),
  headerBlocks: jsonb('header_blocks').notNull().default([]).$type<unknown[]>(),
  footerBlocks: jsonb('footer_blocks').notNull().default([]).$type<unknown[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique().on(t.tenantId) }))

export type SiteConfig = typeof siteConfigs.$inferSelect
export type NewSiteConfig = typeof siteConfigs.$inferInsert
