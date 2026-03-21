import { useState } from 'react'
import type { Transaction, Category } from '../types'

type Props = {
  transaction: Transaction
  categories: Category[]
  onUpdateCategory: (id: string, categoryId: string) => void
}

export function TransactionRow({ transaction, categories, onUpdateCategory }: Props) {
  const [picking, setPicking] = useState(false)
  const amount = parseFloat(transaction.amount)
  const isIn = amount > 0
  const cat = transaction.category

  return (
    <div style={row}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Category icon */}
        <div
          style={iconBox(cat?.color ?? '#e5e7eb')}
          onClick={() => setPicking((v) => !v)}
          title="Change category"
        >
          {cat?.icon ?? '📦'}
        </div>

        {/* Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {transaction.description}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, display: 'flex', gap: 6 }}>
            <span>{formatDate(transaction.date)}</span>
            {cat && (
              <span style={categoryPill(cat.color ?? '#e5e7eb', transaction.categoryConfirmed)}>
                {cat.name}
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

        {/* Amount */}
        <div style={{ fontWeight: 700, fontSize: 15, color: isIn ? '#16a34a' : '#1a1a1a', flexShrink: 0 }}>
          {isIn ? '+' : '−'}£{Math.abs(amount).toFixed(2)}
        </div>
      </div>

      {/* Category picker */}
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
          <button style={pickerCancel} onClick={() => setPicking(false)}>Cancel</button>
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
  borderBottom: '1px solid #f3f4f6',
}
const iconBox = (color: string): React.CSSProperties => ({
  width: 34,
  height: 34,
  borderRadius: 8,
  background: color + '22',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  flexShrink: 0,
  cursor: 'pointer',
})
const categoryPill = (color: string, confirmed: boolean): React.CSSProperties => ({
  background: color + '22',
  color: color,
  padding: '1px 6px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
  opacity: confirmed ? 1 : 0.7,
  border: confirmed ? 'none' : `1px dashed ${color}`,
})
const uncategorisedBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6366f1',
  fontSize: 11,
  cursor: 'pointer',
  padding: 0,
}
const picker: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  padding: '8px 0 4px',
  borderTop: '1px solid #f3f4f6',
}
const pickerItem = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  background: active ? '#6366f1' : '#f3f4f6',
  color: active ? '#fff' : '#444',
  border: 'none',
  borderRadius: 20,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: active ? 700 : 400,
})
const pickerCancel: React.CSSProperties = {
  padding: '4px 10px',
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: 20,
  cursor: 'pointer',
  fontSize: 12,
  color: '#888',
}
