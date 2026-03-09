import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../client'
import {
  connectors,
  connectorDataCache,
  type Connector,
  type NewConnector,
  type ConnectorDataCache,
} from '../schema'

// ─── Connectors ──────────────────────────────────────────────────────────────

export async function getConnectorsByTenant(db: DbClient, tenantId: string): Promise<Connector[]> {
  return db.query.connectors.findMany({
    where: (c, { eq }) => eq(c.tenantId, tenantId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  })
}

export async function getConnectorById(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<Connector | undefined> {
  return db.query.connectors.findFirst({
    where: (c, { eq, and }) => and(eq(c.tenantId, tenantId), eq(c.id, id)),
  })
}

export async function createConnector(
  db: DbClient,
  data: Pick<NewConnector, 'tenantId' | 'type' | 'name' | 'config'>
): Promise<Connector> {
  const [row] = await db.insert(connectors).values(data).returning()
  return row
}

export async function updateConnector(
  db: DbClient,
  tenantId: string,
  id: string,
  data: Partial<Pick<Connector, 'name' | 'config' | 'enabled'>>
): Promise<Connector | undefined> {
  const [row] = await db
    .update(connectors)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(connectors.tenantId, tenantId), eq(connectors.id, id)))
    .returning()
  return row
}

export async function deleteConnector(db: DbClient, tenantId: string, id: string): Promise<void> {
  await db
    .delete(connectors)
    .where(and(eq(connectors.tenantId, tenantId), eq(connectors.id, id)))
}

export async function markConnectorSynced(db: DbClient, id: string): Promise<void> {
  await db
    .update(connectors)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(connectors.id, id))
}

// ─── Cache ───────────────────────────────────────────────────────────────────

export async function getLatestConnectorCache(
  db: DbClient,
  connectorId: string
): Promise<ConnectorDataCache | undefined> {
  return db.query.connectorDataCache.findFirst({
    where: (c, { eq }) => eq(c.connectorId, connectorId),
    orderBy: (c, { desc }) => [desc(c.fetchedAt)],
  })
}

export async function getAllTenantConnectors(db: DbClient): Promise<Connector[]> {
  // Used by the scheduler to sync all enabled connectors across all tenants
  return db.query.connectors.findMany({
    where: (c, { eq }) => eq(c.enabled, true),
  })
}

export async function upsertConnectorCache(
  db: DbClient,
  connectorId: string,
  tenantId: string,
  data: unknown
): Promise<void> {
  // Delete stale rows then insert fresh — keeps the table tidy
  await db.delete(connectorDataCache).where(eq(connectorDataCache.connectorId, connectorId))
  await db.insert(connectorDataCache).values({ connectorId, tenantId, data: data as object })
}
