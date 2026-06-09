import { useState } from 'react'
import type { Habit, HabitLog } from '../types'

const S = {
  paper: '#efe6d4',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  rose: '#ff9bb8',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

// Returns last N calendar days as YYYY-MM-DD strings, oldest first
function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// Accent colour for a habit — fall back to coral
function habitColor(habit: Habit): string {
  return habit.color ?? S.coral
}

type Props = {
  habits: Habit[]
  logsPerHabit: Record<string, HabitLog[]>
  streakMap: Record<string, number>
  onLog: (habitId: string, value: string) => void
  days?: number
}

export function HabitGrid({ habits, logsPerHabit, streakMap, onLog, days = 14 }: Props) {
  const dayKeys = lastNDays(days)
  const todayKey = dayKeys[dayKeys.length - 1]

  // Which habit is currently showing the log form
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('1')

  function handleLog(e: React.FormEvent, habitId: string, unit: string) {
    e.preventDefault()
    onLog(habitId, inputVal)
    setLoggingId(null)
    setInputVal('1')
    void unit
  }

  if (habits.length === 0) {
    return (
      <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>
        no daily habits yet — add some in settings →
      </p>
    )
  }

  return (
    <div>
      {/* column header: date dots above the grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 56px 36px', alignItems: 'center', gap: 10, marginBottom: 6, paddingLeft: 0 }}>
        <div />
        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-start' }}>
          {dayKeys.map((d) => {
            const dayNum = new Date(d + 'T12:00:00').getDate()
            const isToday = d === todayKey
            return (
              <div key={d} style={{ width: 22, textAlign: 'center', fontFamily: mono, fontSize: 8, letterSpacing: '0.05em', color: isToday ? S.coral : S.inkSoft, opacity: isToday ? 1 : 0.4 }}>
                {dayNum}
              </div>
            )
          })}
        </div>
        <div />
        <div />
      </div>

      {habits.map((habit, hi) => {
        const logs = logsPerHabit[habit.id] ?? []
        const logsByDay = new Set(logs.map((l) => l.loggedAt.slice(0, 10)))
        const filledCount = dayKeys.filter((d) => logsByDay.has(d)).length
        const pct = Math.round((filledCount / days) * 100)
        const color = habitColor(habit)
        const streak = streakMap[habit.id] ?? 0
        const isLogging = loggingId === habit.id
        const isLimit = habit.type === 'limit'

        return (
          <div
            key={habit.id}
            style={{
              borderBottom: hi < habits.length - 1 ? `1px dashed rgba(34,26,22,0.12)` : 'none',
              padding: '11px 0',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 56px 36px', alignItems: 'center', gap: 10 }}>
              {/* name + meta */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {habit.icon && <span style={{ fontSize: 14 }}>{habit.icon}</span>}
                  <span style={{ fontFamily: body, fontSize: 15, fontWeight: 600, color: S.ink, lineHeight: 1.2 }}>{habit.name}</span>
                  {isLimit && (
                    <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase' as const, background: S.rose, color: S.ink, padding: '1px 5px', borderRadius: 999 }}>limit</span>
                  )}
                </div>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', color: S.inkSoft, opacity: 0.55, marginTop: 2 }}>
                  streak {streak} · {filledCount}/{days}
                </div>
              </div>

              {/* 14-day circle dots */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {dayKeys.map((d, k) => {
                  const filled = logsByDay.has(d)
                  const isToday = d === todayKey
                  const rot = k % 2 === 0 ? -3 : 3
                  return (
                    <div
                      key={d}
                      title={d}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: filled ? color : 'transparent',
                        border: `${isToday ? 2 : 1.8}px solid ${filled ? color : S.ink}`,
                        opacity: filled ? 1 : (isToday ? 0.9 : 0.3),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `rotate(${rot}deg)`,
                        boxShadow: isToday && !filled ? `0 0 0 2px ${color}55` : 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      {filled && (
                        <svg width="11" height="9" viewBox="0 0 12 10">
                          <path d="M1,5 l3,4 l7,-8" fill="none" stroke={S.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* percentage */}
              <div style={{ fontFamily: hand, fontSize: 22, color, textAlign: 'right', lineHeight: 1 }}>
                {pct}%
              </div>

              {/* log button */}
              <button
                onClick={() => {
                  setLoggingId(isLogging ? null : habit.id)
                  setInputVal('1')
                }}
                title="Log"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isLogging ? S.inkSoft : S.ink,
                  color: S.paper,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: body,
                  flexShrink: 0,
                }}
              >
                {isLogging ? '✕' : '+'}
              </button>
            </div>

            {/* inline log form */}
            {isLogging && (
              <form
                onSubmit={(e) => handleLog(e, habit.id, habit.unit)}
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderTop: `1px dashed rgba(34,26,22,0.15)`,
                  paddingTop: 8,
                  paddingLeft: 2,
                }}
              >
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  step="any"
                  min="0"
                  autoFocus
                  style={{
                    width: 72,
                    padding: '5px 9px',
                    border: `1.5px solid ${S.ink}`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: body,
                    background: S.paper,
                    color: S.ink,
                    outline: 'none',
                  }}
                />
                <span style={{ fontFamily: mono, fontSize: 11, color: S.inkSoft, letterSpacing: '0.1em' }}>{habit.unit}</span>
                <button
                  type="submit"
                  style={{ padding: '5px 14px', background: S.ink, color: S.paper, border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: body }}
                >
                  log it →
                </button>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}
