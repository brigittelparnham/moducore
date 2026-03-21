import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getSiteConfig, upsertSiteConfig } from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'

export const siteConfigRoutes = new Hono<{ Variables: AppVariables }>()

const updateSiteConfigSchema = z.object({
  siteName: z.string().optional(),
  logoUrl: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  navLinks: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
  headerBlocks: z.array(z.unknown()).optional(),
  footerBlocks: z.array(z.unknown()).optional(),
})

// GET /site-config/public/:tenantSlug — get site config for tenant (public, by slug)
siteConfigRoutes.get('/public/:tenantSlug', async (c) => {
  const db = getDb()
  const { tenantSlug } = c.req.param()
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, tenantSlug),
    columns: { id: true, name: true, slug: true },
  })
  if (!tenant) return c.json({ error: 'Not found' }, 404)
  const config = await getSiteConfig(db, tenant.id)
  return c.json({ config, tenant })
})

// GET /site-config — authenticated tenant's own config
siteConfigRoutes.get('/', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const config = await getSiteConfig(db, tenant.id)
  return c.json({ config })
})

// PATCH /site-config
siteConfigRoutes.patch('/', requireAuth, zValidator('json', updateSiteConfigSchema), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const values = c.req.valid('json')
  const config = await upsertSiteConfig(db, tenant.id, values)
  return c.json({ config })
})
