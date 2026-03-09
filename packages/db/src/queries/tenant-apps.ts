import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../client'
import { tenantApps, type TenantApp } from '../schema'

export async function getInstalledApps(db: DbClient, tenantId: string): Promise<TenantApp[]> {
  return db.query.tenantApps.findMany({
    where: (ta, { eq, and }) => and(eq(ta.tenantId, tenantId), eq(ta.enabled, true)),
    orderBy: (ta, { asc }) => [asc(ta.installedAt)],
  })
}

export async function isAppInstalled(
  db: DbClient,
  tenantId: string,
  appSlug: string
): Promise<boolean> {
  const row = await db.query.tenantApps.findFirst({
    where: (ta, { eq, and }) =>
      and(eq(ta.tenantId, tenantId), eq(ta.appSlug, appSlug), eq(ta.enabled, true)),
    columns: { id: true },
  })
  return row !== undefined
}

export async function installApp(
  db: DbClient,
  tenantId: string,
  appSlug: string
): Promise<TenantApp> {
  const existing = await db.query.tenantApps.findFirst({
    where: (ta, { eq, and }) => and(eq(ta.tenantId, tenantId), eq(ta.appSlug, appSlug)),
  })
  if (existing) {
    const [updated] = await db
      .update(tenantApps)
      .set({ enabled: true })
      .where(and(eq(tenantApps.tenantId, tenantId), eq(tenantApps.appSlug, appSlug)))
      .returning()
    return updated
  }
  const [row] = await db.insert(tenantApps).values({ tenantId, appSlug }).returning()
  return row
}

export async function uninstallApp(
  db: DbClient,
  tenantId: string,
  appSlug: string
): Promise<void> {
  await db
    .update(tenantApps)
    .set({ enabled: false })
    .where(and(eq(tenantApps.tenantId, tenantId), eq(tenantApps.appSlug, appSlug)))
}
