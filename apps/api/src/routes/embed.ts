import { Hono } from 'hono'
import { validateEmbedToken, getJournalEntriesByTenant, getJournalEntryById } from '@moducore/db'
import { getDb } from '../lib/db'
import type { AppVariables } from '../types'

export const embedRoutes = new Hono<{ Variables: AppVariables }>()

// Allow preflight from any origin (embeds are loaded on external sites)
embedRoutes.options('*', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type')
  return c.body(null, 204)
})

// Apply open CORS to all embed routes
embedRoutes.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  await next()
})

// GET /embed/journal?token=xxx
// Public endpoint — validates embed token and returns published journal entries
embedRoutes.get('/journal', async (c) => {
  const db = getDb()
  const token = c.req.query('token')

  if (!token) {
    return c.json({ error: 'token is required' }, 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  // Only return published entries for the tenant
  const all = await getJournalEntriesByTenant(db, embedToken.tenantId)
  const entries = all.filter((e) => e.status === 'published')

  return c.json({ entries })
})

// GET /embed/journal/:id?token=xxx
// Returns a single published journal entry — used by the single-entry widget and feed expand
embedRoutes.get('/journal/:id', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  const id = c.req.param('id')

  if (!token) {
    return c.json({ error: 'token is required' }, 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  const entry = await getJournalEntryById(db, embedToken.tenantId, id)
  if (!entry || entry.status !== 'published') {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ entry })
})
