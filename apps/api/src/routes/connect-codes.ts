import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { appLinkTokens } from '@moducore/db'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'

export const connectCodesRoutes = new Hono<{ Variables: AppVariables }>()

function makeCode() {
  // 6 uppercase alphanumeric chars, easy to type
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// POST /connect-codes/generate — generate a code for this tenant's app data
connectCodesRoutes.post(
  '/generate',
  requireAuth,
  zValidator('json', z.object({ appSlug: z.string() })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { appSlug } = c.req.valid('json')

    // Invalidate any existing unused codes for this tenant+app
    await db
      .update(appLinkTokens)
      .set({ expiresAt: new Date() })
      .where(
        and(
          eq(appLinkTokens.grantingTenantId, tenant.id),
          eq(appLinkTokens.appSlug, appSlug),
          isNull(appLinkTokens.grantedToTenantId),
        )
      )

    const token = makeCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await db.insert(appLinkTokens).values({
      grantingTenantId: tenant.id,
      appSlug,
      token,
      expiresAt,
    })

    return c.json({ code: token, expiresAt })
  }
)

// POST /connect-codes/consume — consume a code to link data access
connectCodesRoutes.post(
  '/consume',
  requireAuth,
  zValidator('json', z.object({ code: z.string() })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { code } = c.req.valid('json')

    const linkToken = await db.query.appLinkTokens.findFirst({
      where: and(
        eq(appLinkTokens.token, code.toUpperCase()),
        isNull(appLinkTokens.grantedToTenantId),
        gt(appLinkTokens.expiresAt, new Date()),
      ),
    })

    if (!linkToken) return c.json({ error: 'Invalid or expired code' }, 400)
    if (linkToken.grantingTenantId === tenant.id) {
      return c.json({ error: 'Cannot link to yourself' }, 400)
    }

    await db
      .update(appLinkTokens)
      .set({ grantedToTenantId: tenant.id, grantedAt: new Date() })
      .where(eq(appLinkTokens.id, linkToken.id))

    return c.json({
      appSlug: linkToken.appSlug,
      grantingTenantId: linkToken.grantingTenantId,
    })
  }
)

// GET /connect-codes/links — list active links for current tenant (both granted and received)
connectCodesRoutes.get('/links', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!

  const granted = await db.query.appLinkTokens.findMany({
    where: and(
      eq(appLinkTokens.grantingTenantId, tenant.id),
      gt(appLinkTokens.expiresAt, new Date()),
    ),
    columns: { id: true, appSlug: true, grantedToTenantId: true, grantedAt: true, expiresAt: true },
  })

  const received = await db.query.appLinkTokens.findMany({
    where: eq(appLinkTokens.grantedToTenantId, tenant.id),
    columns: { id: true, appSlug: true, grantingTenantId: true, grantedAt: true },
  })

  return c.json({ granted, received })
})
