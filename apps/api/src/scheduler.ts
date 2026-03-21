import { syncAllConnectors } from '@moducore/integrations'
import { getAllConnectedSpotify } from '@moducore/db'
import { getDb } from './lib/db'
import { syncSpotifyForTenant } from './routes/spotify'
import { detectJourneysForTenant } from './lib/journey-detection'
import { getAccounts } from '@moducore/db'
import { syncStarlingAccount } from './lib/starling'

const INTERVAL_MS = 15 * 60 * 1000 // 15 minutes
const JOURNEY_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function startScheduler(): void {
  console.log('[scheduler] Starting — syncing every 15 minutes, journey detection every 5 minutes')

  setTimeout(async () => { await runSync() }, 5000)
  setInterval(async () => { await runSync() }, INTERVAL_MS)

  // Journey detection runs more frequently
  setInterval(async () => { await runJourneyDetection() }, JOURNEY_INTERVAL_MS)
}

async function runSync() {
  const db = getDb()

  try {
    console.log('[scheduler] Syncing all connectors…')
    await syncAllConnectors(db)
    console.log('[scheduler] Connectors synced')
  } catch (e) {
    console.error('[scheduler] Connector sync failed:', e)
  }

  try {
    console.log('[scheduler] Syncing Spotify…')
    const connections = await getAllConnectedSpotify(db)
    await Promise.allSettled(
      connections.map((conn) =>
        syncSpotifyForTenant(db, conn).catch((e) =>
          console.error(`[scheduler] Spotify sync failed for tenant ${conn.tenantId}:`, e)
        )
      )
    )
    console.log(`[scheduler] Spotify synced (${connections.length} tenants)`)
  } catch (e) {
    console.error('[scheduler] Spotify sync failed:', e)
  }

  try {
    const tenants = await db.query.tenants.findMany()
    for (const tenant of tenants) {
      const accounts = await getAccounts(db, tenant.id)
      const starlingAccounts = accounts.filter(
        (a) => a.provider === 'starling' && a.starlingAccountUid && a.starlingAccessToken
      )
      await Promise.allSettled(
        starlingAccounts.map((a) =>
          syncStarlingAccount(db, tenant.id, a.id, a.starlingAccessToken!, a.starlingAccountUid!)
            .catch((e) => console.error(`[scheduler] Starling sync failed for account ${a.id}:`, e))
        )
      )
    }
  } catch (e) {
    console.error('[scheduler] Starling sync failed:', e)
  }
}

async function runJourneyDetection() {
  const db = getDb()
  try {
    const tenants = await db.query.tenants.findMany()
    await Promise.allSettled(
      tenants.map((t) =>
        detectJourneysForTenant(db, t.id).catch((e) =>
          console.error(`[scheduler] Journey detection failed for tenant ${t.id}:`, e)
        )
      )
    )
  } catch (e) {
    console.error('[scheduler] Journey detection failed:', e)
  }
}
