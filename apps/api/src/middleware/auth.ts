import type { MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  getSessionByToken,
  getUserById,
  getTenantById,
  getTenantMember,
  isSessionValid,
} from '@moducore/db'
import type { AppVariables } from '../types'
import type { DbClient } from '@moducore/db'

export const SESSION_COOKIE = 'moducore_session'
export const SESSION_DURATION_DAYS = 30

// Resolves session from cookie and attaches user/tenant/member to context.
// Does NOT reject unauthenticated requests — use requireAuth for that.
export function sessionMiddleware(db: DbClient): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (token) {
      const session = await getSessionByToken(db, token)
      if (session && isSessionValid(session)) {
        const [user, tenant, member] = await Promise.all([
          getUserById(db, session.userId),
          getTenantById(db, session.tenantId),
          getTenantMember(db, session.tenantId, session.userId),
        ])
        if (user && tenant && member) {
          c.set('user', user)
          c.set('tenant', tenant)
          c.set('tenantMember', member)
        }
      }
    }
    await next()
  }
}

// Rejects with 401 if the request has no valid session
export const requireAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

// Rejects with 403 if the user's role is below the required level
export function requireRole(
  minRole: 'owner' | 'admin' | 'member'
): MiddlewareHandler<{ Variables: AppVariables }> {
  const roleRank = { owner: 3, admin: 2, member: 1 }
  return async (c, next) => {
    const member = c.get('tenantMember')
    if (!member || roleRank[member.role] < roleRank[minRole]) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
}

export { setCookie, deleteCookie }
