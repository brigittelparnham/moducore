export type AppSlug = 'cms' | 'journal'

export type UserRole = 'owner' | 'admin' | 'member'

export type ContentStatus = 'draft' | 'published'

export type TenantContext = {
  tenantId: string
  userId: string
  role: UserRole
}
