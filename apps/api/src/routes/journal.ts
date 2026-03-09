import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  getJournalEntriesByTenant,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  publishJournalEntry,
  unpublishJournalEntry,
  deleteJournalEntry,
} from '@moducore/db'
import { createJournalEntrySchema, updateJournalEntrySchema } from '@moducore/core'
import { getDb } from '../lib/db'
import { requireAuth, requireRole } from '../middleware/auth'
import type { AppVariables } from '../types'

export const journalRoutes = new Hono<{ Variables: AppVariables }>()

journalRoutes.use(requireAuth)

// GET /journal — list all entries for the tenant
journalRoutes.get('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const entries = await getJournalEntriesByTenant(db, tenant.id)
  return c.json({ entries })
})

// POST /journal — create an entry
journalRoutes.post('/', requireRole('member'), zValidator('json', createJournalEntrySchema), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const user = c.get('user')!
  const { title, content, tags } = c.req.valid('json')
  const entry = await createJournalEntry(db, {
    tenantId: tenant.id,
    title: title ?? null,
    content,
    tags,
    createdBy: user.id,
  })
  return c.json({ entry }, 201)
})

// GET /journal/:id
journalRoutes.get('/:id', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const entry = await getJournalEntryById(db, tenant.id, c.req.param('id'))
  if (!entry) return c.json({ error: 'Entry not found' }, 404)
  return c.json({ entry })
})

// PATCH /journal/:id
journalRoutes.patch('/:id', requireRole('member'), zValidator('json', updateJournalEntrySchema), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const entry = await updateJournalEntry(db, tenant.id, c.req.param('id'), c.req.valid('json'))
  if (!entry) return c.json({ error: 'Entry not found' }, 404)
  return c.json({ entry })
})

// POST /journal/:id/publish
journalRoutes.post('/:id/publish', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const entry = await publishJournalEntry(db, tenant.id, c.req.param('id'))
  if (!entry) return c.json({ error: 'Entry not found' }, 404)
  return c.json({ entry })
})

// POST /journal/:id/unpublish
journalRoutes.post('/:id/unpublish', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const entry = await unpublishJournalEntry(db, tenant.id, c.req.param('id'))
  if (!entry) return c.json({ error: 'Entry not found' }, 404)
  return c.json({ entry })
})

// DELETE /journal/:id
journalRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const existing = await getJournalEntryById(db, tenant.id, c.req.param('id'))
  if (!existing) return c.json({ error: 'Entry not found' }, 404)
  await deleteJournalEntry(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})
