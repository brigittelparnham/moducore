import { eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import {
  spotifyConnections,
  spotifyDataCache,
  type SpotifyConnection,
  type SpotifyDataCache,
} from '../schema'

// ─── Connections ──────────────────────────────────────────────────────────────

export async function getSpotifyConnection(
  db: DbClient,
  tenantId: string
): Promise<SpotifyConnection | undefined> {
  return db.query.spotifyConnections.findFirst({
    where: (s, { eq }) => eq(s.tenantId, tenantId),
  })
}

export async function upsertSpotifyCredentials(
  db: DbClient,
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<SpotifyConnection> {
  const [row] = await db
    .insert(spotifyConnections)
    .values({ tenantId, clientId, clientSecret })
    .onConflictDoUpdate({
      target: spotifyConnections.tenantId,
      set: { clientId, clientSecret, updatedAt: new Date() },
    })
    .returning()
  return row
}

export async function updateSpotifyTokens(
  db: DbClient,
  tenantId: string,
  tokens: {
    accessToken: string
    refreshToken: string
    tokenExpiresAt: Date
    spotifyUserId?: string
    spotifyDisplayName?: string
    connectedAt?: Date
  }
): Promise<void> {
  await db
    .update(spotifyConnections)
    .set({ ...tokens, updatedAt: new Date() })
    .where(eq(spotifyConnections.tenantId, tenantId))
}

export async function updateSpotifyOAuthState(
  db: DbClient,
  tenantId: string,
  oauthState: string | null
): Promise<void> {
  await db
    .update(spotifyConnections)
    .set({ oauthState, updatedAt: new Date() })
    .where(eq(spotifyConnections.tenantId, tenantId))
}

export async function getSpotifyConnectionByState(
  db: DbClient,
  state: string
): Promise<SpotifyConnection | undefined> {
  return db.query.spotifyConnections.findFirst({
    where: (s, { eq }) => eq(s.oauthState, state),
  })
}

export async function disconnectSpotify(db: DbClient, tenantId: string): Promise<void> {
  await db
    .update(spotifyConnections)
    .set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      spotifyUserId: null,
      spotifyDisplayName: null,
      connectedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(spotifyConnections.tenantId, tenantId))
}

export async function getAllConnectedSpotify(db: DbClient): Promise<SpotifyConnection[]> {
  return db.query.spotifyConnections.findMany({
    where: (s, { isNotNull }) => isNotNull(s.accessToken),
  })
}

// ─── Data Cache ───────────────────────────────────────────────────────────────

export async function getSpotifyData(
  db: DbClient,
  tenantId: string,
  dataType: string
): Promise<SpotifyDataCache | undefined> {
  return db.query.spotifyDataCache.findFirst({
    where: (s, { eq, and }) => and(eq(s.tenantId, tenantId), eq(s.dataType, dataType)),
  })
}

export async function upsertSpotifyData(
  db: DbClient,
  tenantId: string,
  dataType: string,
  data: unknown
): Promise<void> {
  await db
    .insert(spotifyDataCache)
    .values({ tenantId, dataType, data: data as Record<string, unknown>, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: [spotifyDataCache.tenantId, spotifyDataCache.dataType],
      set: { data: data as Record<string, unknown>, syncedAt: new Date() },
    })
}

export async function getAllSpotifyDataForTenant(
  db: DbClient,
  tenantId: string
): Promise<SpotifyDataCache[]> {
  return db.query.spotifyDataCache.findMany({
    where: (s, { eq }) => eq(s.tenantId, tenantId),
  })
}
