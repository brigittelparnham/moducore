// Open-Meteo — free, no API key required
import { z } from 'zod'

const OPEN_METEO = 'https://api.open-meteo.com/v1'

const OpenMeteoSchema = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    precipitation: z.array(z.number()),
    windspeed_10m: z.array(z.number()),
    weathercode: z.array(z.number()),
  }),
})

export type WeatherSnapshot = {
  temperature: number    // °C
  precipitation: number  // mm in the hour
  windspeed: number      // km/h
  weatherCode: number    // WMO code
  isRaining: boolean
}

export async function getWeather(lat: number, lon: number, time?: Date): Promise<WeatherSnapshot | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      hourly: 'temperature_2m,precipitation,windspeed_10m,weathercode',
      forecast_days: '1',
      timezone: 'Europe/London',
    })

    const res = await fetch(`${OPEN_METEO}/forecast?${params}`)
    if (!res.ok) return null
    const parsed = OpenMeteoSchema.safeParse(await res.json())
    if (!parsed.success) {
      console.warn('[weather] Open-Meteo response failed schema validation:', parsed.error.message)
      return null
    }
    const data = parsed.data

    // Find the closest hour to the requested time
    const target = (time ?? new Date()).toISOString().slice(0, 13) // "2026-03-16T08"
    const idx = data.hourly.time.findIndex((t) => t.startsWith(target))
    const i = idx >= 0 ? idx : 0

    const weatherCode = data.hourly.weathercode[i] ?? 0
    const precipitation = data.hourly.precipitation[i] ?? 0

    return {
      temperature: data.hourly.temperature_2m[i] ?? 0,
      precipitation,
      windspeed: data.hourly.windspeed_10m[i] ?? 0,
      weatherCode,
      isRaining: precipitation > 0.1 || (weatherCode >= 51 && weatherCode <= 99),
    }
  } catch (e) {
    console.warn(
      `[weather] Open-Meteo fetch failed (lat=${lat.toFixed(4)} lon=${lon.toFixed(4)}):`,
      e instanceof Error ? e.message : e
    )
    return null
  }
}

// Weather adjustment factors for journey time estimation
export function weatherFactor(weather: WeatherSnapshot | null, mode: string): number {
  if (!weather) return 1.0
  if (mode === 'transit') return 1.0           // weather doesn't affect tube/bus time
  if (mode === 'walking') return weather.isRaining ? 1.1 : 1.0
  if (mode === 'cycling' || mode === 'cycle') {
    let factor = 1.0
    if (weather.isRaining) factor += 0.2
    if (weather.windspeed > 30) factor += 0.1  // strong headwind
    return factor
  }
  return 1.0
}
