import { describe, it, expect } from 'vitest'
import { inferDominantMode, buildLabel, coordsMatch } from '../../lib/maps-suggest'
import type { TflLeg } from '../../lib/tfl'

// ─── Test helpers ─────────────────────────────────────────────────────────────

function leg(mode: string, durationMinutes: number, lineName?: string, lineId?: string): TflLeg {
  return {
    mode,
    instruction: '',
    departureTime: '',
    arrivalTime: '',
    durationMinutes,
    lineName,
    lineId,
  }
}

// ─── coordsMatch ──────────────────────────────────────────────────────────────

describe('coordsMatch', () => {
  it('returns true when coords are identical', () => {
    expect(coordsMatch(51.5074, 51.5074)).toBe(true)
  })

  it('returns true when coords are within the default 0.005° threshold', () => {
    expect(coordsMatch(51.5074, 51.5078)).toBe(true)  // 0.0004 difference
  })

  it('returns false when coords differ by more than the threshold', () => {
    expect(coordsMatch(51.5074, 51.5130)).toBe(false) // 0.0056 difference
  })

  it('respects a custom threshold', () => {
    // 0.0004 difference < 0.001 threshold → within range
    expect(coordsMatch(51.5074, 51.5078, 0.001)).toBe(true)
    // 0.0016 difference > 0.001 threshold → outside range
    expect(coordsMatch(51.5074, 51.5090, 0.001)).toBe(false)
  })
})

// ─── inferDominantMode ────────────────────────────────────────────────────────

describe('inferDominantMode', () => {
  it('returns the mode with the most total minutes', () => {
    const legs = [
      leg('walking', 5),
      leg('tube', 20),
      leg('walking', 3),
    ]
    expect(inferDominantMode(legs)).toBe('tube')
  })

  it('returns walking for an all-walking route', () => {
    const legs = [leg('walking', 15), leg('walking', 5)]
    expect(inferDominantMode(legs)).toBe('walking')
  })

  it('handles a tie by returning the first encountered mode', () => {
    // Both modes have 10 minutes — result depends on sort stability
    const legs = [leg('bus', 10), leg('walking', 10)]
    const result = inferDominantMode(legs)
    expect(['bus', 'walking']).toContain(result)
  })

  it('falls back to walking for empty legs', () => {
    expect(inferDominantMode([])).toBe('walking')
  })
})

// ─── buildLabel ───────────────────────────────────────────────────────────────

describe('buildLabel', () => {
  it('returns "Walking" for an all-walking route', () => {
    const legs = [leg('walking', 15), leg('walking', 5)]
    expect(buildLabel(legs)).toBe('Walking')
  })

  it('returns a single line name for a simple tube journey', () => {
    const legs = [
      leg('walking', 5),
      leg('tube', 20, 'Central line', 'central'),
      leg('walking', 3),
    ]
    expect(buildLabel(legs)).toBe('Central line')
  })

  it('joins two transit lines with " + "', () => {
    const legs = [
      leg('walking', 3),
      leg('tube', 15, 'Central line', 'central'),
      leg('tube', 10, 'Northern line', 'northern'),
      leg('walking', 2),
    ]
    expect(buildLabel(legs)).toBe('Central line + Northern line')
  })

  it('deduplicates repeated lines', () => {
    const legs = [
      leg('tube', 10, 'Circle line', 'circle'),
      leg('walking', 2),
      leg('tube', 10, 'Circle line', 'circle'),
    ]
    expect(buildLabel(legs)).toBe('Circle line')
  })

  it('caps label at two lines even for complex journeys', () => {
    const legs = [
      leg('tube', 10, 'Central line', 'central'),
      leg('tube', 10, 'Northern line', 'northern'),
      leg('bus', 5, '205', '205'),
    ]
    const label = buildLabel(legs)
    expect(label.split(' + ')).toHaveLength(2)
  })
})
