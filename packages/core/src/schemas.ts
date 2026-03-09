import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const contentStatusSchema = z.enum(['draft', 'published'])

export const userRoleSchema = z.enum(['owner', 'admin', 'member'])

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantName: z.string().min(1, 'Workspace name is required'),
  tenantSlug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>

const slugRegex = /^[a-z0-9-]+$/

export const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(slugRegex, 'Only lowercase letters, numbers, and hyphens'),
  content: z.record(z.unknown()).default({}),
})

export const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(slugRegex, 'Only lowercase letters, numbers, and hyphens')
    .optional(),
  content: z.record(z.unknown()).optional(),
})

export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
