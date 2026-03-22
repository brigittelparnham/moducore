import { Hono } from 'hono'
import { apiError } from '@moducore/core'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { updateTenant, isTenantSlugAvailable } from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'

export const tenantsRoutes = new Hono<{ Variables: AppVariables }>()

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
    .optional(),
})

// GET /tenants/current
tenantsRoutes.get('/current', requireAuth, (c) => {
  const tenant = c.get('tenant')!
  return c.json({ tenant })
})

// PATCH /tenants/current
tenantsRoutes.patch(
  '/current',
  requireAuth,
  zValidator('json', updateTenantSchema),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const member = c.get('tenantMember')!

    if (member.role !== 'owner' && member.role !== 'admin') {
      return c.json(apiError("FORBIDDEN", 'Only owners and admins can update workspace settings'), 403)
    }

    const { name, slug } = c.req.valid('json')

    if (slug && slug !== tenant.slug) {
      const available = await isTenantSlugAvailable(db, slug)
      if (!available) return c.json(apiError("BAD_REQUEST", 'Workspace slug already taken'), 400)
    }

    const updated = await updateTenant(db, tenant.id, {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
    })

    return c.json({ tenant: updated })
  }
)
