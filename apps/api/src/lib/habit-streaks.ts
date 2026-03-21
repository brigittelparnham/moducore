import type { DbClient } from '@moducore/db'
import { getHabitLogSum, getDailyTotals, checkAndEarnRewards } from '@moducore/db'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Returns the start/end of a period relative to a reference date */
export function periodBounds(freq: Frequency, ref: Date): { from: Date; to: Date } {
  const d = new Date(ref)
  if (freq === 'daily') {
    const from = new Date(d); from.setHours(0, 0, 0, 0)
    const to = new Date(d); to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  if (freq === 'weekly') {
    const day = d.getDay()
    const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7)); mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999)
    return { from: mon, to: sun }
  }
  if (freq === 'monthly') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    return { from, to }
  }
  // yearly
  const from = new Date(d.getFullYear(), 0, 1)
  const to = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { from, to }
}

/** Check if a habit's target is met for a given period */
export async function isTargetMet(
  db: DbClient,
  tenantId: string,
  habitId: string,
  targetValue: number,
  targetType: string,
  freq: Frequency,
  ref: Date = new Date()
): Promise<boolean> {
  const { from, to } = periodBounds(freq, ref)
  const total = await getHabitLogSum(db, tenantId, habitId, from, to)
  return targetType === 'max' ? total <= targetValue : total >= targetValue
}

/** Calculate current streak (consecutive periods where target was met) */
export async function calcStreak(
  db: DbClient,
  tenantId: string,
  habitId: string,
  targetValue: number,
  targetType: string,
  freq: Frequency
): Promise<{ current: number; best: number }> {
  if (freq !== 'daily') {
    const periods = freq === 'yearly' ? 5 : freq === 'monthly' ? 24 : 52
    let current = 0; let best = 0; let streak = 0
    const now = new Date()
    for (let i = 0; i < periods; i++) {
      const ref = new Date(now)
      if (freq === 'weekly') ref.setDate(ref.getDate() - i * 7)
      else if (freq === 'monthly') ref.setMonth(ref.getMonth() - i)
      else ref.setFullYear(ref.getFullYear() - i)
      const met = await isTargetMet(db, tenantId, habitId, targetValue, targetType, freq, ref)
      if (met) { streak++; if (i === 0) current = streak }
      else { if (streak > best) best = streak; streak = 0 }
    }
    if (streak > best) best = streak
    return { current, best }
  }

  // Daily streak: use daily totals (single query)
  const dailyTotals = await getDailyTotals(db, tenantId, habitId, 365)
  const byDate: Record<string, number> = {}
  for (const { date, total } of dailyTotals) byDate[date] = total

  let current = 0; let best = 0; let streak = 0
  const checkDate = new Date(); checkDate.setHours(12, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    const total = byDate[dateStr] ?? 0
    const met = targetType === 'max' ? total <= targetValue : total >= targetValue
    if (met) {
      streak++
      if (i === 0) current = streak
    } else {
      if (streak > best) best = streak
      streak = 0
      if (i > 0) break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }
  if (streak > best) best = streak
  return { current, best }
}

/** Check all unlock-type rewards and earn any that are now met */
export async function checkRewardUnlocks(
  db: DbClient,
  tenantId: string,
  habitId: string
): Promise<string[]> {
  return checkAndEarnRewards(
    db, tenantId, habitId,
    (hId, from, to) => getHabitLogSum(db, tenantId, hId, from, to)
  )
}
