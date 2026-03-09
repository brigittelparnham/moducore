import { syncAllConnectors } from '@moducore/integrations'
import { getDb } from './lib/db'

const INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export function startScheduler(): void {
  console.log('[scheduler] Starting — syncing connectors every 15 minutes')

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
  try {
    console.log('[scheduler] Syncing all connectors…')
    await syncAllConnectors(getDb())
    console.log('[scheduler] Sync complete')
  } catch (e) {
    console.error('[scheduler] Sync failed:', e)
  }
}
