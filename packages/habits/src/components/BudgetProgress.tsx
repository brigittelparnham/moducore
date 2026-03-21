import type { BudgetLine } from '../types'

type Props = {
  lines: BudgetLine[]
  period: 'weekly' | 'monthly' | 'yearly'
}

export function BudgetProgress({ lines, period }: Props) {
  if (lines.length === 0) {
    return <p style={muted}>No budget rules set for {period}.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {lines.map((line) => {
        const limit = parseFloat(line.limitAmount)
        const pct = limit > 0 ? Math.min(line.spent / limit, 1) : 0
        const over = line.spent > limit
        const color = over ? '#ef4444' : pct > 0.8 ? '#f59e0b' : '#16a34a'

        return (
          <div key={line.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {line.category?.icon} {line.category?.name ?? 'Unknown'}
              </span>
              <span style={{ fontSize: 13, color: over ? '#ef4444' : '#444', fontWeight: over ? 700 : 400 }}>
                £{line.spent.toFixed(2)}
                <span style={{ color: '#94a3b8' }}> / £{limit.toFixed(2)}</span>
              </span>
            </div>
            <div style={bar}>
              <div style={{ ...fill, width: `${pct * 100}%`, background: color }} />
            </div>
            <div style={{ fontSize: 11, color: over ? '#ef4444' : '#94a3b8', marginTop: 2 }}>
              {over
                ? `£${(line.spent - limit).toFixed(2)} over budget`
                : `£${Math.max(0, line.remaining).toFixed(2)} remaining`}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const bar: React.CSSProperties = {
  height: 8,
  background: '#f3f4f6',
  borderRadius: 4,
  overflow: 'hidden',
}
const fill: React.CSSProperties = {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.3s',
}
const muted: React.CSSProperties = { color: '#94a3b8', fontSize: 14, margin: 0 }
