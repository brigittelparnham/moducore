import {
  getUnprocessedPings, markPingsProcessed, insertJourney,
  getKnownPlaces, getKnownRoutes, updateRouteStats, upsertKnownRoute,
  type LocationPing, type KnownPlace,
} from '@moducore/db'
import { getDb } from './db'
import { planJourney } from './tfl'
import { getWeather } from './weather'

// ─── Haversine distance (metres) ─────────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// ─── Mode inference from avg speed ───────────────────────────────────────────

function inferMode(distanceM: number, durationS: number): string {
  const kmh = (distanceM / durationS) * 3.6
  if (kmh < 4) return 'walking'
  if (kmh < 25) return 'cycling'
  return 'transit'
}

// ─── Place matching ───────────────────────────────────────────────────────────

function matchPlace(lat: number, lon: number, places: KnownPlace[]): string | null {
  for (const place of places) {
    if (haversineM(lat, lon, place.lat, place.lon) <= place.radiusM) {
      return place.name
    }
  }
  return null
}

// ─── Journey segment ─────────────────────────────────────────────────────────

type Segment = {
  pings: LocationPing[]
  startedAt: Date
  endedAt: Date
  distanceM: number
}

function segmentPings(pings: LocationPing[]): Segment[] {
  if (pings.length < 2) return []

  const GAP_MS = 5 * 60 * 1000   // 5 min gap = new journey
  const MIN_DIST_M = 100          // ignore micro-segments

  const segments: Segment[] = []
  let current: LocationPing[] = [pings[0]]

  for (let i = 1; i < pings.length; i++) {
    const prev = pings[i - 1]
    const curr = pings[i]
    const gapMs = curr.recordedAt.getTime() - prev.recordedAt.getTime()

    if (gapMs > GAP_MS) {
      // Flush current segment
      if (current.length >= 2) segments.push(buildSegment(current))
      current = [curr]
    } else {
      current.push(curr)
    }
  }
  if (current.length >= 2) segments.push(buildSegment(current))

  return segments.filter((s) => s.distanceM >= MIN_DIST_M)
}

function buildSegment(pings: LocationPing[]): Segment {
  let distanceM = 0
  for (let i = 1; i < pings.length; i++) {
    distanceM += haversineM(pings[i - 1].lat, pings[i - 1].lon, pings[i].lat, pings[i].lon)
  }
  return {
    pings,
    startedAt: pings[0].recordedAt,
    endedAt: pings[pings.length - 1].recordedAt,
    distanceM: Math.round(distanceM),
  }
}

// ─── Main detection job ───────────────────────────────────────────────────────

export async function detectJourneysForTenant(db: ReturnType<typeof getDb>, tenantId: string): Promise<void> {
  const pings = await getUnprocessedPings(db, tenantId)
  if (pings.length < 2) return

  // Only process pings that are "settled" — leave the last 10 min unprocessed
  // so we don't split an in-progress journey
  const cutoff = new Date(Date.now() - 10 * 60 * 1000)
  const settled = pings.filter((p) => p.recordedAt < cutoff)
  if (settled.length < 2) return

  const places = await getKnownPlaces(db, tenantId)
  const knownRoutes = await getKnownRoutes(db, tenantId)
  const segments = segmentPings(settled)

  for (const seg of segments) {
    const originLat = seg.pings[0].lat
    const originLon = seg.pings[0].lon
    const destLat = seg.pings[seg.pings.length - 1].lat
    const destLon = seg.pings[seg.pings.length - 1].lon
    const durationS = Math.round((seg.endedAt.getTime() - seg.startedAt.getTime()) / 1000)
    const mode = inferMode(seg.distanceM, durationS)

    const originName = matchPlace(originLat, originLon, places)
    const destName = matchPlace(destLat, destLon, places)

    // TfL estimate (best-effort, async)
    let tflEstimatedS: number | undefined
    let tflRoute: unknown
    try {
      const tflOptions = await planJourney(originLat, originLon, destLat, destLon, seg.startedAt)
      if (tflOptions.length > 0) {
        tflEstimatedS = tflOptions[0].durationMinutes * 60
        tflRoute = tflOptions[0].legs
      }
    } catch { /* ignore */ }

    // Weather snapshot at start (best-effort)
    let weatherSummary: unknown
    try {
      weatherSummary = await getWeather(originLat, originLon, seg.startedAt)
    } catch { /* ignore */ }

    // Match to a known route (within ~500m)
    const MATCH = 0.005
    let routeId: string | undefined
    const matchedRoute = knownRoutes.find(
      (r) =>
        Math.abs(r.originLat - originLat) < MATCH &&
        Math.abs(r.originLon - originLon) < MATCH &&
        Math.abs(r.destLat - destLat) < MATCH &&
        Math.abs(r.destLon - destLon) < MATCH
    )

    if (matchedRoute) {
      routeId = matchedRoute.id
    } else if (originName && destName) {
      // Auto-create a named route from known places
      const route = await upsertKnownRoute(
        db, tenantId, `${originName} → ${destName}`,
        originLat, originLon, destLat, destLon
      )
      routeId = route.id
    }

    await insertJourney(db, {
      tenantId,
      startedAt: seg.startedAt,
      endedAt: seg.endedAt,
      originLat, originLon, destLat, destLon,
      originName: originName ?? undefined,
      destName: destName ?? undefined,
      distanceM: seg.distanceM,
      durationS,
      mode,
      routeId: routeId ?? undefined,
      tflEstimatedS: tflEstimatedS ?? undefined,
      tflRoute: tflRoute ?? undefined,
      weatherSummary: weatherSummary ?? undefined,
      pingCount: seg.pings.length,
    })

    if (routeId) {
      await updateRouteStats(db, routeId, durationS, tflEstimatedS ?? null)
    }
  }

  // Mark all settled pings as processed
  await markPingsProcessed(db, settled.map((p) => p.id))
}
