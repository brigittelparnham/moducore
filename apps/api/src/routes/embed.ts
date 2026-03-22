import { Hono } from 'hono'
import { apiError } from '@moducore/core'
import {
  validateEmbedToken,
  getJournalEntriesByTenant,
  getJournalEntryById,
  getPagesByTenant,
  getPublishedPageBySlug,
  getSpotifyData,
  getSpotifyConnection,
} from '@moducore/db'
import { getDb } from '../lib/db'
import { ensureFreshToken } from './spotify'
import type { AppVariables } from '../types'

export const embedRoutes = new Hono<{ Variables: AppVariables }>()

// Allow preflight from any origin (embeds are loaded on external sites)
embedRoutes.options('*', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type')
  return c.body(null, 204)
})

// Apply open CORS to all embed routes
embedRoutes.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  await next()
})

// GET /embed/journal?token=xxx
// Public endpoint — validates embed token and returns published journal entries
embedRoutes.get('/journal', async (c) => {
  const db = getDb()
  const token = c.req.query('token')

  if (!token) {
    return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)
  }

  // Only return published entries for the tenant
  const all = await getJournalEntriesByTenant(db, embedToken.tenantId)
  const entries = all.filter((e) => e.status === 'published')

  return c.json({ entries })
})

// GET /embed/journal/:id?token=xxx
// Returns a single published journal entry — used by the single-entry widget and feed expand
embedRoutes.get('/journal/:id', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  const id = c.req.param('id')

  if (!token) {
    return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)
  }

  const entry = await getJournalEntryById(db, embedToken.tenantId, id)
  if (!entry || entry.status !== 'published') {
    return c.json(apiError("NOT_FOUND", 'Not found'), 404)
  }

  return c.json({ entry })
})

// GET /embed/pages?token=xxx
// Returns all published CMS pages for the tenant
embedRoutes.get('/pages', async (c) => {
  const db = getDb()
  const token = c.req.query('token')

  if (!token) {
    return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)
  }

  const all = await getPagesByTenant(db, embedToken.tenantId)
  const pages = all.filter((p) => p.status === 'published')

  return c.json({ pages })
})

// GET /embed/pages/:slug?token=xxx
// Returns a single published CMS page by slug
embedRoutes.get('/pages/:slug', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  const slug = c.req.param('slug')

  if (!token) {
    return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  }

  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) {
    return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)
  }

  const page = await getPublishedPageBySlug(db, embedToken.tenantId, slug)
  if (!page) {
    return c.json(apiError("NOT_FOUND", 'Not found'), 404)
  }

  return c.json({ page })
})

// ─── Spotify embed routes ─────────────────────────────────────────────────────

// GET /embed/spotify/top-tracks?token=xxx
embedRoutes.get('/spotify/top-tracks', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  if (!token) return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)

  const cached = await getSpotifyData(db, embedToken.tenantId, 'top_tracks_short')
  const tracks = (cached?.data as unknown[]) ?? []
  return c.json({ tracks: tracks.slice(0, 5) })
})

// GET /embed/spotify/now-playing?token=xxx
// Falls back to most recent from recently_played cache
embedRoutes.get('/spotify/now-playing', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  if (!token) return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)

  // Try live now-playing via tenant's Spotify token
  try {
    const conn = await getSpotifyConnection(db, embedToken.tenantId)
    if (conn?.accessToken) {
      const accessToken = await ensureFreshToken(db, conn)
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.status === 200) {
        const json = await res.json() as { item?: unknown; is_playing?: boolean }
        if (json.item) {
          return c.json({ track: json.item, isPlaying: json.is_playing ?? false })
        }
      }
    }
  } catch {
    // fall through to cache
  }

  // Fall back to most recently played
  const cached = await getSpotifyData(db, embedToken.tenantId, 'recently_played')
  const items = (cached?.data as { track: unknown }[]) ?? []
  return c.json({ track: items[0]?.track ?? null, isPlaying: false })
})

// GET /embed/spotify/genres?token=xxx
embedRoutes.get('/spotify/genres', async (c) => {
  const db = getDb()
  const token = c.req.query('token')
  if (!token) return c.json(apiError("UNAUTHORIZED", 'token is required'), 401)
  const embedToken = await validateEmbedToken(db, token)
  if (!embedToken) return c.json(apiError("UNAUTHORIZED", 'Invalid or expired token'), 401)

  const cached = await getSpotifyData(db, embedToken.tenantId, 'top_artists_long')
  const artists = (cached?.data as { genres?: string[] }[]) ?? []

  const counts = new Map<string, number>()
  for (const artist of artists) {
    for (const genre of artist.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }
  const genres = Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return c.json({ genres })
})
