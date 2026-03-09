import { Hono } from 'hono'
import { randomBytes } from 'crypto'
import { requireAuth } from '../middleware/auth'
import { createEmbedToken, getTenantEmbedTokens, revokeEmbedToken } from '@moducore/db'
import { getDb } from '../lib/db'
import type { AppVariables } from '../types'

export const embedTokensRoutes = new Hono<{ Variables: AppVariables }>()

// List active embed tokens for the tenant
embedTokensRoutes.get('/', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const tokens = await getTenantEmbedTokens(db, tenant.id)
  return c.json({ tokens })
})

// Create an embed token
embedTokensRoutes.post('/', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const body = await c.req.json<{
    name: string
    appSlug?: string
    write?: boolean
    expiresAt?: string
  }>()

  if (!body.name?.trim()) {
    return c.json({ error: 'name is required' }, 400)
  }

  const token = await createEmbedToken(db, {
    tenantId: tenant.id,
    name: body.name.trim(),
    token: randomBytes(32).toString('hex'),
    appSlug: body.appSlug ?? 'journal',
    permissions: { read: true, write: body.write ?? false },
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  })

  return c.json({ token }, 201)
})

// Revoke an embed token
embedTokensRoutes.delete('/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const id = c.req.param('id')

  // Verify the token belongs to this tenant before revoking
  const tokens = await getTenantEmbedTokens(db, tenant.id)
  if (!tokens.find((t) => t.id === id)) {
    return c.json({ error: 'Not found' }, 404)
  }

  await revokeEmbedToken(db, id)
  return c.json({ ok: true })
})
