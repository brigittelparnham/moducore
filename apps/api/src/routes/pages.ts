import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  getPagesByTenant,
  getPageById,
  getPublishedPageBySlug,
  isPageSlugAvailable,
  createPage,
  updatePage,
  publishPage,
  unpublishPage,
  deletePage,
  getTenantBySlug,
} from '@moducore/db'
import { createPageSchema, updatePageSchema } from '@moducore/core'
import { getDb } from '../lib/db'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppVariables } from '../types'

export const pagesRoutes = new Hono<{ Variables: AppVariables }>()

// All pages routes require auth
pagesRoutes.use(requireAuth)

// GET /pages — list all pages for the tenant
pagesRoutes.get('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const pages = await getPagesByTenant(db, tenant.id)
  return c.json({ pages })
})

// POST /pages — create a page
pagesRoutes.post('/', requireRole('member'), zValidator('json', createPageSchema), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const user = c.get('user')!
  const { title, slug, content } = c.req.valid('json')

  const available = await isPageSlugAvailable(db, tenant.id, slug)
  if (!available) return c.json({ error: 'A page with this slug already exists' }, 400)

  const page = await createPage(db, {
    tenantId: tenant.id,
    title,
    slug,
    content,
    createdBy: user.id,
  })
  return c.json({ page }, 201)
})

// GET /pages/:id — get a single page
pagesRoutes.get('/:id', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const page = await getPageById(db, tenant.id, c.req.param('id'))
  if (!page) return c.json({ error: 'Page not found' }, 404)
  return c.json({ page })
})

// PATCH /pages/:id — update title, slug, or content
pagesRoutes.patch('/:id', requireRole('member'), zValidator('json', updatePageSchema), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const id = c.req.param('id')
  const data = c.req.valid('json')

  if (data.slug) {
    const available = await isPageSlugAvailable(db, tenant.id, data.slug, id)
    if (!available) return c.json({ error: 'A page with this slug already exists' }, 400)
  }

  const page = await updatePage(db, tenant.id, id, data)
  if (!page) return c.json({ error: 'Page not found' }, 404)
  return c.json({ page })
})

// POST /pages/:id/publish — publish
pagesRoutes.post('/:id/publish', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const page = await publishPage(db, tenant.id, c.req.param('id'))
  if (!page) return c.json({ error: 'Page not found' }, 404)
  return c.json({ page })
})

// POST /pages/:id/unpublish — back to draft
pagesRoutes.post('/:id/unpublish', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const page = await unpublishPage(db, tenant.id, c.req.param('id'))
  if (!page) return c.json({ error: 'Page not found' }, 404)
  return c.json({ page })
})

// DELETE /pages/:id — soft delete
pagesRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const existing = await getPageById(db, tenant.id, c.req.param('id'))
  if (!existing) return c.json({ error: 'Page not found' }, 404)
  await deletePage(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})

// --- Public routes (no auth) ---

export const publicPagesRoutes = new Hono()

// GET /public/:tenantSlug/pages/:slug — render a published page
publicPagesRoutes.get('/:tenantSlug/pages/:slug', async (c) => {
  const db = getDb()
  const tenantSlug = c.req.param('tenantSlug')
  const slug = c.req.param('slug')

  const tenant = await getTenantBySlug(db, tenantSlug)
  if (!tenant) return c.json({ error: 'Not found' }, 404)

  const page = await getPublishedPageBySlug(db, tenant.id, slug)
  if (!page) return c.json({ error: 'Not found' }, 404)

  return c.json({ page, tenant: { name: tenant.name, slug: tenant.slug } })
})
