import { Hono } from 'hono'
import { apiError } from '@moducore/core'
import { getInstalledApps, installApp, uninstallApp } from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppVariables } from '../types'

// Platform-defined available apps
const AVAILABLE_APPS = [
  { slug: 'journal', name: 'Journal', description: 'A personal journal and blog for your workspace.' },
  { slug: 'spotify', name: 'Music Journal', description: 'Visualise your Spotify listening history as a personal music story.' },
  { slug: 'maps', name: 'Travel', description: 'Track your journeys, get personalised commute suggestions and route stats.' },
]

export const appsRoutes = new Hono<{ Variables: AppVariables }>()

appsRoutes.use(requireAuth)

// GET /apps — available apps + installed status for current tenant
appsRoutes.get('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const installed = await getInstalledApps(db, tenant.id)
  const installedSlugs = new Set(installed.map((a) => a.appSlug))
  const apps = AVAILABLE_APPS.map((app) => ({ ...app, installed: installedSlugs.has(app.slug) }))
  return c.json({ apps })
})

// POST /apps/:slug/install
appsRoutes.post('/:slug/install', requireRole('owner'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const slug = c.req.param('slug')
  if (!AVAILABLE_APPS.find((a) => a.slug === slug)) {
    return c.json(apiError("NOT_FOUND", 'App not found'), 404)
  }
  const tenantApp = await installApp(db, tenant.id, slug)
  return c.json({ tenantApp })
})

// DELETE /apps/:slug/install
appsRoutes.delete('/:slug/install', requireRole('owner'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const slug = c.req.param('slug')
  await uninstallApp(db, tenant.id, slug)
  return c.json({ ok: true })
})
