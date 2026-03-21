import { useState } from 'react'
import type { Habit, HabitTarget } from '../types'

type Props = {
  habit: Habit
  todayTotal?: number
  streak?: number
  onLog: (habitId: string, value: string) => void
}

const FREQ_ORDER = ['daily', 'weekly', 'monthly', 'yearly'] as const

function primaryTarget(targets: HabitTarget[]): HabitTarget | null {
  for (const f of FREQ_ORDER) {
    const t = targets.find((t) => t.frequency === f)
    if (t) return t
  }
  return null
}

export function HabitCard({ habit, todayTotal = 0, streak = 0, onLog }: Props) {
  const [logging, setLogging] = useState(false)
  const [inputVal, setInputVal] = useState('1')

  const target = primaryTarget(habit.targets ?? [])
  const targetNum = target ? parseFloat(target.targetValue) : null
  const isLimit = habit.type === 'limit'
  const progress = targetNum ? Math.min(todayTotal / targetNum, 1) : 0
  const isOver = isLimit && targetNum !== null && todayTotal > targetNum
  const isMet = targetNum !== null && (isLimit ? todayTotal <= targetNum : todayTotal >= targetNum)

  const progressColor = isOver ? '#ef4444' : isMet ? '#16a34a' : (habit.color ?? '#6366f1')

  function handleLog(e: React.FormEvent) {
    e.preventDefault()
    onLog(habit.id, inputVal)
    setLogging(false)
    setInputVal('1')
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Icon */}
        <div style={{ fontSize: 24, width: 36, textAlign: 'center', flexShrink: 0 }}>
          {habit.icon ?? (isLimit ? '🚧' : '✅')}
        </div>
        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{habit.name}</span>
            {isLimit && <span style={limitBadge}>limit</span>}
            {streak > 0 && (
              <span style={streakBadge}>🔥 {streak}</span>
            )}
          </div>

          {targetNum !== null && target?.frequency === 'daily' && (
            <>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                {isLimit
                  ? `${todayTotal} / ${targetNum} ${habit.unit} today`
                  : `${todayTotal} / ${targetNum} ${habit.unit} today`}
              </div>
              <div style={progressBar}>
                <div
                  style={{
                    ...progressFill,
                    width: `${Math.min(progress * 100, 100)}%`,
                    background: progressColor,
                  }}
                />
              </div>
            </>
          )}
        </div>
        {/* Log button */}
        <button
          style={logBtn(habit.color ?? '#6366f1')}
          onClick={() => setLogging((v) => !v)}
          title="Log"
        >
          +
        </button>
      </div>

      {logging && (
        <form onSubmit={handleLog} style={logForm}>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            step="any"
            min="0"
            style={logInput}
            autoFocus
          />
          <span style={{ fontSize: 13, color: '#666' }}>{habit.unit}</span>
          <button type="submit" style={logSubmit(habit.color ?? '#6366f1')}>Log</button>
          <button type="button" onClick={() => setLogging(false)} style={cancelBtn}>Cancel</button>
        </form>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 14px',
}
const limitBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  background: '#fef3c7',
  color: '#92400e',
  padding: '2px 6px',
  borderRadius: 4,
  textTransform: 'uppercase',
}
const streakBadge: React.CSSProperties = {
  fontSize: 12,
  background: '#fff7ed',
  color: '#c2410c',
  padding: '2px 6px',
  borderRadius: 4,
}
const progressBar: React.CSSProperties = {
  marginTop: 6,
  height: 5,
  background: '#f3f4f6',
  borderRadius: 3,
  overflow: 'hidden',
}
const progressFill: React.CSSProperties = {
  height: '100%',
  borderRadius: 3,
  transition: 'width 0.3s ease',
}
const logBtn = (color: string): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: color,
  color: '#fff',
  border: 'none',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 1,
})
const logForm: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderTop: '1px solid #f3f4f6',
  paddingTop: 10,
}
const logInput: React.CSSProperties = {
  width: 80,
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
}
const logSubmit = (color: string): React.CSSProperties => ({
  padding: '4px 12px',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
})
const cancelBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  color: '#666',
}
