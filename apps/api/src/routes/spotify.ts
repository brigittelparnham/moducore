import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getSpotifyConnection,
  upsertSpotifyCredentials,
  updateSpotifyTokens,
  updateSpotifyOAuthState,
  getSpotifyConnectionByState,
  disconnectSpotify,
  getSpotifyData,
  upsertSpotifyData,
} from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { generateToken } from '../lib/crypto'
import type { AppVariables } from '../types'
import type { SpotifyConnection } from '@moducore/db'

export const spotifyRoutes = new Hono<{ Variables: AppVariables }>()

const SPOTIFY_SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-read-playback-state',
].join(' ')

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

function getSpotifyAppUrl() {
  return process.env.SPOTIFY_APP_URL ?? 'http://localhost:3003'
}

function getCallbackUrl() {
  // Spotify does not allow 'localhost' — use 127.0.0.1 for local dev
  return `${process.env.API_URL ?? 'http://127.0.0.1:3000'}/spotify/callback`
}

// ─── Token helpers ────────────────────────────────────────────────────────────

async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error('Failed to exchange Spotify auth code')
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error('Failed to refresh Spotify token')
  const data = await res.json() as { access_token: string; expires_in: number }
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

// Ensures access token is fresh (refreshes if within 5 min of expiry). Returns the access token.
export async function ensureFreshToken(db: ReturnType<typeof getDb>, conn: SpotifyConnection): Promise<string> {
  if (!conn.accessToken || !conn.refreshToken) throw new Error('Not connected to Spotify')
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000)
  if (!conn.tokenExpiresAt || conn.tokenExpiresAt < fiveMinFromNow) {
    const { accessToken, expiresIn } = await refreshAccessToken(conn.refreshToken, conn.clientId, conn.clientSecret)
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)
    await updateSpotifyTokens(db, conn.tenantId, {
      accessToken,
      refreshToken: conn.refreshToken,
      tokenExpiresAt,
    })
    return accessToken
  }
  return conn.accessToken
}

async function spotifyFetch<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Spotify API error ${res.status} for ${path}`)
  return res.json() as Promise<T>
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /spotify/status
spotifyRoutes.get('/status', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const conn = await getSpotifyConnection(db, tenant.id)
  if (!conn) return c.json({ configured: false, connected: false })
  return c.json({
    configured: true,
    connected: !!conn.accessToken,
    spotifyDisplayName: conn.spotifyDisplayName,
    connectedAt: conn.connectedAt,
  })
})

// POST /spotify/credentials — save client_id + client_secret + optional redirect_uri
spotifyRoutes.post(
  '/credentials',
  requireAuth,
  zValidator('json', z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    redirectUri: z.string().url().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const member = c.get('tenantMember')!
    if (member.role !== 'owner' && member.role !== 'admin') {
      return c.json({ error: 'Only owners and admins can update Spotify credentials' }, 403)
    }
    const { clientId, clientSecret, redirectUri } = c.req.valid('json')
    const conn = await upsertSpotifyCredentials(db, tenant.id, clientId, clientSecret, redirectUri)
    return c.json({ configured: true, connected: !!conn.accessToken })
  }
)

// DELETE /spotify/credentials — disconnect (clear tokens, keep credentials)
spotifyRoutes.delete('/credentials', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const member = c.get('tenantMember')!
  if (member.role !== 'owner' && member.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await disconnectSpotify(db, tenant.id)
  return c.json({ ok: true })
})

// GET /spotify/connect — initiate OAuth (requireAuth — we need to know the tenant)
spotifyRoutes.get('/connect', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const conn = await getSpotifyConnection(db, tenant.id)
  if (!conn) return c.json({ error: 'Save Spotify credentials first' }, 400)

  const state = generateToken()
  await updateSpotifyOAuthState(db, tenant.id, state)

  const redirectUri = conn.redirectUri ?? getCallbackUrl()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: conn.clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  })

  return c.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`)
})

// GET /spotify/callback — OAuth callback (public, state carries tenant identity)
spotifyRoutes.get('/callback', async (c) => {
  const db = getDb()
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  if (error || !code || !state) {
    return c.redirect(`${getSpotifyAppUrl()}?error=spotify_denied`)
  }

  const conn = await getSpotifyConnectionByState(db, state)
  if (!conn) return c.redirect(`${getSpotifyAppUrl()}?error=invalid_state`)

  try {
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForTokens(
      code,
      conn.clientId,
      conn.clientSecret,
      conn.redirectUri ?? getCallbackUrl()
    )
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    // Fetch Spotify user profile
    const profile = await spotifyFetch<{ id: string; display_name?: string }>(
      accessToken,
      '/me'
    )

    await updateSpotifyTokens(db, conn.tenantId, {
      accessToken,
      refreshToken,
      tokenExpiresAt,
      spotifyUserId: profile.id,
      spotifyDisplayName: profile.display_name ?? profile.id,
      connectedAt: new Date(),
    })
    await updateSpotifyOAuthState(db, conn.tenantId, null)

    return c.redirect(getSpotifyAppUrl())
  } catch (e) {
    console.error('[spotify] OAuth callback error:', e)
    return c.redirect(`${getSpotifyAppUrl()}?error=oauth_failed`)
  }
})

