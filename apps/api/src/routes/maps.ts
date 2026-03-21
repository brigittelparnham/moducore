import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  insertLocationPing,
  getKnownPlaces, upsertKnownPlace, deleteKnownPlace,
  getKnownRoutes, upsertKnownRoute,
  getJourneys, getJourney, labelJourney, getTodayJourneys,
  getJourneysDaySummary,
} from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import type { AppVariables } from '../types'
import { suggest } from '../lib/maps-suggest'

export const mapsRoutes = new Hono<{ Variables: AppVariables }>()

// ─── OwnTracks ingest (public, secret in query) ───────────────────────────────

mapsRoutes.post('/ingest', async (c) => {
  const secret = c.req.query('secret')
  const expected = process.env.LOCATION_INGEST_SECRET
  if (!expected || secret !== expected) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // OwnTracks sends either a single object or wrapped array
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ ok: true }) }

  // OwnTracks HTTP mode wraps payload in { _type: 'location', ... }
  // It also sends transition/waypoint events — ignore those
  const payload = body as Record<string, unknown>
  if (payload._type !== 'location') return c.json({ ok: true })

  const lat = payload.lat as number
  const lon = payload.lon as number
  const tst = payload.tst as number // unix seconds

  if (typeof lat !== 'number' || typeof lon !== 'number' || typeof tst !== 'number') {
    return c.json({ ok: true })
  }

  // Find tenant by ingest secret — for now use the first tenant (single-user tool)
  // A per-tenant secret can be added later via settings
  const db = getDb()
  const tenant = await db.query.tenants.findFirst()
  if (!tenant) return c.json({ ok: true })

  await insertLocationPing(db, tenant.id, {
    lat,
    lon,
    accuracyM: typeof payload.acc === 'number' ? payload.acc : undefined,
    velocityMs: typeof payload.vel === 'number' ? payload.vel : undefined,
    altitudeM: typeof payload.alt === 'number' ? payload.alt : undefined,
    batteryPct: typeof payload.batt === 'number' ? Math.round(payload.batt) : undefined,
    recordedAt: new Date(tst * 1000),
  })

  return c.json({ ok: true })
})

// ─── Journeys ─────────────────────────────────────────────────────────────────

// ─── Day summary (for cross-app DayContextPanel) ──────────────────────────────

mapsRoutes.get('/day-summary', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10)
  const summary = await getJourneysDaySummary(db, tenant.id, date)
  return c.json(summary)
})

// ─── Journeys ─────────────────────────────────────────────────────────────────

mapsRoutes.get('/journeys', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const list = await getJourneys(db, tenant.id, limit, offset)
  return c.json({ journeys: list })
})

mapsRoutes.get('/journeys/today', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const list = await getTodayJourneys(db, tenant.id)
  return c.json({ journeys: list })
})

mapsRoutes.get('/journeys/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const journey = await getJourney(db, tenant.id, c.req.param('id'))
  if (!journey) return c.json({ error: 'Not found' }, 404)
  return c.json({ journey })
})

mapsRoutes.post(
  '/journeys/:id/label',
  requireAuth,
  zValidator('json', z.object({ routeId: z.string().uuid() })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { routeId } = c.req.valid('json')
    await labelJourney(db, tenant.id, c.req.param('id'), routeId)
    return c.json({ ok: true })
  }
)

// ─── Known places ─────────────────────────────────────────────────────────────

mapsRoutes.get('/places', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const places = await getKnownPlaces(db, tenant.id)
  return c.json({ places })
})

mapsRoutes.post(
  '/places',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    lat: z.number(),
    lon: z.number(),
    radiusM: z.number().int().min(10).max(1000).optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { name, lat, lon, radiusM } = c.req.valid('json')
    const place = await upsertKnownPlace(db, tenant.id, name, lat, lon, radiusM)
    return c.json({ place })
  }
)

mapsRoutes.delete('/places/:id', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  await deleteKnownPlace(db, tenant.id, c.req.param('id'))
  return c.json({ ok: true })
})

// ─── Known routes ─────────────────────────────────────────────────────────────

mapsRoutes.get('/routes', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const routes = await getKnownRoutes(db, tenant.id)
  return c.json({ routes })
})

mapsRoutes.post(
  '/routes',
  requireAuth,
  zValidator('json', z.object({
    name: z.string().min(1),
    originLat: z.number(), originLon: z.number(),
    destLat: z.number(), destLon: z.number(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { name, originLat, originLon, destLat, destLon } = c.req.valid('json')
    const route = await upsertKnownRoute(db, tenant.id, name, originLat, originLon, destLat, destLon)
    return c.json({ route })
  }
)

// ─── Suggest ──────────────────────────────────────────────────────────────────

mapsRoutes.get(
  '/suggest',
  requireAuth,
  zValidator('query', z.object({
    fromLat: z.string(),
    fromLon: z.string(),
    toLat: z.string().optional(),
    toLon: z.string().optional(),
    toPlace: z.string().optional(),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const q = c.req.valid('query')

    const fromLat = parseFloat(q.fromLat)
    const fromLon = parseFloat(q.fromLon)

    let toLat: number | undefined
    let toLon: number | undefined

    if (q.toLat && q.toLon) {
      toLat = parseFloat(q.toLat)
      toLon = parseFloat(q.toLon)
    } else if (q.toPlace) {
      const places = await getKnownPlaces(db, tenant.id)
      const place = places.find((p) => p.name.toLowerCase() === q.toPlace!.toLowerCase())
      if (!place) return c.json({ error: `Unknown place: ${q.toPlace}` }, 400)
      toLat = place.lat
      toLon = place.lon
    }

    if (toLat === undefined || toLon === undefined) {
      return c.json({ error: 'Provide toLat+toLon or toPlace' }, 400)
    }

    const suggestions = await suggest(db, tenant.id, fromLat, fromLon, toLat, toLon)
    return c.json({ suggestions })
  }
)
