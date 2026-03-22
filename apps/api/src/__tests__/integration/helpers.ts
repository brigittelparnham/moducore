/**
 * Integration test helpers.
 *
 * Creates a lightweight Hono app instance that wires up the full middleware
 * stack (request ID, session) and the routes under test.  Each test suite
 * should call `createTestApp()` in its `beforeAll` and use the returned
 * `app.request()` method to make in-process HTTP calls.
 *
 * The test database is connected via TEST_DATABASE_URL (see setup.ts).
 * Call `cleanupTestData()` after each test to leave the DB clean.
 */

import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { getDb } from '../../lib/db'
import { sessionMiddleware } from '../../middleware/auth'
import { requestIdMiddleware } from '../../middleware/request-id'
import { authRoutes } from '../../routes/auth'
import { pagesRoutes, publicPagesRoutes } from '../../routes/pages'
import { journalRoutes } from '../../routes/journal'
import type { AppVariables } from '../../types'

export function createTestApp() {
  const db = getDb()
  const app = new Hono<{ Variables: AppVariables }>()
  app.use(requestIdMiddleware)
  app.use(sessionMiddleware(db))
  app.route('/auth', authRoutes)
  app.route('/pages', pagesRoutes)
  app.route('/public', publicPagesRoutes)
  app.route('/journal', journalRoutes)
  return app
}

/** POST helper — sends JSON body, returns parsed response */
export async function post(
  app: ReturnType<typeof createTestApp>,
  path: string,
  body: unknown,
  cookie?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie'] = cookie
  const res = await app.request(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, data, headers: res.headers }
}

/** GET helper */
export async function get(
  app: ReturnType<typeof createTestApp>,
  path: string,
  cookie?: string
) {
  const headers: Record<string, string> = {}
  if (cookie) headers['Cookie'] = cookie
  const res = await app.request(path, { method: 'GET', headers })
  const data = await res.json()
  return { status: res.status, data, headers: res.headers }
}

/** Extract the session cookie from a Set-Cookie header */
export function extractCookie(headers: Headers): string | undefined {
  return headers.get('set-cookie')?.split(';')[0] ?? undefined
}

/** Delete all test users/tenants created during a test run */
export async function cleanupTestData(emails: string[]) {
  if (emails.length === 0) return
  const db = getDb()
  // Cascade: ON DELETE CASCADE handles sessions/members/tenants automatically
  // but we clean up explicitly for clarity and safety
  for (const email of emails) {
    const lower = email.toLowerCase()
    await db.execute(sql`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ${lower})`)
    await db.execute(sql`DELETE FROM tenant_members WHERE user_id IN (SELECT id FROM users WHERE email = ${lower})`)
    await db.execute(sql`
      DELETE FROM tenants WHERE id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id IN (SELECT id FROM users WHERE email = ${lower})
      )
    `)
    await db.execute(sql`DELETE FROM users WHERE email = ${lower}`)
  }
}
