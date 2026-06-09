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

export function HabitCard({ habit, todayTotal = 0, streak = 0, onLog }: Props) {
  const [logging, setLogging] = useState(false)
  const [inputVal, setInputVal] = useState('1')

  const target = primaryTarget(habit.targets ?? [])
  const targetNum = target ? parseFloat(target.targetValue) : null
  const isLimit = habit.type === 'limit'
  const progress = targetNum ? Math.min(todayTotal / targetNum, 1) : 0
  const isOver = isLimit && targetNum !== null && todayTotal > targetNum
  const isMet = targetNum !== null && (isLimit ? todayTotal <= targetNum : todayTotal >= targetNum)

  const barColor = isOver ? S.coral : isMet ? S.mint : S.lemon

  function handleLog(e: React.FormEvent) {
    e.preventDefault()
    onLog(habit.id, inputVal)
    setLogging(false)
    setInputVal('1')
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0, paddingTop: 2 }}>
          {habit.icon ?? (isLimit ? '🚧' : '✅')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: hand, fontSize: 26, lineHeight: 1.1, color: S.ink }}>{habit.name}</span>
            {isLimit && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, background: S.rose, color: S.ink, padding: '2px 7px', borderRadius: 999 }}>limit</span>
            )}
            {streak > 0 && (
              <span style={{ fontFamily: hand, fontSize: 18, color: S.coral }}>↑ {streak}</span>
            )}
          </div>

          {targetNum !== null && target?.frequency === 'daily' && (
            <>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.15em', color: S.inkSoft, marginTop: 3, opacity: 0.7 }}>
                {todayTotal} / {targetNum} {habit.unit}
              </div>
              <div style={{ marginTop: 6, height: 10, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: barColor,
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </>
          )}
        </div>

        <button style={logBtn} onClick={() => setLogging((v) => !v)} title="Log">
          {logging ? '✕' : '+'}
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
          <span style={{ fontFamily: mono, fontSize: 11, color: S.inkSoft, letterSpacing: '0.1em' }}>{habit.unit}</span>
          <button type="submit" style={logSubmitBtn}>log it →</button>
          <button type="button" onClick={() => setLogging(false)} style={cancelBtn}>cancel</button>
        </form>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)',
  borderRadius: 4,
  padding: '14px 16px',
  fontFamily: body,
}
const logBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: S.ink,
  color: S.paper,
  border: 'none',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 1,
  fontFamily: body,
}
const logForm: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  borderTop: `1px dashed rgba(34,26,22,0.15)`,
  paddingTop: 10,
}
const logInput: React.CSSProperties = {
  width: 80,
  padding: '5px 9px',
  border: `1.5px solid ${S.ink}`,
  borderRadius: 6,
  fontSize: 14,
  fontFamily: body,
  background: S.paper,
  color: S.ink,
}
const logSubmitBtn: React.CSSProperties = {
  padding: '5px 14px',
  background: S.ink,
  color: S.paper,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: body,
}
const cancelBtn: React.CSSProperties = {
  padding: '5px 10px',
  background: 'transparent',
  border: `1.5px solid ${S.ink}`,
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 13,
  color: S.inkSoft,
  fontFamily: body,
}
