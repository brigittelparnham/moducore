import type { BudgetLine } from '../types'

type Props = {
  lines: BudgetLine[]
  period: 'weekly' | 'monthly' | 'yearly'
}

const S = {
  paper: '#efe6d4',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

export function BudgetProgress({ lines, period }: Props) {
  if (lines.length === 0) {
    return (
      <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>
        no budget rules for {period} yet.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {lines.map((line) => {
        const limit = parseFloat(line.limitAmount)
        const pct = limit > 0 ? Math.min(line.spent / limit, 1) : 0
        const over = line.spent > limit
        const barColor = over ? S.coral : pct > 0.8 ? S.lemon : S.mint

        return (
          <div key={line.id} style={{ fontFamily: body }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: hand, fontSize: 22, color: S.ink }}>
                {line.category?.icon} {line.category?.name ?? 'Unknown'}
              </span>
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', color: over ? S.coral : S.inkSoft }}>
                £{line.spent.toFixed(2)} / £{limit.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 12, background: 'rgba(34,26,22,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct * 100}%`,
                background: barColor,
                borderRadius: 999,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: over ? S.coral : S.inkSoft, marginTop: 3, opacity: over ? 1 : 0.6 }}>
              {over
                ? `£${(line.spent - limit).toFixed(2)} OVER`
                : `£${Math.max(0, line.remaining).toFixed(2)} REMAINING`}
            </div>
          </div>
        )
      })}
    </div>
  )
}
