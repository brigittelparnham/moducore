import { getKnownRoutes } from '@moducore/db'
import { getDb } from './db'
import { planJourney, getLineStatuses, disruptionMultiplier, type TflJourneyOption } from './tfl'
import { getWeather, weatherFactor } from './weather'

const MATCH_RADIUS_DEG = 0.005 // ~500m threshold for route matching

function coordsMatch(a: number, b: number, threshold = MATCH_RADIUS_DEG): boolean {
  return Math.abs(a - b) < threshold
}

export type SuggestionOption = {
  durationEstimateS: number      // personalised estimate in seconds
  tflDurationS: number           // raw TfL estimate
  confidence: 'strong' | 'early' | 'live-only'
  label: string                  // e.g. "Tube via Central line"
  legs: TflJourneyOption['legs']
  disruptions: string[]
  weatherNote: string | null
  personalNote: string | null    // e.g. "You're usually 12% faster than TfL here"
  fare?: number
}

export async function suggest(
  db: ReturnType<typeof getDb>,
  tenantId: string,
  fromLat: number, fromLon: number,
  toLat: number, toLon: number
): Promise<SuggestionOption[]> {
  // Fetch in parallel: TfL options, known routes for this tenant, weather
  const [tflOptions, knownRoutes, weather] = await Promise.all([
    planJourney(fromLat, fromLon, toLat, toLon),
    getKnownRoutes(db, tenantId),
    getWeather(fromLat, fromLon),
  ])

  // Find a known route that matches origin+dest (within ~500m)
  const matchedRoute = knownRoutes.find(
    (r) =>
      coordsMatch(r.originLat, fromLat) && coordsMatch(r.originLon, fromLon) &&
      coordsMatch(r.destLat, toLat) && coordsMatch(r.destLon, toLon)
  )


  if (tflOptions.length === 0) {
    return []
  }

  const suggestions: SuggestionOption[] = []

  for (const option of tflOptions.slice(0, 3)) {
    const tflDurationS = option.durationMinutes * 60

    // Extract line IDs from this option's legs for disruption lookup
    const lineIds = option.legs
      .map((l) => l.lineId)
      .filter((id): id is string => Boolean(id))

    const lineStatuses = await getLineStatuses(lineIds)
    const disruptions = lineStatuses
      .filter((s) => s.severity < 10)
      .map((s) => `${s.lineName}: ${s.statusDescription}`)

    // Worst disruption multiplier across all lines in this option
    const worstDisruption = lineStatuses.length > 0
      ? Math.max(...lineStatuses.map((s) => disruptionMultiplier(s.severity)))
      : 1.0

    // Infer dominant mode for weather factor
    const dominantMode = inferDominantMode(option.legs)
    const wFactor = weatherFactor(weather, dominantMode)

    // Personalisation from matched route history
    let personalRatio = matchedRoute?.personalRatio ?? null
    let confidence: SuggestionOption['confidence'] = 'live-only'
    if (matchedRoute && matchedRoute.journeyCount >= 10) confidence = 'strong'
    else if (matchedRoute && matchedRoute.journeyCount >= 3) confidence = 'early'

    // Personalised estimate
    const durationEstimateS = Math.round(
      tflDurationS
      * (personalRatio ?? 1.0)
      * worstDisruption
      * wFactor
    )

    // Build human-readable label
    const label = buildLabel(option.legs)

    // Personal note
    let personalNote: string | null = null
    if (personalRatio !== null && matchedRoute && matchedRoute.journeyCount >= 3) {
      const pct = Math.round(Math.abs(1 - personalRatio) * 100)
      personalNote = personalRatio < 1
        ? `You're usually ${pct}% faster than TfL estimates here`
        : `This route typically takes you ${pct}% longer than TfL estimates`
    }

    // Weather note
    let weatherNote: string | null = null
    if (weather?.isRaining && dominantMode !== 'transit') {
      weatherNote = `Rain (+${Math.round((wFactor - 1) * 100)}% time)`
    }

    // Historical alternative callout: check if a disrupted option has a better historical alternative
    suggestions.push({
      durationEstimateS,
      tflDurationS,
      confidence,
      label,
      legs: option.legs,
      disruptions,
      weatherNote,
      personalNote,
      fare: option.fare,
    })
  }

  // Sort by personalised estimate ascending
  return suggestions.sort((a, b) => a.durationEstimateS - b.durationEstimateS)
}

function inferDominantMode(legs: TflJourneyOption['legs']): string {
  // Sum duration by mode, return the mode with most time
  const totals: Record<string, number> = {}
  for (const leg of legs) {
    totals[leg.mode] = (totals[leg.mode] ?? 0) + leg.durationMinutes
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'walking'
}

function buildLabel(legs: TflJourneyOption['legs']): string {
  const transitLegs = legs.filter((l) => l.mode !== 'walking' && l.lineId)
  if (transitLegs.length === 0) return 'Walking'
  const lines = transitLegs
    .map((l) => l.lineName ?? l.mode)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 2)
  return lines.join(' + ')
}
