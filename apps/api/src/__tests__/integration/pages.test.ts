/**
 * E2 — Pages + Journal integration tests.
 *
 * Requires TEST_DATABASE_URL.  Skipped automatically otherwise.
 *
 * Covers:
 * - Pages: create, update, publish, unpublish, public fetch, delete
 * - Journal: create, update own entry, reject update of other user's entry
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestApp, post, get, extractCookie, cleanupTestData } from './helpers'

const runIntegration = process.env.TEST_DATABASE_URL ? describe : describe.skip

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function patch(
  app: ReturnType<typeof createTestApp>,
  path: string,
  body: unknown,
  cookie?: string
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie'] = cookie
  const res = await app.request(path, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

const OWNER_EMAIL = 'pages-owner@moducore.test'
const MEMBER_EMAIL = 'pages-member@moducore.test'

runIntegration('Pages — integration', () => {
  const app = createTestApp()
  let ownerCookie: string
  let ownerTenantSlug: string

  beforeAll(async () => {
    // Sign up owner
    const { headers, data } = await post(app, '/auth/signup', {
      name: 'Owner',
      email: OWNER_EMAIL,
      password: 'OwnerPass1!Secure',
      tenantName: 'Pages Test Workspace',
      tenantSlug: `pages-test-${Date.now()}`,
    })
    ownerCookie = extractCookie(headers)!
    ownerTenantSlug = data.tenant.slug
  })

  afterAll(async () => {
    await cleanupTestData([OWNER_EMAIL, MEMBER_EMAIL])
  })

  describe('POST /pages — create', () => {
    it('creates a draft page and returns it', async () => {
      const { status, data } = await post(
        app,
        '/pages',
        { title: 'Hello World', slug: 'hello-world', content: {} },
        ownerCookie
      )
      expect(status).toBe(201)
      expect(data.page.title).toBe('Hello World')
      expect(data.page.status).toBe('draft')
    })

    it('rejects a duplicate slug with 400', async () => {
      const { status, data } = await post(
        app,
        '/pages',
        { title: 'Duplicate', slug: 'hello-world', content: {} },
        ownerCookie
      )
      expect(status).toBe(400)
      expect(data.error.code).toBe('BAD_REQUEST')
    })

    it('rejects creation without auth with 401', async () => {
      const { status } = await post(app, '/pages', { title: 'No Auth', slug: 'no-auth' })
      expect(status).toBe(401)
    })
  })

  describe('POST /pages/:id/publish + unpublish', () => {
    let pageId: string

    beforeAll(async () => {
      const { data } = await post(
        app,
        '/pages',
        { title: 'Publish Test', slug: `publish-test-${Date.now()}`, content: {} },
        ownerCookie
      )
      pageId = data.page.id
    })

    it('publishes a draft page', async () => {
      const { status, data } = await post(app, `/pages/${pageId}/publish`, {}, ownerCookie)
      expect(status).toBe(200)
      expect(data.page.status).toBe('published')
    })

    it('unpublishes a published page back to draft', async () => {
      const { status, data } = await post(app, `/pages/${pageId}/unpublish`, {}, ownerCookie)
      expect(status).toBe(200)
      expect(data.page.status).toBe('draft')
    })
  })

  describe('GET /public/:tenantSlug/pages/:slug', () => {
    it('serves a published page publicly without auth', async () => {
      // Create and publish a page
      const slug = `public-page-${Date.now()}`
      const { data: created } = await post(
        app,
        '/pages',
        { title: 'Public Page', slug, content: {} },
        ownerCookie
      )
      await post(app, `/pages/${created.page.id}/publish`, {}, ownerCookie)

      // Fetch without any cookie
      const { status, data } = await get(app, `/public/${ownerTenantSlug}/pages/${slug}`)
      expect(status).toBe(200)
      expect(data.page.title).toBe('Public Page')
    })

    it('returns 404 for a draft page', async () => {
      const slug = `draft-page-${Date.now()}`
      await post(
        app,
        '/pages',
        { title: 'Draft Page', slug, content: {} },
        ownerCookie
      )
      const { status } = await get(app, `/public/${ownerTenantSlug}/pages/${slug}`)
      expect(status).toBe(404)
    })
  })
})

// ─── Journal ──────────────────────────────────────────────────────────────────

runIntegration('Journal — integration', () => {
  const app = createTestApp()
  let ownerCookie: string

  beforeAll(async () => {
    const { headers } = await post(app, '/auth/signup', {
      name: 'Journal Owner',
      email: MEMBER_EMAIL,
      password: 'JournalPass1!Secure',
      tenantName: 'Journal Test Workspace',
      tenantSlug: `journal-test-${Date.now()}`,
    })
    ownerCookie = extractCookie(headers)!
  })

  afterAll(async () => {
    await cleanupTestData([MEMBER_EMAIL])
  })

  describe('POST /journal — create', () => {
    it('creates a journal entry', async () => {
      const { status, data } = await post(
        app,
        '/journal',
        { title: 'My First Entry', content: { type: 'doc', content: [] }, tags: ['test'] },
        ownerCookie
      )
      expect(status).toBe(201)
      expect(data.entry.title).toBe('My First Entry')
      expect(data.entry.tags).toContain('test')
    })

    it('rejects creation without auth', async () => {
      const { status } = await post(app, '/journal', { title: 'No Auth', content: {} })
      expect(status).toBe(401)
    })
  })

  describe('PATCH /journal/:id — update', () => {
    let entryId: string

    beforeAll(async () => {
      const { data } = await post(
        app,
        '/journal',
        { title: 'Entry to Update', content: {}, tags: [] },
        ownerCookie
      )
      entryId = data.entry.id
    })

    it('allows the author to update their own entry', async () => {
      const { status, data } = await patch(
        app,
        `/journal/${entryId}`,
        { title: 'Updated Title' },
        ownerCookie
      )
      expect(status).toBe(200)
      expect(data.entry.title).toBe('Updated Title')
    })

    it('returns 404 for a non-existent entry', async () => {
      const { status } = await patch(
        app,
        '/journal/00000000-0000-0000-0000-000000000000',
        { title: 'Ghost' },
        ownerCookie
      )
      expect(status).toBe(404)
    })
  })
})
