import { and, eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import { tenantMembers, type NewTenantMember, type TenantMember } from '../schema'

export async function getTenantMember(
  db: DbClient,
  tenantId: string,
  userId: string
): Promise<TenantMember | undefined> {
  return db.query.tenantMembers.findFirst({
    where: (tm, { eq, and }) => and(eq(tm.tenantId, tenantId), eq(tm.userId, userId)),
  })
}

export async function getTenantMembers(db: DbClient, tenantId: string): Promise<TenantMember[]> {
  return db.query.tenantMembers.findMany({
    where: (tm, { eq }) => eq(tm.tenantId, tenantId),
  })
}

export async function createTenantMember(
  db: DbClient,
  data: NewTenantMember
): Promise<TenantMember> {
  const [member] = await db.insert(tenantMembers).values(data).returning()
  return member
}

export async function updateTenantMemberRole(
  db: DbClient,
  tenantId: string,
  userId: string,
  role: TenantMember['role']
): Promise<TenantMember | undefined> {
  const [updated] = await db
    .update(tenantMembers)
    .set({ role })
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)))
    .returning()
  return updated
}

export async function removeTenantMember(
  db: DbClient,
  tenantId: string,
  userId: string
): Promise<void> {
  await db
    .delete(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)))
}
