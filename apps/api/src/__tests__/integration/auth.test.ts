/**
 * E1 — Auth integration tests.
 *
 * These tests exercise the full HTTP stack: request ID middleware → session
 * middleware → auth routes → DB layer.  They require a running PostgreSQL
 * database.  Set TEST_DATABASE_URL to run them:
 *
 *   TEST_DATABASE_URL=postgresql://moducore:moducore@localhost:5432/moducore_test vitest run
 *
 * Without TEST_DATABASE_URL the suite is skipped — unit tests still run.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { createTestApp, post, get, extractCookie, cleanupTestData } from './helpers'

const TEST_EMAILS = ['auth-test-user@moducore.test']

const runIntegration = process.env.TEST_DATABASE_URL ? describe : describe.skip

runIntegration('Auth — integration', () => {
  const app = createTestApp()

  const validSignup = {
    name: 'Test User',
    email: TEST_EMAILS[0],
    password: 'TestPass1!SecureEnough',
    tenantName: 'Test Workspace',
    tenantSlug: `test-workspace-${Date.now()}`,
  }

  afterAll(async () => {
    await cleanupTestData(TEST_EMAILS)
  })

  // ─── Signup ───────────────────────────────────────────────────────────────

  describe('POST /auth/signup', () => {
    it('creates a user, tenant, and session on valid signup', async () => {
      const { status, data, headers } = await post(app, '/auth/signup', validSignup)

      expect(status).toBe(201)
      expect(data.user.email).toBe(validSignup.email)
      expect(data.user.passwordHash).toBeUndefined() // never returned
      expect(data.tenant.slug).toBe(validSignup.tenantSlug)
      expect(extractCookie(headers)).toMatch(/moducore_session=/)
    })

    it('rejects a duplicate email with 400', async () => {
      const { status, data } = await post(app, '/auth/signup', validSignup)
      expect(status).toBe(400)
      expect(data.error.code).toBe('BAD_REQUEST')
    })

    it('rejects an invalid password (too short) with 400', async () => {
      const { status } = await post(app, '/auth/signup', {
        ...validSignup,
        email: 'other@moducore.test',
        password: 'short',
      })
      expect(status).toBe(400)
    })

    it('rejects a slug with uppercase characters', async () => {
      const { status } = await post(app, '/auth/signup', {
        ...validSignup,
        email: 'other2@moducore.test',
        tenantSlug: 'UPPERCASE-SLUG',
      })
      expect(status).toBe(400)
    })
  })

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('returns a session cookie on valid credentials', async () => {
      const { status, data, headers } = await post(app, '/auth/login', {
        email: validSignup.email,
        password: validSignup.password,
      })

      expect(status).toBe(200)
      expect(data.user.email).toBe(validSignup.email)
      expect(extractCookie(headers)).toMatch(/moducore_session=/)
    })

    it('returns 401 for a wrong password', async () => {
      const { status, data } = await post(app, '/auth/login', {
        email: validSignup.email,
        password: 'WrongPassword1!',
      })
      expect(status).toBe(401)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 for an unknown email', async () => {
      const { status } = await post(app, '/auth/login', {
        email: 'nobody@moducore.test',
        password: 'SomePass1!',
      })
      expect(status).toBe(401)
    })
  })

  // ─── requireAuth guard ────────────────────────────────────────────────────

  describe('requireAuth middleware', () => {
    it('rejects unauthenticated requests to protected routes with 401', async () => {
      const { status, data } = await get(app, '/pages')
      expect(status).toBe(401)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('allows authenticated requests through', async () => {
      // Login first to get a valid session cookie
      const { headers } = await post(app, '/auth/login', {
        email: validSignup.email,
        password: validSignup.password,
      })
      const cookie = extractCookie(headers)!

      const { status } = await get(app, '/pages', cookie)
      expect(status).toBe(200)
    })
  })

  // ─── /auth/me ─────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('returns the current user and tenant when authenticated', async () => {
      const { headers } = await post(app, '/auth/login', {
        email: validSignup.email,
        password: validSignup.password,
      })
      const cookie = extractCookie(headers)!

      const { status, data } = await get(app, '/auth/me', cookie)
      expect(status).toBe(200)
      expect(data.user.email).toBe(validSignup.email)
      expect(data.role).toBe('owner')
    })

    it('returns 401 without a session', async () => {
      const { status } = await get(app, '/auth/me')
      expect(status).toBe(401)
    })
  })

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('clears the session cookie', async () => {
      const { headers: loginHeaders } = await post(app, '/auth/login', {
        email: validSignup.email,
        password: validSignup.password,
      })
      const cookie = extractCookie(loginHeaders)!

      const { status } = await post(app, '/auth/logout', {}, cookie)
      expect(status).toBe(200)
    })
  })
})
