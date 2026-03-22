import { Hono } from 'hono'
import {
  getConnectorsByTenant,
  getConnectorById,
  createConnector,
  updateConnector,
  deleteConnector,
  getLatestConnectorCache,
} from '@moducore/db'
import { syncConnector } from '@moducore/integrations'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { encryptConfig, decryptConfig } from '../lib/secrets'
import type { AppVariables } from '../types'

export const connectorsRoutes = new Hono<{ Variables: AppVariables }>()

connectorsRoutes.use(requireAuth)

// List all connectors for the tenant
connectorsRoutes.get('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const rows = await getConnectorsByTenant(db, tenant.id)
  // Decrypt config before sending to the client so they can see their own settings
  const connectors = rows.map((r) => ({ ...r, config: decryptConfig(r.config) }))
  return c.json({ connectors })
})

// Get a single connector
connectorsRoutes.get('/:id', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const row = await getConnectorById(db, tenant.id, c.req.param('id'))
  if (!row) return c.json({ error: 'Not found' }, 404)
  const connector = { ...row, config: decryptConfig(row.config) }
  return c.json({ connector })
})

// Create a connector
connectorsRoutes.post('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const body = await c.req.json<{ type: string; name: string; config: Record<string, unknown> }>()

  if (!body.type || !body.name) {
    return c.json({ error: 'type and name are required' }, 400)
  }

  const connector = await createConnector(db, {
    tenantId: tenant.id,
    type: body.type,
    name: body.name,
    config: encryptConfig(body.config ?? {}),
  })
  // Return decrypted config to the caller
  return c.json({ connector: { ...connector, config: decryptConfig(connector.config) } }, 201)
})

// Update a connector (name, config, enabled)
connectorsRoutes.patch('/:id', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const body = await c.req.json<Partial<{ name: string; config: Record<string, unknown>; enabled: boolean }>>()
  const update = body.config !== undefined
    ? { ...body, config: encryptConfig(body.config) }
    : body
  const row = await updateConnector(db, tenant.id, c.req.param('id'), update)
  if (!row) return c.json({ error: 'Not found' }, 404)
  const connector = { ...row, config: decryptConfig(row.config) }
  return c.json({ connector })
})

// Delete a connector (and its cache, via cascade)
connectorsRoutes.delete('/:id', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const existing = await getConnectorById(db, tenant.id, c.req.param('id'))
  if (!existing) return c.json({ error: 'Not found' }, 404)
  await deleteConnector(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})

// Manually trigger a sync for a connector
connectorsRoutes.post('/:id/sync', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const result = await syncConnector(db, tenant.id, c.req.param('id'), decryptConfig)
  if (!result.ok) return c.json({ error: result.error }, 400)
  return c.json({ ok: true })
})

// Get cached data for a connector
connectorsRoutes.get('/:id/data', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const connector = await getConnectorById(db, tenant.id, c.req.param('id'))
  if (!connector) return c.json({ error: 'Not found' }, 404)
  const cache = await getLatestConnectorCache(db, connector.id)
  if (!cache) return c.json({ data: null, syncedAt: null })
  return c.json({ data: cache.data, syncedAt: cache.fetchedAt })
})
