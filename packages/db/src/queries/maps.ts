import { eq, and, lt, gte, lte, desc, asc, sql } from 'drizzle-orm'
import type { DbClient } from '../client'
import {
  locationPings, knownPlaces, knownRoutes, journeys,
  type LocationPing, type KnownPlace, type KnownRoute, type Journey, type NewJourney,
} from '../schema'

// ─── Location pings ───────────────────────────────────────────────────────────

export async function insertLocationPing(
  db: DbClient,
  tenantId: string,
  ping: {
    lat: number; lon: number; accuracyM?: number; velocityMs?: number
    altitudeM?: number; batteryPct?: number; recordedAt: Date
  }
): Promise<LocationPing> {
  const [row] = await db.insert(locationPings).values({ tenantId, ...ping }).returning()
  return row
}

export async function getUnprocessedPings(
  db: DbClient,
  tenantId: string
): Promise<LocationPing[]> {
  return db.select().from(locationPings)
    .where(and(eq(locationPings.tenantId, tenantId), eq(locationPings.processed, false)))
    .orderBy(asc(locationPings.recordedAt))
}

export async function markPingsProcessed(
  db: DbClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return
  for (const id of ids) {
    await db.update(locationPings).set({ processed: true }).where(eq(locationPings.id, id))
  }
}

// ─── Known places ─────────────────────────────────────────────────────────────

export async function getKnownPlaces(
  db: DbClient,
  tenantId: string
): Promise<KnownPlace[]> {
  return db.select().from(knownPlaces).where(eq(knownPlaces.tenantId, tenantId))
}

export async function upsertKnownPlace(
  db: DbClient,
  tenantId: string,
  name: string,
  lat: number,
  lon: number,
  radiusM = 100
): Promise<KnownPlace> {
  const [row] = await db
    .insert(knownPlaces)
    .values({ tenantId, name, lat, lon, radiusM })
    .onConflictDoUpdate({
      target: [knownPlaces.tenantId, knownPlaces.name],
      set: { lat, lon, radiusM },
    })
    .returning()
  return row
}

export async function deleteKnownPlace(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<void> {
  await db.delete(knownPlaces).where(and(eq(knownPlaces.id, id), eq(knownPlaces.tenantId, tenantId)))
}

// ─── Known routes ─────────────────────────────────────────────────────────────

export async function getKnownRoutes(
  db: DbClient,
  tenantId: string
): Promise<KnownRoute[]> {
  return db.select().from(knownRoutes)
    .where(eq(knownRoutes.tenantId, tenantId))
    .orderBy(desc(knownRoutes.journeyCount))
}

export async function upsertKnownRoute(
  db: DbClient,
  tenantId: string,
  name: string,
  originLat: number, originLon: number,
  destLat: number, destLon: number
): Promise<KnownRoute> {
  const existing = await db.query.knownRoutes.findFirst({
    where: (r, { and, eq }) => and(eq(r.tenantId, tenantId), eq(r.name, name)),
  })
  if (existing) return existing
  const [row] = await db.insert(knownRoutes)
    .values({ tenantId, name, originLat, originLon, destLat, destLon })
    .returning()
  return row
}

export async function updateRouteStats(
  db: DbClient,
  routeId: string,
  actualDurationS: number,
  tflEstimatedS: number | null
): Promise<void> {
  const route = await db.query.knownRoutes.findFirst({ where: (r, { eq }) => eq(r.id, routeId) })
  if (!route) return

  const count = route.journeyCount + 1
  // Rolling average for typical duration
  const prevAvg = route.typicalDurationS ?? actualDurationS
  const newAvg = Math.round(prevAvg + (actualDurationS - prevAvg) / count)
  // Rolling average for personal ratio vs TfL
  let newRatio = route.personalRatio
  if (tflEstimatedS && tflEstimatedS > 0) {
    const ratio = actualDurationS / tflEstimatedS
    const prevRatio = route.personalRatio ?? ratio
    newRatio = prevRatio + (ratio - prevRatio) / count
  }

  await db.update(knownRoutes)
    .set({ typicalDurationS: newAvg, personalRatio: newRatio, journeyCount: count, updatedAt: new Date() })
    .where(eq(knownRoutes.id, routeId))
}

// ─── Journeys ─────────────────────────────────────────────────────────────────

export async function insertJourney(
  db: DbClient,
  data: NewJourney
): Promise<Journey> {
  const [row] = await db.insert(journeys).values(data).returning()
  return row
}

export async function getJourneys(
  db: DbClient,
  tenantId: string,
  limit = 50,
  offset = 0
): Promise<Journey[]> {
  return db.select().from(journeys)
    .where(eq(journeys.tenantId, tenantId))
    .orderBy(desc(journeys.startedAt))
    .limit(limit)
    .offset(offset)
}

export async function getJourney(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<Journey | undefined> {
  return db.query.journeys.findFirst({
    where: (j, { and, eq }) => and(eq(j.tenantId, tenantId), eq(j.id, id)),
  })
}

export async function labelJourney(
  db: DbClient,
  tenantId: string,
  journeyId: string,
  routeId: string
): Promise<void> {
  await db.update(journeys)
    .set({ routeId })
    .where(and(eq(journeys.id, journeyId), eq(journeys.tenantId, tenantId)))
}

export async function getJourneysByRoute(
  db: DbClient,
  tenantId: string,
  routeId: string,
  limit = 20
): Promise<Journey[]> {
  return db.select().from(journeys)
    .where(and(eq(journeys.tenantId, tenantId), eq(journeys.routeId, routeId)))
    .orderBy(desc(journeys.startedAt))
    .limit(limit)
}

export async function getJourneysByDate(
  db: DbClient,
  tenantId: string,
  date: string  // YYYY-MM-DD
): Promise<Journey[]> {
  const from = new Date(`${date}T00:00:00`)
  const to = new Date(`${date}T23:59:59.999`)
  return db.select().from(journeys)
    .where(and(
      eq(journeys.tenantId, tenantId),
      gte(journeys.startedAt, from),
      lte(journeys.startedAt, to),
    ))
    .orderBy(asc(journeys.startedAt))
}

export async function getJourneysDaySummary(
  db: DbClient,
  tenantId: string,
  date: string  // YYYY-MM-DD
): Promise<{
  date: string
  count: number
  totalDistanceM: number
  modes: string[]
}> {
  const list = await getJourneysByDate(db, tenantId, date)
  const modes = [...new Set(list.map((j) => j.mode).filter(Boolean))] as string[]
  const totalDistanceM = list.reduce((sum, j) => sum + (j.distanceM ?? 0), 0)
  return { date, count: list.length, totalDistanceM, modes }
}

export async function getTodayJourneys(
  db: DbClient,
  tenantId: string
): Promise<Journey[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return db.select().from(journeys)
    .where(and(
      eq(journeys.tenantId, tenantId),
      lt(journeys.startedAt, new Date()),
    ))
    .orderBy(desc(journeys.startedAt))
    .limit(10)
}
