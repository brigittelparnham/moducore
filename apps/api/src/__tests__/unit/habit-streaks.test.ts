import { describe, it, expect } from 'vitest'
import { periodBounds } from '../../lib/habit-streaks'

// ─── periodBounds ─────────────────────────────────────────────────────────────
// Pure function — given a frequency and reference date, returns exact
// start/end of the containing period.

describe('periodBounds — daily', () => {
  it('returns midnight to 23:59:59.999 for the same day', () => {
    const ref = new Date('2026-03-15T14:30:00')
    const { from, to } = periodBounds('daily', ref)
    expect(from.getHours()).toBe(0)
    expect(from.getMinutes()).toBe(0)
    expect(to.getHours()).toBe(23)
    expect(to.getMinutes()).toBe(59)
    expect(to.getMilliseconds()).toBe(999)
  })

  it('from and to are on the same calendar date', () => {
    const ref = new Date('2026-03-15T09:00:00')
    const { from, to } = periodBounds('daily', ref)
    expect(from.toISOString().slice(0, 10)).toBe('2026-03-15')
    expect(to.toISOString().slice(0, 10)).toBe('2026-03-15')
  })
})

describe('periodBounds — weekly', () => {
  it('week starts on Monday', () => {
    // 2026-03-15 is a Sunday (day 0)
    const ref = new Date('2026-03-15T12:00:00')
    const { from } = periodBounds('weekly', ref)
    expect(from.getDay()).toBe(1) // Monday
  })

  it('week ends on Sunday', () => {
    const ref = new Date('2026-03-15T12:00:00')
    const { to } = periodBounds('weekly', ref)
    expect(to.getDay()).toBe(0) // Sunday
  })

  it('span is exactly 7 days', () => {
    const ref = new Date('2026-03-11T12:00:00') // Wednesday
    const { from, to } = periodBounds('weekly', ref)
    const diffMs = to.getTime() - from.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(Math.round(diffDays)).toBe(7)
  })

  it('ref date falls within the returned week', () => {
    const ref = new Date('2026-03-11T12:00:00')
    const { from, to } = periodBounds('weekly', ref)
    expect(ref.getTime()).toBeGreaterThanOrEqual(from.getTime())
    expect(ref.getTime()).toBeLessThanOrEqual(to.getTime())
  })
})

describe('periodBounds — monthly', () => {
  it('starts on the 1st of the month', () => {
    const ref = new Date('2026-03-15T12:00:00')
    const { from } = periodBounds('monthly', ref)
    expect(from.getDate()).toBe(1)
    expect(from.getMonth()).toBe(2) // March = 2 (0-indexed)
  })

  it('ends on the last day of the month', () => {
    const ref = new Date('2026-03-15T12:00:00')
    const { to } = periodBounds('monthly', ref)
    expect(to.getDate()).toBe(31) // March has 31 days
  })

  it('handles February correctly (28 days in 2026)', () => {
    const ref = new Date('2026-02-15T12:00:00')
    const { to } = periodBounds('monthly', ref)
    expect(to.getDate()).toBe(28)
  })
})

describe('periodBounds — yearly', () => {
  it('starts on Jan 1', () => {
    const ref = new Date('2026-07-15T12:00:00')
    const { from } = periodBounds('yearly', ref)
    expect(from.getMonth()).toBe(0)
    expect(from.getDate()).toBe(1)
  })

  it('ends on Dec 31', () => {
    const ref = new Date('2026-07-15T12:00:00')
    const { to } = periodBounds('yearly', ref)
    expect(to.getMonth()).toBe(11)
    expect(to.getDate()).toBe(31)
  })
})
