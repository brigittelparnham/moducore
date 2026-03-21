import { useState } from 'react'
import type { Account, Category } from '../types'

type Props = {
  accounts: Account[]
  categories: Category[]
  defaultAccountId?: string
  onSave: (data: {
    accountId: string
    amount: string
    description: string
    merchant?: string
    categoryId?: string
    date: string
    notes?: string
  }) => void
  onCancel: () => void
}

export function TransactionForm({ accounts, categories, defaultAccountId, onSave, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [direction, setDirection] = useState<'out' | 'in'>('out')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(today)
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const expenseCategories = categories.filter((c) =>
    direction === 'in' ? c.type === 'income' : c.type !== 'income'
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !description || !accountId) return
    const signed = direction === 'out' ? `-${amount}` : amount
    onSave({
      accountId,
      amount: signed,
      description,
      merchant: description, // use description as merchant for rule learning
      categoryId: categoryId || undefined,
      date,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={form}>
      {/* Direction toggle */}
      <div style={toggleRow}>
        <button
          type="button"
          style={toggleBtn(direction === 'out', '#ef4444')}
          onClick={() => setDirection('out')}
        >
          Money out ↑
        </button>
        <button
          type="button"
          style={toggleBtn(direction === 'in', '#16a34a')}
          onClick={() => setDirection('in')}
        >
          Money in ↓
        </button>
      </div>

      {/* Amount */}
      <div style={row}>
        <label style={label}>Amount (£)</label>
        <div style={{ position: 'relative' }}>
          <span style={currencySymbol}>£</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            style={{ ...input, paddingLeft: 24 }}
            autoFocus
          />
        </div>
      </div>

      {/* Description */}
      <div style={row}>
        <label style={label}>What was it?</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Deliveroo, Tesco, Salary…"
          required
          style={input}
        />
      </div>

      {/* Category */}
      <div style={row}>
        <label style={label}>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={select}>
          <option value="">— choose —</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div style={row}>
        <label style={label}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={input}
        />
      </div>

      {/* Account (if multiple) */}
      {accounts.length > 1 && (
        <div style={row}>
          <label style={label}>Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={select}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Optional notes */}
      <button
        type="button"
        style={notesToggle}
        onClick={() => setShowNotes((v) => !v)}
      >
        {showNotes ? '− hide notes' : '+ add notes'}
      </button>
      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
          style={textarea}
          rows={2}
        />
      )}

      <div style={actions}>
        <button type="submit" style={saveBtn}>Save</button>
        <button type="button" style={cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 0',
}
const toggleRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
}
const toggleBtn = (active: boolean, color: string): React.CSSProperties => ({
  flex: 1,
  padding: '8px 0',
  background: active ? color : '#f3f4f6',
  color: active ? '#fff' : '#444',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
})
const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#555',
}
const input: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
}
const currencySymbol: React.CSSProperties = {
  position: 'absolute',
  left: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#666',
  fontSize: 14,
}
const select: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  background: '#fff',
}
const textarea: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 13,
  width: '100%',
  resize: 'vertical',
  boxSizing: 'border-box',
}
const notesToggle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6366f1',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  padding: 0,
}
const actions: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 4,
}
const saveBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
}
const cancelBtn: React.CSSProperties = {
  padding: '10px 16px',
  background: 'none',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  color: '#666',
}
