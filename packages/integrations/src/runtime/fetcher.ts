import type { DbClient } from '@moducore/db'
import {
  getConnectorById,
  upsertConnectorCache,
  markConnectorSynced,
} from '@moducore/db'
import type { ConnectorAdapter } from '../types'
import { rssConnector } from '../connectors/rss'
import { restConnector } from '../connectors/rest'

// Registry of all available connector adapters, keyed by type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADAPTERS: Record<string, ConnectorAdapter<any, any>> = {
  rss: rssConnector,
  rest: restConnector,
}

/** Optional callback the caller provides to decrypt stored connector configs. */
type DecryptFn = (config: unknown) => unknown

export async function syncConnector(
  db: DbClient,
  tenantId: string,
  connectorId: string,
  decryptConfig?: DecryptFn
): Promise<{ ok: boolean; error?: string }> {
  const row = await getConnectorById(db, tenantId, connectorId)
  if (!row) return { ok: false, error: 'Connector not found' }
  if (!row.enabled) return { ok: false, error: 'Connector is disabled' }

  const adapter = ADAPTERS[row.type]
  if (!adapter) return { ok: false, error: `Unknown connector type: ${row.type}` }

  try {
    const config = decryptConfig ? decryptConfig(row.config) : row.config
    const data = await adapter.fetch(config as never)
    await upsertConnectorCache(db, row.id, row.tenantId, data)
    await markConnectorSynced(db, row.id)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sync failed' }
  }
}

export async function syncAllConnectors(db: DbClient, decryptConfig?: DecryptFn): Promise<void> {
  const { getAllTenantConnectors } = await import('@moducore/db')
  const all = await getAllTenantConnectors(db)
  await Promise.allSettled(
    all.map((row) => {
      const adapter = ADAPTERS[row.type]
      if (!adapter) return Promise.resolve()
      const config = decryptConfig ? decryptConfig(row.config) : row.config
      return adapter.fetch(config as never).then(async (data) => {
        await upsertConnectorCache(db, row.id, row.tenantId, data)
        await markConnectorSynced(db, row.id)
      })
    })
  )
}
