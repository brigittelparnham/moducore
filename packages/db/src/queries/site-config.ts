import { eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import { siteConfigs, type SiteConfig, type NewSiteConfig } from '../schema/site-config'

export async function getSiteConfig(db: DbClient, tenantId: string): Promise<SiteConfig | null> {
  const row = await db.query.siteConfigs.findFirst({
    where: eq(siteConfigs.tenantId, tenantId),
  })
  return row ?? null
}

export async function upsertSiteConfig(
  db: DbClient,
  tenantId: string,
  values: Partial<Omit<NewSiteConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<SiteConfig> {
  const existing = await getSiteConfig(db, tenantId)
  if (existing) {
    const [updated] = await db
      .update(siteConfigs)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(siteConfigs.tenantId, tenantId))
      .returning()
    return updated
  }
  const [created] = await db
    .insert(siteConfigs)
    .values({ tenantId, ...values })
    .returning()
  return created
}
