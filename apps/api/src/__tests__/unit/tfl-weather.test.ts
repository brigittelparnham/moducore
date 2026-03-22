import { describe, it, expect } from 'vitest'
import { disruptionMultiplier } from '../../lib/tfl'
import { weatherFactor } from '../../lib/weather'
import type { WeatherSnapshot } from '../../lib/weather'

// ─── disruptionMultiplier ─────────────────────────────────────────────────────

describe('disruptionMultiplier', () => {
  it('returns 1.0 for good service (severity 10)', () => {
    expect(disruptionMultiplier(10)).toBe(1.0)
  })

  it('returns 1.0 for severity above 10', () => {
    expect(disruptionMultiplier(12)).toBe(1.0)
  })

  it('returns 1.15 for minor delays (severity 6–9)', () => {
    expect(disruptionMultiplier(6)).toBe(1.15)
    expect(disruptionMultiplier(9)).toBe(1.15)
  })

  it('returns 1.4 for severe delays (severity 3–5)', () => {
    expect(disruptionMultiplier(3)).toBe(1.4)
    expect(disruptionMultiplier(5)).toBe(1.4)
  })

  it('returns 2.0 for suspended service (severity 0–2)', () => {
    expect(disruptionMultiplier(0)).toBe(2.0)
    expect(disruptionMultiplier(2)).toBe(2.0)
  })
})

// ─── weatherFactor ────────────────────────────────────────────────────────────

const dryWeather: WeatherSnapshot = {
  temperature: 18,
  precipitation: 0,
  windspeed: 10,
  weatherCode: 0,
  isRaining: false,
}

const rainyWeather: WeatherSnapshot = {
  temperature: 12,
  precipitation: 2.5,
  windspeed: 15,
  weatherCode: 61,
  isRaining: true,
}

const windyRainyWeather: WeatherSnapshot = {
  temperature: 10,
  precipitation: 1.5,
  windspeed: 40,
  weatherCode: 61,
  isRaining: true,
}

describe('weatherFactor', () => {
  it('returns 1.0 for transit regardless of weather', () => {
    expect(weatherFactor(dryWeather, 'transit')).toBe(1.0)
    expect(weatherFactor(rainyWeather, 'transit')).toBe(1.0)
  })

  it('returns 1.0 for walking in dry weather', () => {
    expect(weatherFactor(dryWeather, 'walking')).toBe(1.0)
  })

  it('returns 1.1 for walking in rain', () => {
    expect(weatherFactor(rainyWeather, 'walking')).toBe(1.1)
  })

  it('returns 1.0 for cycling in dry, calm weather', () => {
    expect(weatherFactor(dryWeather, 'cycling')).toBe(1.0)
  })

  it('returns 1.2 for cycling in rain (no strong wind)', () => {
    expect(weatherFactor(rainyWeather, 'cycling')).toBe(1.2)
  })

  it('returns 1.3 for cycling in rain + strong wind', () => {
    expect(weatherFactor(windyRainyWeather, 'cycling')).toBe(1.3)
  })

  it('returns 1.0 when weather is null', () => {
    expect(weatherFactor(null, 'walking')).toBe(1.0)
    expect(weatherFactor(null, 'cycling')).toBe(1.0)
  })
})
