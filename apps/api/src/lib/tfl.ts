const TFL_BASE = 'https://api.tfl.gov.uk'

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

  let data: Record<string, unknown>
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[tfl] planJourney returned HTTP ${res.status} for ${from} → ${to}`)
      return []
    }
    data = await res.json() as Record<string, unknown>
  } catch (e) {
    console.warn('[tfl] planJourney fetch failed:', e instanceof Error ? e.message : e)
    return []
  }

  const journeys = (data.journeys as unknown[]) ?? []
  return journeys.map((j) => {
    const journey = j as Record<string, unknown>
    const legs = ((journey.legs ?? []) as unknown[]).map((l) => {
      const leg = l as Record<string, unknown>
      const instruction = leg.instruction as Record<string, string> | undefined
      const mode = (leg.mode as Record<string, string> | undefined)?.id ?? 'unknown'
      const routeOptions = (leg.routeOptions as unknown[] | undefined) ?? []
      const lineId = routeOptions.length > 0
        ? ((routeOptions[0] as Record<string, unknown>).lineIdentifier as Record<string, string> | undefined)?.id
        : undefined
      const lineName = routeOptions.length > 0
        ? ((routeOptions[0] as Record<string, unknown>).lineIdentifier as Record<string, string> | undefined)?.name
        : undefined
      return {
        mode,
        instruction: instruction?.detailed ?? instruction?.summary ?? '',
        departureTime: (leg.departureTime as string) ?? '',
        arrivalTime: (leg.arrivalTime as string) ?? '',
        durationMinutes: Number(leg.duration ?? 0),
        lineName,
        lineId,
        departureStop: (leg.departurePoint as Record<string, string> | undefined)?.commonName,
        arrivalStop: (leg.arrivalPoint as Record<string, string> | undefined)?.commonName,
      } satisfies TflLeg
    })
    const fare = (journey.fare as Record<string, number> | undefined)?.totalCost
    return {
      durationMinutes: Number(journey.duration ?? 0),
      legs,
      fare,
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
    const data = await res.json() as unknown[]
    return data.map((line) => {
      const l = line as Record<string, unknown>
      const statuses = (l.lineStatuses as unknown[] | undefined) ?? []
      const first = (statuses[0] as Record<string, unknown> | undefined) ?? {}
      return {
        lineId: String(l.id ?? ''),
        lineName: String(l.name ?? ''),
        severity: Number(first.statusSeverity ?? 10),
        statusDescription: String((first.statusSeverityDescription) ?? 'Good Service'),
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
