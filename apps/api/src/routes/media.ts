import { Hono } from 'hono'
import { apiError } from '@moducore/core'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getMediaByTenant, getMediaById, createMediaRecord, deleteMediaRecord } from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth, requireRole } from '../middleware/auth'
import { UPLOAD_MAX_BYTES } from '../config'
import type { AppVariables } from '../types'

export const mediaRoutes = new Hono<{ Variables: AppVariables }>()

mediaRoutes.use(requireAuth)

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
])

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
}

const MAX_BYTES = UPLOAD_MAX_BYTES

function getUploadsDir(tenantId?: string): string {
  return tenantId
    ? path.join(process.cwd(), 'uploads', tenantId)
    : path.join(process.cwd(), 'uploads')
}

// GET /media — list all media for the tenant
mediaRoutes.get('/', async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const items = await getMediaByTenant(db, tenant.id)
  return c.json({ media: items })
})

// POST /media — upload a file (multipart/form-data, field name "file")
mediaRoutes.post('/', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const user = c.get('user')!

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || !(file instanceof File)) {
    return c.json(apiError("BAD_REQUEST", 'file is required (multipart field "file")'), 400)
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return c.json(apiError("BAD_REQUEST", `File type "${file.type}" is not allowed`), 400)
  }

  if (file.size > MAX_BYTES) {
    return c.json(apiError("BAD_REQUEST", 'File exceeds 10 MB limit'), 400)
  }

  const ext = MIME_TO_EXT[file.type] ?? path.extname(file.name).toLowerCase()
  const filename = `${randomUUID()}${ext}`

  const uploadsDir = getUploadsDir(tenant.id)
  await fs.mkdir(uploadsDir, { recursive: true })
  await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))

  const record = await createMediaRecord(db, {
    tenantId: tenant.id,
    filename: file.name, // original filename for display
    url: `/uploads/${tenant.id}/${filename}`, // tenant-scoped path
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedBy: user.id,
  })

  return c.json({ media: record }, 201)
})

// DELETE /media/:id — soft-delete record and remove file from disk
mediaRoutes.delete('/:id', requireRole('member'), async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const id = c.req.param('id')

  const item = await getMediaById(db, tenant.id, id)
  if (!item) return c.json(apiError("NOT_FOUND", 'Not found'), 404)

  await deleteMediaRecord(db, tenant.id, id)

  // Best-effort file deletion — derive disk path directly from stored URL
  // Handles both legacy flat (/uploads/uuid.ext) and tenant-scoped (/uploads/tenantId/uuid.ext)
  try {
    const diskPath = path.join(process.cwd(), item.url)
    await fs.unlink(diskPath)
  } catch {
    // File already gone — not an error
  }

  return c.json({ ok: true })
})
