import { useEffect, useState } from 'react'
import { useHabits } from '../context'
import { createHabitsApi } from '../api'
import type { Habit, Account, Category, Transaction, Reward, StreakInfo } from '../types'
import { HabitCard } from './HabitCard'
import { RewardCard, PointsWidget } from './RewardCard'
import { TransactionRow } from './TransactionRow'
import { TransactionForm } from './TransactionForm'
import { AccountCard } from './AccountCard'
import { BudgetProgress } from './BudgetProgress'
import { LifestyleSettings } from './LifestyleSettings'

type Tab = 'today' | 'finance' | 'budget' | 'rewards' | 'settings'

// ── Studio design tokens ──────────────────────────────────────────────────────
const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
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

const TABS: Tab[] = ['today', 'finance', 'budget', 'rewards', 'settings']

export function LifestyleDashboard() {
  const { apiBase } = useHabits()
  const api = createHabitsApi(apiBase)
  const [tab, setTab] = useState<Tab>('today')

  const [habits, setHabits] = useState<Habit[]>([])
  const [streaks, setStreaks] = useState<StreakInfo[]>([])
  const [points, setPoints] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetLines, setBudgetLines] = useState<import('../types').BudgetLine[]>([])
  const [showAddTx, setShowAddTx] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.habits.list(),
      api.habits.streaks(),
      api.rewards.list(),
      api.accounts.list(),
      api.transactions.list({ limit: 20 }),
      api.categories.list(),
      api.budget.get('monthly'),
    ])
      .then(([h, s, r, a, t, c, b]) => {
        setHabits(h.habits)
        setStreaks(s.streaks)
        setPoints(r.points)
        setRewards(r.rewards)
        setAccounts(a.accounts)
        setTransactions(t.transactions)
        setCategories(c.categories)
        setBudgetLines(b.budget)
        return Promise.all(a.accounts.map((acc) => api.accounts.get(acc.id)))
      })
      .then((details) => {
        const map: Record<string, number> = {}
        for (const d of details) map[d.account.id] = d.balance
        setBalances(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  async function handleLog(habitId: string, value: string) {
    const res = await api.habits.log(habitId, { value })
    if (res.pointsEarned > 0) setPoints((p) => p + res.pointsEarned)
    if (res.rewardsUnlocked?.length > 0) {
      const r = await api.rewards.list()
      setRewards(r.rewards)
    }
  }

  async function handleRedeem(rewardId: string) {
    await api.rewards.redeem(rewardId)
    const r = await api.rewards.list()
    setRewards(r.rewards); setPoints(r.points)
  }

  async function handleAddTx(data: Parameters<typeof api.transactions.create>[1] & { accountId: string }) {
    const { accountId, ...rest } = data
    await api.transactions.create(accountId, rest)
    const [t, a] = await Promise.all([
      api.transactions.list({ limit: 20 }),
      api.accounts.get(accountId),
    ])
    setTransactions(t.transactions)
    setBalances((prev) => ({ ...prev, [accountId]: a.balance }))
    setShowAddTx(false)
  }

  async function handleUpdateCategory(txId: string, categoryId: string) {
    await api.transactions.update(txId, { categoryId, categoryConfirmed: true })
    const t = await api.transactions.list({ limit: 20 })
    setTransactions(t.transactions)
  }

  const todayHabits = habits.filter((h) =>
    h.targets?.some((t) => t.frequency === 'daily')
  )
  const todayStreakMap = Object.fromEntries(
    streaks.filter((s) => s.frequency === 'daily').map((s) => [s.habitId, s.current])
  )

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div style={page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <span style={{ fontFamily: hand, fontSize: 32, color: S.inkSoft, opacity: 0.5 }}>loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      {/* dot grid overlay */}
      <div style={dotGrid} />

      {/* Header bar */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', paddingTop: 16 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55, textTransform: 'uppercase' as const }}>
              lifestyle
            </div>
            <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', margin: '2px 0 0', color: S.ink, lineHeight: 1 }}>
              small <span style={{ fontFamily: hand, color: S.coral, fontSize: 40 }}>reps,</span>{' '}
              big <span style={{ fontFamily: hand, color: S.mint, fontSize: 40 }}>self.</span>
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, lineHeight: 1.15 }}>{dateLabel}</div>
            {points > 0 && (
              <div style={pointsBadge}>⭐ {points} pts</div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <nav style={tabBar}>
          {TABS.map((t) => (
            <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div style={content}>

        {/* TODAY TAB */}
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Habits grid card */}
            <div style={paperCard(-0.5)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div style={{ fontFamily: hand, fontSize: 28, color: S.ink }}>today's reps ↘</div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', opacity: 0.55 }}>TAP + TO LOG</div>
              </div>
              {todayHabits.length === 0 ? (
                <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>
                  no daily habits yet. add some in settings →
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayHabits.map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      streak={todayStreakMap[h.id] ?? 0}
                      onLog={handleLog}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Streak + recent spend side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Streak sticky */}
              <div style={stickyNote(S.lemon, 1)}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', opacity: 0.65, textTransform: 'uppercase' as const }}>streak</div>
                {streaks.length > 0 ? (
                  <>
                    <div style={{ fontFamily: hand, fontSize: 52, lineHeight: 1, marginTop: 4, color: S.ink }}>
                      {Math.max(...streaks.map((s) => s.current), 0)}
                    </div>
                    <div style={{ fontFamily: hand, fontSize: 22, color: S.coral, marginTop: 2 }}>days ↑</div>
                  </>
                ) : (
                  <div style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, marginTop: 6, opacity: 0.6 }}>
                    start logging to build a streak
                  </div>
                )}
              </div>

              {/* Spending sticky */}
              <div style={stickyNote(S.rose, -1.5)}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', opacity: 0.65, textTransform: 'uppercase' as const }}>this week</div>
                {transactions.length > 0 ? (
                  <>
                    <div style={{ fontFamily: hand, fontSize: 36, lineHeight: 1.1, marginTop: 4, color: S.ink }}>
                      £{transactions
                        .filter((tx) => {
                          const d = new Date(tx.date)
                          const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
                          return d >= weekAgo && parseFloat(tx.amount) < 0
                        })
                        .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0)
                        .toFixed(0)}
                    </div>
                    <div style={{ fontFamily: hand, fontSize: 18, color: S.inkSoft, marginTop: 2 }}>spent this week</div>
                  </>
                ) : (
                  <div style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, marginTop: 6, opacity: 0.6 }}>
                    no transactions yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div style={paperCard(0.4)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div style={{ fontFamily: hand, fontSize: 28, color: S.ink }}>recent spending ↘</div>
                <button style={addBtn} onClick={() => setShowAddTx(true)}>+ add</button>
              </div>
              {showAddTx && (
                <TransactionForm
                  accounts={accounts}
                  categories={categories}
                  onSave={handleAddTx}
                  onCancel={() => setShowAddTx(false)}
                />
              )}
              {transactions.slice(0, 5).map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  onUpdateCategory={handleUpdateCategory}
                />
              ))}
              {transactions.length === 0 && !showAddTx && (
                <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>no transactions yet.</p>
              )}
            </div>
          </div>
        )}

        {/* FINANCE TAB */}
        {tab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={paperCard(-0.4)}>
              <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, marginBottom: 14 }}>accounts ↘</div>
              {accounts.map((a) => (
                <AccountCard key={a.id} account={a} balance={balances[a.id] ?? 0} />
              ))}
              {accounts.length === 0 && (
                <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>no accounts yet.</p>
              )}
            </div>

            <div style={paperCard(0.3)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div style={{ fontFamily: hand, fontSize: 28, color: S.ink }}>transactions ↘</div>
                <button style={addBtn} onClick={() => setShowAddTx(true)}>+ add</button>
              </div>
              {showAddTx && (
                <TransactionForm
                  accounts={accounts}
                  categories={categories}
                  onSave={handleAddTx}
                  onCancel={() => setShowAddTx(false)}
                />
              )}
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  onUpdateCategory={handleUpdateCategory}
                />
              ))}
              {transactions.length === 0 && !showAddTx && (
                <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>no transactions yet.</p>
              )}
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {tab === 'budget' && (
          <div style={paperCard(-0.5)}>
            <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, marginBottom: 16 }}>monthly budget ↘</div>
            <BudgetProgress lines={budgetLines} period="monthly" />
          </div>
        )}

        {/* REWARDS TAB */}
        {tab === 'rewards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PointsWidget total={points} />
            <div style={paperCard(0.4)}>
              <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, marginBottom: 14 }}>rewards ↘</div>
              {rewards.length === 0 ? (
                <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.6, margin: 0 }}>no rewards set up yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rewards.map((r) => (
                    <RewardCard key={r.id} reward={r} points={points} onRedeem={handleRedeem} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && <LifestyleSettings />}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page: React.CSSProperties = {
  minHeight: '100vh',
  background: S.paper,
  fontFamily: body,
  position: 'relative',
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  zIndex: 0,
}
const header: React.CSSProperties = {
  background: S.paper,
  borderBottom: `1px solid rgba(34,26,22,0.12)`,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  paddingBottom: 0,
}
const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  padding: '0 16px',
  marginTop: 12,
}
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  background: 'none',
  border: 'none',
  borderBottom: active ? `2.5px solid ${S.ink}` : '2.5px solid transparent',
  fontFamily: mono,
  fontWeight: active ? 700 : 400,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  color: active ? S.ink : S.inkSoft,
  opacity: active ? 1 : 0.55,
  marginBottom: -1,
})
const content: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px',
  position: 'relative',
  zIndex: 1,
}
const paperCard = (rot: number): React.CSSProperties => ({
  background: '#fff',
  boxShadow: '0 14px 30px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.07)',
  borderRadius: 4,
  padding: '18px 22px',
  transform: `rotate(${rot}deg)`,
})
const stickyNote = (bg: string, rot: number): React.CSSProperties => ({
  background: bg,
  boxShadow: '0 8px 18px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
  borderRadius: 4,
  padding: '14px 16px',
  transform: `rotate(${rot}deg)`,
  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04))',
})
const pointsBadge: React.CSSProperties = {
  fontFamily: hand,
  fontSize: 18,
  color: S.coral,
  marginTop: 2,
}
const addBtn: React.CSSProperties = {
  padding: '6px 14px',
  background: S.ink,
  color: S.paper,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: body,
  fontSize: 13,
  fontWeight: 600,
}
