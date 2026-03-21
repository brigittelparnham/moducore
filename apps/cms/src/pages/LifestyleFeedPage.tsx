import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const HABITS_URL = import.meta.env.VITE_HABITS_URL ?? 'http://localhost:3005'

type Habit = { id: string; name: string; icon: string | null; type: string }
type Transaction = {
  id: string; amount: string; description: string; date: string
  category?: { name: string; icon: string | null; color: string | null } | null
}
type Reward = { id: string; name: string; earnedAt: string | null; redeemedAt: string | null }

export function LifestyleFeedPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/habits`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({ habits: [] })),
      fetch(`${API_URL}/finance/transactions?limit=5`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({ transactions: [] })),
      fetch(`${API_URL}/habits/rewards`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({ rewards: [], points: 0 })),
    ])
      .then(([h, t, r]) => {
        setHabits(h.habits ?? [])
        setTransactions(t.transactions ?? [])
        setRewards(r.rewards ?? [])
        setPoints(r.points ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  const earnedRewards = rewards.filter((r) => r.earnedAt && !r.redeemedAt)

  if (loading) return <div style={page}><p style={muted}>Loading…</p></div>

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h1 style={title}>Lifestyle</h1>
          <p style={sub}>Habits, limits, rewards & spending</p>
        </div>
        <a href={HABITS_URL} target="_blank" rel="noreferrer" style={openBtn}>
          Open Lifestyle App →
        </a>
      </div>

      <div style={grid}>
        {/* Habits summary */}
        <div style={card}>
          <h3 style={cardTitle}>Habits</h3>
          {habits.length === 0 ? (
            <p style={muted}>No habits set up yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {habits.slice(0, 5).map((h) => (
                <div key={h.id} style={habitRow}>
                  <span style={{ fontSize: 18 }}>{h.icon ?? (h.type === 'limit' ? '🚧' : '✅')}</span>
                  <span style={{ fontSize: 14, flex: 1 }}>{h.name}</span>
                  {h.type === 'limit' && <span style={limitTag}>limit</span>}
                </div>
              ))}
              {habits.length > 5 && (
                <p style={{ ...muted, fontSize: 12 }}>+{habits.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Points & rewards */}
        <div style={card}>
          <h3 style={cardTitle}>Points & Rewards</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⭐</span>
            <span style={{ fontSize: 26, fontWeight: 800 }}>{points}</span>
            <span style={{ fontSize: 13, color: '#888' }}>pts</span>
          </div>
          {earnedRewards.length > 0 ? (
            <div>
              <p style={{ ...muted, fontSize: 12, marginBottom: 6 }}>Earned, awaiting redemption:</p>
              {earnedRewards.map((r) => (
                <div key={r.id} style={rewardRow}>
                  <span style={{ fontSize: 14 }}>🎁 {r.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={muted}>No rewards pending.</p>
          )}
        </div>

        {/* Recent transactions */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <h3 style={cardTitle}>Recent spending</h3>
          {transactions.length === 0 ? (
            <p style={muted}>No transactions yet.</p>
          ) : (
            transactions.map((tx) => {
              const amount = parseFloat(tx.amount)
              const isIn = amount > 0
              return (
                <div key={tx.id} style={txRow}>
                  <span style={{ fontSize: 16 }}>{tx.category?.icon ?? '📦'}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{tx.description}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: isIn ? '#16a34a' : '#1a1a1a', minWidth: 70, textAlign: 'right' }}>
                    {isIn ? '+' : '−'}£{Math.abs(amount).toFixed(2)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  padding: '32px 24px',
  maxWidth: 900,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
}
const title: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: '0 0 4px' }
const sub: React.CSSProperties = { fontSize: 13, color: '#888', margin: 0 }
const openBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: '#1a1a1a',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
}
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}
const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '16px 18px',
}
const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: 0,
  marginBottom: 12,
}
const habitRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}
const limitTag: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  background: '#fef3c7',
  color: '#92400e',
  padding: '2px 6px',
  borderRadius: 4,
}
const rewardRow: React.CSSProperties = {
  padding: '6px 0',
  borderBottom: '1px solid #f3f4f6',
}
const txRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
}
const muted: React.CSSProperties = { color: '#94a3b8', fontSize: 14, margin: 0 }
