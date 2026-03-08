import { eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import { tenants, type NewTenant, type Tenant } from '../schema'

export async function getTenantById(db: DbClient, id: string): Promise<Tenant | undefined> {
  return db.query.tenants.findFirst({
    where: (t, { eq, isNull, and }) => and(eq(t.id, id), isNull(t.deletedAt)),
  })
}

export async function getTenantBySlug(db: DbClient, slug: string): Promise<Tenant | undefined> {
  return db.query.tenants.findFirst({
    where: (t, { eq, isNull, and }) => and(eq(t.slug, slug), isNull(t.deletedAt)),
  })
}

export async function createTenant(db: DbClient, data: NewTenant): Promise<Tenant> {
  const [tenant] = await db.insert(tenants).values(data).returning()
  return tenant
}

export async function updateTenant(
  db: DbClient,
  id: string,
  data: Partial<Pick<Tenant, 'name' | 'slug' | 'plan'>>
): Promise<Tenant | undefined> {
  const [updated] = await db
    .update(tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tenants.id, id))
    .returning()
  return updated
}

export async function deleteTenant(db: DbClient, id: string): Promise<void> {
  await db
    .update(tenants)
    .set({ deletedAt: new Date() })
    .where(eq(tenants.id, id))
}

export async function isTenantSlugAvailable(db: DbClient, slug: string): Promise<boolean> {
  const existing = await db.query.tenants.findFirst({
    where: (t, { eq, isNull, and }) => and(eq(t.slug, slug), isNull(t.deletedAt)),
    columns: { id: true },
  })
  return existing === undefined
}