// GET /spotify/data/:type — return cached data
spotifyRoutes.get('/data/:type', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const type = c.req.param('type')
  const cache = await getSpotifyData(db, tenant.id, type)
  if (!cache) return c.json({ data: [], syncedAt: null })
  return c.json({ data: cache.data, syncedAt: cache.syncedAt })
})

// GET /spotify/now-playing — live proxy
spotifyRoutes.get('/now-playing', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const conn = await getSpotifyConnection(db, tenant.id)
  if (!conn?.accessToken) return c.json({ playing: null })

  try {
    const accessToken = await ensureFreshToken(db, conn)
    const res = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 204 || res.status === 404) return c.json({ playing: null })
    if (!res.ok) return c.json({ playing: null })
    const data = await res.json()
    return c.json({ playing: data })
  } catch {
    return c.json({ playing: null })
  }
})

// POST /spotify/sync — manual sync
spotifyRoutes.post('/sync', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const conn = await getSpotifyConnection(db, tenant.id)
  if (!conn?.accessToken) return c.json({ error: 'Not connected to Spotify' }, 400)

  try {
    await syncSpotifyForTenant(db, conn)
    return c.json({ ok: true })
  } catch (e) {
    console.error('[spotify] Manual sync failed:', e)
    return c.json({ error: 'Sync failed' }, 500)
  }
})

// ─── Sync logic (also used by scheduler) ─────────────────────────────────────

export async function syncSpotifyForTenant(
  db: ReturnType<typeof getDb>,
  conn: SpotifyConnection
): Promise<void> {
  const accessToken = await ensureFreshToken(db, conn)

  const ranges = ['short_term', 'medium_term', 'long_term'] as const
  const rangeKeys = { short_term: 'short', medium_term: 'medium', long_term: 'long' } as const

  // Top tracks × 3 ranges
  for (const range of ranges) {
    try {
      const data = await spotifyFetch<{ items: unknown[] }>(
        accessToken,
        `/me/top/tracks?limit=50&time_range=${range}`
      )
      await upsertSpotifyData(db, conn.tenantId, `top_tracks_${rangeKeys[range]}`, data.items)
    } catch (e) {
      console.error(`[spotify] Failed to sync top_tracks_${range} for tenant ${conn.tenantId}:`, e)
    }
  }

  // Top artists × 3 ranges
  for (const range of ranges) {
    try {
      const data = await spotifyFetch<{ items: unknown[] }>(
        accessToken,
        `/me/top/artists?limit=50&time_range=${range}`
      )
      await upsertSpotifyData(db, conn.tenantId, `top_artists_${rangeKeys[range]}`, data.items)
    } catch (e) {
      console.error(`[spotify] Failed to sync top_artists_${range} for tenant ${conn.tenantId}:`, e)
    }
  }

  // Recently played
  try {
    const data = await spotifyFetch<{ items: unknown[] }>(
      accessToken,
      '/me/player/recently-played?limit=50'
    )
    await upsertSpotifyData(db, conn.tenantId, 'recently_played', data.items)
  } catch (e) {
    console.error(`[spotify] Failed to sync recently_played for tenant ${conn.tenantId}:`, e)
  }

  // Audio features for short-term top tracks (fetch individually per Feb 2026 change)
  try {
    const topTracks = await getSpotifyData(db, conn.tenantId, 'top_tracks_short')
    if (topTracks && Array.isArray(topTracks.data) && topTracks.data.length > 0) {
      const tracks = topTracks.data as Array<{ id: string }>
      const features = await Promise.allSettled(
        tracks.slice(0, 20).map((t) =>
          spotifyFetch<unknown>(accessToken, `/audio-features/${t.id}`)
        )
      )
      const resolved = features
        .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
        .map((r) => r.value)
      await upsertSpotifyData(db, conn.tenantId, 'audio_features', resolved)
    }
  } catch (e) {
    console.error(`[spotify] Failed to sync audio_features for tenant ${conn.tenantId}:`, e)
  }
}
