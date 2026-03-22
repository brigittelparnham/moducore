import { describe, it, expect } from 'vitest'
import {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  createPageSchema,
  updatePageSchema,
  paginationSchema,
} from '../schemas'

// ─── Password rules ────────────────────────────────────────────────────────────

describe('passwordSchema (via signupSchema)', () => {
  const base = {
    name: 'Alice',
    email: 'alice@example.com',
    tenantName: 'ACME',
    tenantSlug: 'acme',
  }

  it('accepts a strong password', () => {
    const result = signupSchema.safeParse({ ...base, password: 'Correct-Horse1' })
    expect(result.success).toBe(true)
  })

  it('rejects passwords shorter than 12 characters', () => {
    const result = signupSchema.safeParse({ ...base, password: 'Short1!' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/12 characters/)
  })

  it('rejects passwords with no digit', () => {
    const result = signupSchema.safeParse({ ...base, password: 'NoDigitsHereAtAll!' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/number/)
  })

  it('rejects passwords with no special character', () => {
    const result = signupSchema.safeParse({ ...base, password: 'NoSpecialChar1234' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/special character/)
  })
})

// ─── signupSchema ─────────────────────────────────────────────────────────────

describe('signupSchema', () => {
  const valid = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'ValidPass1!Secure',  // 17 chars, has digit + special char
    tenantName: 'ACME Corp',
    tenantSlug: 'acme-corp',
  }

  it('accepts a valid signup payload', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects a blank name', () => {
    const result = signupSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a slug with uppercase', () => {
    const result = signupSchema.safeParse({ ...valid, tenantSlug: 'ACME' })
    expect(result.success).toBe(false)
  })

  it('rejects a slug with spaces', () => {
    const result = signupSchema.safeParse({ ...valid, tenantSlug: 'my workspace' })
    expect(result.success).toBe(false)
  })

  it('rejects a slug shorter than 2 characters', () => {
    const result = signupSchema.safeParse({ ...valid, tenantSlug: 'a' })
    expect(result.success).toBe(false)
  })

  it('accepts optional appSlug', () => {
    const result = signupSchema.safeParse({ ...valid, appSlug: 'journal' })
    expect(result.success).toBe(true)
    expect(result.data?.appSlug).toBe('journal')
  })
})

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'anything' }).success).toBe(true)
  })

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'invalid', password: 'pass' }).success).toBe(false)
  })
})

// ─── resetPasswordSchema ──────────────────────────────────────────────────────

describe('resetPasswordSchema', () => {
  it('accepts a valid reset payload', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'NewPass1!SecureEnough',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a weak password on reset', () => {
    const result = resetPasswordSchema.safeParse({ token: 'abc123', password: 'weak' })
    expect(result.success).toBe(false)
  })
})

// ─── createPageSchema ─────────────────────────────────────────────────────────

describe('createPageSchema', () => {
  it('accepts a valid page with content', () => {
    const result = createPageSchema.safeParse({
      title: 'Hello World',
      slug: 'hello-world',
      content: { type: 'doc', content: [] },
    })
    expect(result.success).toBe(true)
  })

  it('defaults content to empty object when omitted', () => {
    const result = createPageSchema.safeParse({ title: 'Hi', slug: 'hi' })
    expect(result.success).toBe(true)
    expect(result.data?.content).toEqual({})
  })

  it('rejects a slug with uppercase', () => {
    const result = createPageSchema.safeParse({ title: 'Test', slug: 'Hello-World' })
    expect(result.success).toBe(false)
  })

  it('rejects a slug with spaces', () => {
    const result = createPageSchema.safeParse({ title: 'Test', slug: 'my page' })
    expect(result.success).toBe(false)
  })
})

// ─── updatePageSchema ─────────────────────────────────────────────────────────

describe('updatePageSchema', () => {
  it('accepts partial updates', () => {
    expect(updatePageSchema.safeParse({ title: 'New Title' }).success).toBe(true)
    expect(updatePageSchema.safeParse({ slug: 'new-slug' }).success).toBe(true)
    expect(updatePageSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid slug in a partial update', () => {
    expect(updatePageSchema.safeParse({ slug: 'Invalid Slug' }).success).toBe(false)
  })
})

// ─── paginationSchema ─────────────────────────────────────────────────────────

describe('paginationSchema', () => {
  it('defaults to page 1 limit 20', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ page: 1, limit: 20 })
  })

  it('accepts custom valid values', () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ page: 3, limit: 50 })
  })

  it('rejects limit > 100', () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false)
  })

  it('rejects page < 1', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false)
  })
})
