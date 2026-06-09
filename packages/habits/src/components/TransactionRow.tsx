import { useState } from 'react'
import type { Transaction, Category } from '../types'

type Props = {
  transaction: Transaction
  categories: Category[]
  onUpdateCategory: (id: string, categoryId: string) => void
}

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
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

export function TransactionRow({ transaction, categories, onUpdateCategory }: Props) {
  const [picking, setPicking] = useState(false)
  const amount = parseFloat(transaction.amount)
  const isIn = amount > 0
  const cat = transaction.category

  return (
    <div style={row}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={iconBox}
          onClick={() => setPicking((v) => !v)}
          title="Change category"
        >
          {cat?.icon ?? '📦'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: body, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: S.ink }}>
            {transaction.description}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', color: S.inkSoft, opacity: 0.6 }}>
              {formatDate(transaction.date)}
            </span>
            {cat && (
              <span style={categoryTag(transaction.categoryConfirmed)}>
                {cat.icon} {cat.name}
                {!transaction.categoryConfirmed && ' ·'}
              </span>
            )}
            {!cat && (
              <button style={uncategorisedBtn} onClick={() => setPicking(true)}>
                + categorise
              </button>
            )}
          </div>
        </div>

        <div style={{ fontFamily: hand, fontSize: 26, lineHeight: 1, color: isIn ? S.mint : S.ink, flexShrink: 0 }}>
          {isIn ? '+' : '−'}£{Math.abs(amount).toFixed(2)}
        </div>
      </div>

      {picking && (
        <div style={picker}>
          {categories.filter((c) => c.type !== 'transfer').map((c) => (
            <button
              key={c.id}
              style={pickerItem(transaction.categoryId === c.id)}
              onClick={() => { onUpdateCategory(transaction.id, c.id); setPicking(false) }}
            >
              {c.icon} {c.name}
            </button>
          ))}
          <button style={cancelBtn} onClick={() => setPicking(false)}>cancel</button>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d >= today) return 'Today'
  if (d >= yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const row: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: `1px dashed rgba(34,26,22,0.12)`,
  fontFamily: body,
}
const iconBox: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 4,
  background: S.paperD,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  flexShrink: 0,
  cursor: 'pointer',
}
const categoryTag = (confirmed: boolean): React.CSSProperties => ({
  fontFamily: mono,
  fontSize: 9,
  letterSpacing: '0.12em',
  background: S.paperD,
  color: S.inkSoft,
  padding: '2px 6px',
  borderRadius: 999,
  textTransform: 'uppercase' as const,
  opacity: confirmed ? 1 : 0.65,
  border: confirmed ? 'none' : `1px dashed ${S.inkSoft}`,
})
const uncategorisedBtn: React.CSSProperties = {
  background: 'none',
  border: `1px dashed ${S.inkSoft}`,
  color: S.inkSoft,
  fontFamily: mono,
  fontSize: 9,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  padding: '2px 7px',
  borderRadius: 999,
}
const picker: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  padding: '8px 0 4px',
  borderTop: `1px dashed rgba(34,26,22,0.12)`,
}
const pickerItem = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  background: active ? S.ink : S.paperD,
  color: active ? S.paper : S.inkSoft,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: body,
  fontSize: 12,
  fontWeight: active ? 600 : 400,
})
const cancelBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'transparent',
  border: `1.5px solid ${S.ink}`,
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: body,
  fontSize: 12,
  color: S.inkSoft,
}
