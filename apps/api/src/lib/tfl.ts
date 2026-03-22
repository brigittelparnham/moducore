import { z } from 'zod'

const TFL_BASE = 'https://api.tfl.gov.uk'

// ─── Response schemas ─────────────────────────────────────────────────────────

const TflLegSchema = z.object({
  mode: z.object({ id: z.string() }).optional(),
  instruction: z.object({ summary: z.string().optional(), detailed: z.string().optional() }).optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  duration: z.number().optional(),
  routeOptions: z.array(z.object({
    lineIdentifier: z.object({ id: z.string().optional(), name: z.string().optional() }).optional(),
  })).optional(),
  departurePoint: z.object({ commonName: z.string().optional() }).optional(),
  arrivalPoint: z.object({ commonName: z.string().optional() }).optional(),
})

const TflJourneySchema = z.object({
  duration: z.number().optional(),
  fare: z.object({ totalCost: z.number() }).optional(),
  legs: z.array(TflLegSchema).optional(),
})

const TflJourneyResultSchema = z.object({
  journeys: z.array(TflJourneySchema).optional(),
})

const TflLineStatusSchema = z.array(z.object({
  id: z.unknown(),
  name: z.unknown(),
  lineStatuses: z.array(z.object({
    statusSeverity: z.number().optional(),
    statusSeverityDescription: z.string().optional(),
  })).optional(),
}))

function appKey() {
  return process.env.TFL_APP_KEY ?? ''
}

function qs(params: Record<string, string>) {
  const p = new URLSearchParams(params)
  if (appKey()) p.set('app_key', appKey())
  return p.toString()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TflLeg = {
  mode: string            // 'walking' | 'tube' | 'bus' | 'overground' | 'elizabeth-line' | 'cycle' etc.
  instruction: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  lineName?: string
  lineId?: string
  departureStop?: string
  arrivalStop?: string
}

export type TflJourneyOption = {
  durationMinutes: number
  legs: TflLeg[]
  fare?: number           // pence
}

export type LineStatus = {
  lineId: string
  lineName: string
  severity: number        // 10 = good service, < 10 = disruption
  statusDescription: string
}

// ─── Journey Planner ─────────────────────────────────────────────────────────

export async function planJourney(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
  departureTime?: Date
): Promise<TflJourneyOption[]> {
  const from = `${fromLat},${fromLon}`
  const to = `${toLat},${toLon}`

  const params: Record<string, string> = {
    nationalSearch: 'false',
    mode: 'walking,cycle,bus,tube,overground,elizabeth-line,dlr,tram,river-bus',
    walkingSpeed: 'Average',
    cyclePreference: 'None',
  }
  if (departureTime) {
    params.date = departureTime.toISOString().slice(0, 10).replace(/-/g, '')
    params.time = departureTime.toTimeString().slice(0, 5).replace(':', '')
  }

  const url = `${TFL_BASE}/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}?${qs(params)}`

  let raw: unknown
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[tfl] planJourney returned HTTP ${res.status} for ${from} → ${to}`)
      return []
    }
    raw = await res.json()
  } catch (e) {
    console.warn('[tfl] planJourney fetch failed:', e instanceof Error ? e.message : e)
    return []
  }

  const parsed = TflJourneyResultSchema.safeParse(raw)
  if (!parsed.success) {
    console.warn('[tfl] planJourney response failed schema validation:', parsed.error.message)
    return []
  }

  const journeys = parsed.data.journeys ?? []
  return journeys.map((journey) => {
    const legs = (journey.legs ?? []).map((leg) => {
      const instruction = leg.instruction
      const mode = leg.mode?.id ?? 'unknown'
      const routeOptions = leg.routeOptions ?? []
      const lineId = routeOptions[0]?.lineIdentifier?.id
      const lineName = routeOptions[0]?.lineIdentifier?.name
      return {
        mode,
        instruction: instruction?.detailed ?? instruction?.summary ?? '',
        departureTime: leg.departureTime ?? '',
        arrivalTime: leg.arrivalTime ?? '',
        durationMinutes: Number(leg.duration ?? 0),
        lineName,
        lineId,
        departureStop: leg.departurePoint?.commonName,
        arrivalStop: leg.arrivalPoint?.commonName,
      } satisfies TflLeg
    })
    return {
      durationMinutes: Number(journey.duration ?? 0),
      legs,
      fare: journey.fare?.totalCost,
    } satisfies TflJourneyOption
  })
}

// ─── Line status ──────────────────────────────────────────────────────────────

export async function getLineStatuses(lineIds: string[]): Promise<LineStatus[]> {
  if (lineIds.length === 0) return []
  const ids = lineIds.join(',')
  const url = `${TFL_BASE}/Line/${encodeURIComponent(ids)}/Status?${qs({})}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[tfl] getLineStatuses returned HTTP ${res.status} for lines: ${ids}`)
      return []
    }
    const raw = await res.json()
    const parsed = TflLineStatusSchema.safeParse(raw)
    if (!parsed.success) {
      console.warn('[tfl] getLineStatuses response failed schema validation:', parsed.error.message)
      return []
    }
    return parsed.data.map((l) => {
      const first = (l.lineStatuses ?? [])[0] ?? {}
      return {
        lineId: String(l.id ?? ''),
        lineName: String(l.name ?? ''),
        severity: Number(first.statusSeverity ?? 10),
        statusDescription: String(first.statusSeverityDescription ?? 'Good Service'),
      } satisfies LineStatus
    })
  } catch (e) {
    console.warn('[tfl] getLineStatuses fetch failed:', e instanceof Error ? e.message : e)
    return []
  }
}

// Severity 10 = Good Service. Lower = worse. 0 = suspended.
export function disruptionMultiplier(severity: number): number {
  if (severity >= 10) return 1.0
  if (severity >= 6) return 1.15  // minor delays
  if (severity >= 3) return 1.4   // severe delays
  return 2.0                       // suspended / part suspended
}
