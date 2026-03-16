import { syncAllConnectors } from '@moducore/integrations'
import { getAllConnectedSpotify } from '@moducore/db'
import { getDb } from './lib/db'
import { syncSpotifyForTenant } from './routes/spotify'

const INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export function startScheduler(): void {
  console.log('[scheduler] Starting — syncing every 15 minutes')

  // Run once immediately on startup (after a short delay to let the server settle)
  setTimeout(async () => {
    await runSync()
  }, 5000)

  // Then on interval
  setInterval(async () => {
    await runSync()
  }, INTERVAL_MS)
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
}
