import { describe, it, expect } from 'vitest'
import { haversineM, inferMode, segmentPings } from '../../lib/journey-detection'
import type { LocationPing } from '@moducore/db'

// ─── haversineM ───────────────────────────────────────────────────────────────

describe('haversineM', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineM(51.5074, -0.1278, 51.5074, -0.1278)).toBe(0)
  })

  it('calculates the distance between two London landmarks correctly', () => {
    // Tower Bridge → St Paul's Cathedral ≈ 1.84 km (straight-line)
    const dist = haversineM(51.5055, -0.0754, 51.5138, -0.0984)
    expect(dist).toBeGreaterThan(1700)
    expect(dist).toBeLessThan(2000)
  })

  it('is symmetric (A→B == B→A)', () => {
    const ab = haversineM(51.5074, -0.1278, 51.5138, -0.0984)
    const ba = haversineM(51.5138, -0.0984, 51.5074, -0.1278)
    expect(Math.abs(ab - ba)).toBeLessThan(0.001)
  })

  it('calculates a longer distance correctly (London → Paris ≈ 342 km)', () => {
    const dist = haversineM(51.5074, -0.1278, 48.8566, 2.3522)
    expect(dist).toBeGreaterThan(330_000)
    expect(dist).toBeLessThan(360_000)
  })
})

// ─── inferMode ────────────────────────────────────────────────────────────────

describe('inferMode', () => {
  it('classifies slow movement as walking (<4 km/h)', () => {
    // 100m in 100s = 3.6 km/h
    expect(inferMode(100, 100)).toBe('walking')
  })

  it('classifies medium movement as cycling (4–25 km/h)', () => {
    // 500m in 100s = 18 km/h
    expect(inferMode(500, 100)).toBe('cycling')
  })

  it('classifies fast movement as transit (>25 km/h)', () => {
    // 1000m in 60s = 60 km/h
    expect(inferMode(1000, 60)).toBe('transit')
  })

  it('classifies brisk walking edge as walking (just under 4 km/h)', () => {
    // 108m in 100s = 3.888 km/h
    expect(inferMode(108, 100)).toBe('walking')
  })
})

// ─── segmentPings ─────────────────────────────────────────────────────────────

function makePing(
  lat: number,
  lon: number,
  offsetMs: number
): LocationPing {
  return {
    id: `ping-${offsetMs}`,
    tenantId: 'tenant-1',
    lat,
    lon,
    accuracyM: 10,
    altitudeM: null,
    velocityMs: null,
    batteryPct: null,
    recordedAt: new Date(Date.now() + offsetMs),
    receivedAt: new Date(),
    processed: false,
  }
}

describe('segmentPings', () => {
  it('returns empty array for fewer than 2 pings', () => {
    expect(segmentPings([])).toEqual([])
    expect(segmentPings([makePing(51.5, -0.1, 0)])).toEqual([])
  })

  it('creates a single segment for a continuous journey', () => {
    // 5 pings, 1 minute apart, moving ~150m each step
    const pings = [
      makePing(51.5000, -0.1000, 0),
      makePing(51.5013, -0.1000, 60_000),
      makePing(51.5026, -0.1000, 120_000),
      makePing(51.5039, -0.1000, 180_000),
      makePing(51.5052, -0.1000, 240_000),
    ]
    const segments = segmentPings(pings)
    expect(segments).toHaveLength(1)
    expect(segments[0].pings).toHaveLength(5)
  })

  it('splits into two segments when there is a 5+ minute gap', () => {
    const pings = [
      // First journey: 3 pings, 1 min apart
      makePing(51.5000, -0.1000, 0),
      makePing(51.5013, -0.1000, 60_000),
      makePing(51.5026, -0.1000, 120_000),
      // Gap of 6 minutes
      makePing(51.6000, -0.2000, 120_000 + 6 * 60_000),
      makePing(51.6013, -0.2000, 120_000 + 7 * 60_000),
      makePing(51.6026, -0.2000, 120_000 + 8 * 60_000),
    ]
    const segments = segmentPings(pings)
    expect(segments).toHaveLength(2)
  })

  it('filters out micro-segments shorter than 100m', () => {
    // Pings only ~1m apart — total distance well under 100m minimum
    const pings = [
      makePing(51.5000000, -0.1000000, 0),
      makePing(51.5000090, -0.1000000, 30_000), // ~10m
      makePing(51.5000180, -0.1000000, 60_000), // ~10m
    ]
    const segments = segmentPings(pings)
    expect(segments).toHaveLength(0)
  })

  it('records correct start and end times', () => {
    const t0 = Date.now()
    const pings = [
      makePing(51.5000, -0.1000, 0),
      makePing(51.5050, -0.1000, 60_000),
      makePing(51.5100, -0.1000, 120_000),
    ]
    const segments = segmentPings(pings)
    expect(segments[0].startedAt.getTime()).toBeCloseTo(t0, -2)
    expect(segments[0].endedAt.getTime()).toBeCloseTo(t0 + 120_000, -2)
  })
})
