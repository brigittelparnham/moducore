import type { User, Tenant, TenantMember } from '@moducore/db'

// Variables attached to Hono context per request
export type AppVariables = {
  user?: User
  tenant?: Tenant
  tenantMember?: TenantMember
}
