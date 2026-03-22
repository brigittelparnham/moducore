import { syncAllConnectors } from '@moducore/integrations'
import { getAllConnectedSpotify, getAccounts, deleteExpiredSessions } from '@moducore/db'
import { getDb } from './lib/db'
import { logger } from './lib/logger'
import { syncSpotifyForTenant } from './routes/spotify'
import { detectJourneysForTenant } from './lib/journey-detection'
import { syncStarlingAccount } from './lib/starling'
import { decryptField, decryptConfig } from './lib/secrets'
import {
  SCHEDULER_INTERVAL_MS,
  JOURNEY_INTERVAL_MS,
  SESSION_CLEANUP_INTERVAL_MS,
} from './config'

// ─── D2: In-memory job status tracking ────────────────────────────────────────

export type JobStatus = {
  lastRunAt: Date | null
  lastSuccessAt: Date | null
  lastError: string | null
}

export const jobStatus: Record<string, JobStatus> = {
  connectors: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  spotify:    { lastRunAt: null, lastSuccessAt: null, lastError: null },
  starling:   { lastRunAt: null, lastSuccessAt: null, lastError: null },
  journeys:   { lastRunAt: null, lastSuccessAt: null, lastError: null },
}

function jobStart(key: string) {
  jobStatus[key].lastRunAt = new Date()
}
function jobSuccess(key: string) {
  jobStatus[key].lastSuccessAt = new Date()
  jobStatus[key].lastError = null
}
function jobFail(key: string, err: unknown) {
  jobStatus[key].lastError = err instanceof Error ? err.message : String(err)
}

// ─── Scheduler boot ───────────────────────────────────────────────────────────

export function startScheduler(): void {
  logger.info('[scheduler] Starting — syncing every 15 minutes, journey detection every 5 minutes')

  setTimeout(async () => { await runSync() }, 5000)
  setInterval(async () => { await runSync() }, SCHEDULER_INTERVAL_MS)

  // Journey detection runs more frequently
  setInterval(async () => { await runJourneyDetection() }, JOURNEY_INTERVAL_MS)

  // Expired session cleanup runs once per day
  setInterval(async () => { await runSessionCleanup() }, SESSION_CLEANUP_INTERVAL_MS)
}

// ─── Sync jobs ────────────────────────────────────────────────────────────────

async function runSync() {
  const db = getDb()

  // Connectors
  jobStart('connectors')
  try {
    logger.info('[scheduler] Syncing all connectors…')
    await syncAllConnectors(db, decryptConfig)
    jobSuccess('connectors')
    logger.info('[scheduler] Connectors synced')
  } catch (err) {
    jobFail('connectors', err)
    logger.error({ err }, '[scheduler] Connector sync failed')
  }

  // Spotify
  jobStart('spotify')
  try {
    logger.info('[scheduler] Syncing Spotify…')
    const connections = await getAllConnectedSpotify(db)
    await Promise.allSettled(
      connections.map((conn) =>
        syncSpotifyForTenant(db, conn).catch((err) =>
          logger.error({ err, tenantId: conn.tenantId }, '[scheduler] Spotify sync failed for tenant')
        )
      )
    )
    jobSuccess('spotify')
    logger.info({ count: connections.length }, '[scheduler] Spotify synced')
  } catch (err) {
    jobFail('spotify', err)
    logger.error({ err }, '[scheduler] Spotify sync failed')
  }

  // Starling
  jobStart('starling')
  try {
    const tenants = await db.query.tenants.findMany()
    for (const tenant of tenants) {
      const accounts = await getAccounts(db, tenant.id)
      const starlingAccounts = accounts.filter(
        (a) => a.provider === 'starling' && a.starlingAccountUid && a.starlingAccessToken
      )
      await Promise.allSettled(
        starlingAccounts.map((a) =>
          syncStarlingAccount(db, tenant.id, a.id, decryptField(a.starlingAccessToken!), a.starlingAccountUid!)
            .catch((err) => logger.error({ err, accountId: a.id }, '[scheduler] Starling sync failed for account'))
        )
      )
    }
    jobSuccess('starling')
  } catch (err) {
    jobFail('starling', err)
    logger.error({ err }, '[scheduler] Starling sync failed')
  }
}

async function runSessionCleanup() {
  const db = getDb()
  try {
    await deleteExpiredSessions(db)
    logger.info('[scheduler] Expired sessions cleaned up')
  } catch (err) {
    logger.error({ err }, '[scheduler] Session cleanup failed')
  }
}

async function runJourneyDetection() {
  const db = getDb()
  jobStart('journeys')
  try {
    const tenants = await db.query.tenants.findMany()
    await Promise.allSettled(
      tenants.map((t) =>
        detectJourneysForTenant(db, t.id).catch((err) =>
          logger.error({ err, tenantId: t.id }, '[scheduler] Journey detection failed for tenant')
        )
      )
    )
    jobSuccess('journeys')
  } catch (err) {
    jobFail('journeys', err)
    logger.error({ err }, '[scheduler] Journey detection failed')
  }
}
