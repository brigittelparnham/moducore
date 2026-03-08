import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { setCookie, deleteCookie } from 'hono/cookie'
import { users, tenants, tenantMembers, createSession, isTenantSlugAvailable } from '@moducore/db'
import { signupSchema, loginSchema } from '@moducore/core'
import { hashPassword, verifyPassword, generateToken } from '../lib/crypto'
import { getDb } from '../lib/db'
import { SESSION_COOKIE, SESSION_DURATION_DAYS, requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'
import type { User } from '@moducore/db'

export const authRoutes = new Hono<{ Variables: AppVariables }>()

type SafeUser = Omit<User, 'passwordHash' | 'deletedAt'>

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _ph, deletedAt: _da, ...safe } = user
  return safe
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  }
}

async function createAndSetSession(
  c: Parameters<typeof setCookie>[0],
  userId: string,
  tenantId: string
) {
  const db = getDb()
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  await createSession(db, { userId, tenantId, token, expiresAt })
  setCookie(c, SESSION_COOKIE, token, sessionCookieOptions())
}

// POST /auth/signup
authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const db = getDb()
  const { name, email, password, tenantName, tenantSlug } = c.req.valid('json')

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email.toLowerCase()),
    columns: { id: true },
  })
  if (existing) return c.json({ error: 'Email already in use' }, 400)

  const slugAvailable = await isTenantSlugAvailable(db, tenantSlug)
  if (!slugAvailable) return c.json({ error: 'Workspace slug already taken' }, 400)

  const passwordHash = await hashPassword(password)

  const { user, tenant } = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning()
    const [tenant] = await tx.insert(tenants).values({ name: tenantName, slug: tenantSlug }).returning()
    await tx.insert(tenantMembers).values({ userId: user.id, tenantId: tenant.id, role: 'owner' })
    return { user, tenant }
  })

  await createAndSetSession(c, user.id, tenant.id)
  return c.json({ user: toSafeUser(user), tenant }, 201)
})

// POST /auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = getDb()
  const { email, password } = c.req.valid('json')

  const user = await db.query.users.findFirst({
    where: (u, { eq, isNull, and }) =>
      and(eq(u.email, email.toLowerCase()), isNull(u.deletedAt)),
  })

  // Constant-time: always hash even on not-found to prevent timing attacks
  const dummyHash = 'a:b'
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, dummyHash).catch(() => false)

  if (!user || !passwordOk) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Get the user's primary tenant (first owner membership, or first membership)
  const membership = await db.query.tenantMembers.findFirst({
    where: (tm, { eq }) => eq(tm.userId, user.id),
    orderBy: (tm, { asc }) => [asc(tm.createdAt)],
  })

  if (!membership) {
    return c.json({ error: 'No workspace found for this account' }, 400)
  }

  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.id, membership.tenantId),
  })

  if (!tenant) {
    return c.json({ error: 'Workspace not found' }, 400)
  }

  await createAndSetSession(c, user.id, tenant.id)
  return c.json({ user: toSafeUser(user), tenant })
})

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

// GET /auth/me
authRoutes.get('/me', requireAuth, (c) => {
  const user = c.get('user')!
  const tenant = c.get('tenant')!
  const member = c.get('tenantMember')!
  return c.json({ user: toSafeUser(user), tenant, role: member.role })
})
