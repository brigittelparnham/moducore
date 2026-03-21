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

type Tab = 'today' | 'finance' | 'budget' | 'rewards'

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

        // Fetch balances
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

  if (loading) return <div style={page}><p style={muted}>Loading…</p></div>

  return (
    <div style={page}>
      {/* Header */}
      <div style={headerBox}>
        <h1 style={title}>Lifestyle</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={pointsBadge}>⭐ {points}</span>
        </div>
        <nav style={tabBar}>
          {(['today', 'finance', 'budget', 'rewards'] as Tab[]).map((t) => (
            <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div style={content}>
        {/* TODAY TAB */}
        {tab === 'today' && (
          <div>
            <section style={section}>
              <h3 style={sectionTitle}>Today's habits</h3>
              {todayHabits.length === 0 ? (
                <p style={muted}>No daily habits yet. Add some in the Habits page.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            </section>

            <section style={section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...sectionTitle, margin: 0 }}>Recent spending</h3>
                <button style={addBtn} onClick={() => setShowAddTx(true)}>+ Add</button>
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
                <p style={muted}>No transactions yet.</p>
              )}
            </section>
          </div>
        )}

        {/* FINANCE TAB */}
        {tab === 'finance' && (
          <div>
            <section style={section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...sectionTitle, margin: 0 }}>Accounts</h3>
              </div>
              {accounts.map((a) => (
                <AccountCard key={a.id} account={a} balance={balances[a.id] ?? 0} />
              ))}
              {accounts.length === 0 && <p style={muted}>No accounts yet.</p>}
            </section>

            <section style={section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...sectionTitle, margin: 0 }}>Transactions</h3>
                <button style={addBtn} onClick={() => setShowAddTx(true)}>+ Add</button>
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
                <p style={muted}>No transactions yet.</p>
              )}
            </section>
          </div>
        )}

        {/* BUDGET TAB */}
        {tab === 'budget' && (
          <section style={section}>
            <h3 style={sectionTitle}>Monthly budget</h3>
            <BudgetProgress lines={budgetLines} period="monthly" />
          </section>
        )}

        {/* REWARDS TAB */}
        {tab === 'rewards' && (
          <div>
            <section style={section}>
              <PointsWidget
                total={points}
              />
            </section>
            <section style={section}>
              <h3 style={sectionTitle}>Rewards</h3>
              {rewards.length === 0 ? (
                <p style={muted}>No rewards set up yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rewards.map((r) => (
                    <RewardCard key={r.id} reward={r} points={points} onRedeem={handleRedeem} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f9fafb',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
const headerBox: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '0 24px',
}
const title: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  margin: '20px 0 8px',
}
const pointsBadge: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  background: '#fef9c3',
  color: '#92400e',
  padding: '4px 10px',
  borderRadius: 20,
}
const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  marginTop: 8,
}
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
  fontWeight: active ? 700 : 400,
  fontSize: 14,
  cursor: 'pointer',
  color: active ? '#1a1a1a' : '#888',
  marginBottom: -1,
})
const content: React.CSSProperties = {
  maxWidth: 700,
  margin: '0 auto',
  padding: '24px 16px',
}
const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  padding: '16px 18px',
  marginBottom: 16,
  border: '1px solid #e5e7eb',
}
const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
}
const muted: React.CSSProperties = { color: '#94a3b8', fontSize: 14, margin: 0 }
const addBtn: React.CSSProperties = {
  padding: '5px 12px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}
