export type Journey = {
  id: string
  tenantId: string
  startedAt: string
  endedAt: string
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  originName: string | null
  destName: string | null
  distanceM: number
  durationS: number
  mode: string
  routeId: string | null
  tflEstimatedS: number | null
  tflRoute: unknown
  weatherSummary: WeatherSnapshot | null
  pingCount: number
  createdAt: string
}

export type KnownPlace = {
  id: string
  tenantId: string
  name: string
  lat: number
  lon: number
  radiusM: number
  createdAt: string
}

export type KnownRoute = {
  id: string
  tenantId: string
  name: string
  originLat: number
  originLon: number
  destLat: number
  destLon: number
  typicalDurationS: number | null
  personalRatio: number | null
  journeyCount: number
  createdAt: string
  updatedAt: string
}

export type WeatherSnapshot = {
  temperature: number
  precipitation: number
  windspeed: number
  weatherCode: number
  isRaining: boolean
}

export type TflLeg = {
  mode: string
  instruction: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  lineName?: string
  lineId?: string
  departureStop?: string
  arrivalStop?: string
}

export type SuggestionOption = {
  durationEstimateS: number
  tflDurationS: number
  confidence: 'strong' | 'early' | 'live-only'
  label: string
  legs: TflLeg[]
  disruptions: string[]
  weatherNote: string | null
  personalNote: string | null
  fare?: number
}
