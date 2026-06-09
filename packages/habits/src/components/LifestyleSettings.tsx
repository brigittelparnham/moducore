import { useState, useEffect, useRef } from 'react'
import { useHabits } from '../context'
import { createHabitsApi } from '../api'
import type { Habit, Reward, BudgetLine, Category, Account } from '../types'

type HabitsApi = ReturnType<typeof createHabitsApi>
const FREQ_OPTIONS = ['daily', 'weekly', 'monthly', 'yearly'] as const

// ── Studio tokens (shared across this file) ───────────────────────────────────
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
const bodyFont = "'Space Grotesk', 'Instrument Sans', sans-serif"
const handFont = "'Caveat', 'Patrick Hand', cursive"
const monoFont = "'JetBrains Mono', monospace"

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const cells: string[] = []
      let cell = ''
      let inQ = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') { cell += '"'; i++ }
          else if (c === '"') inQ = false
          else cell += c
        } else {
          if (c === '"') inQ = true
          else if (c === ',') { cells.push(cell.trim()); cell = '' }
          else cell += c
        }
      }
      cells.push(cell.trim())
      return cells
    })
    .filter((r) => r.some((c) => c))
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, badge, open, onToggle, children }: {
  title: string; badge?: number; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', boxShadow: '0 8px 18px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 12, overflow: 'hidden', transform: 'rotate(-0.3deg)', fontFamily: bodyFont }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: bodyFont }}>
        <span style={{ fontFamily: handFont, fontSize: 24, color: S.ink }}>{title}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {badge !== undefined && badge > 0 && (
            <span style={{ background: S.lemon, color: S.ink, borderRadius: 999, padding: '2px 8px', fontFamily: monoFont, fontSize: 10, letterSpacing: '0.12em' }}>{badge}</span>
          )}
          <span style={{ color: S.inkSoft, fontSize: 11, opacity: 0.55 }}>{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && <div style={{ padding: '0 18px 16px', borderTop: `1px dashed rgba(34,26,22,0.12)` }}>{children}</div>}
    </div>
  )
}

// ─── Habits & Limits ──────────────────────────────────────────────────────────
function HabitsSection({ habits, onChanged, api }: { habits: Habit[]; onChanged: () => Promise<void>; api: HabitsApi }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', icon: '', unit: '', unitLabel: '', type: 'habit' as 'habit' | 'limit', pointsPerLog: '', notes: '' })
  const [targetForm, setTargetForm] = useState<{ habitId: string; frequency: string; targetValue: string; targetType: 'min' | 'max' } | null>(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({ name: '', icon: '', unit: '', unitLabel: '', type: 'habit', pointsPerLog: '', notes: '' })
    setEditId(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        icon: form.icon || undefined,
        unit: form.unit || undefined,
        unitLabel: form.unitLabel || undefined,
        type: form.type,
        pointsPerLog: form.pointsPerLog || undefined,
        notes: form.notes || undefined,
      }
      if (editId) await api.habits.update(editId, data)
      else await api.habits.create(data)
      await onChanged()
      resetForm(); setShowForm(false)
    } finally { setSaving(false) }
  }

  const startEdit = (h: Habit) => {
    setForm({ name: h.name, icon: h.icon ?? '', unit: h.unit ?? '', unitLabel: h.unitLabel ?? '', type: h.type, pointsPerLog: h.pointsPerLog ?? '', notes: h.notes ?? '' })
    setEditId(h.id)
    setShowForm(true)
  }

  const handleArchive = async (h: Habit) => {
    await api.habits.update(h.id, { archived: !h.archived })
    await onChanged()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this habit? All logs and targets will be removed.')) return
    await api.habits.delete(id)
    await onChanged()
  }

  const handleAddTarget = async () => {
    if (!targetForm?.targetValue) return
    await api.habits.setTarget(targetForm.habitId, targetForm.frequency, targetForm.targetValue, targetForm.targetType)
    setTargetForm(null)
    await onChanged()
  }

  const handleRemoveTarget = async (habitId: string, freq: string) => {
    await api.habits.removeTarget(habitId, freq)
    await onChanged()
  }

  const active = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) => h.archived)

  return (
    <div style={{ marginTop: 12 }}>
      {active.map((h) => (
        <div key={h.id} style={rowCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
              {h.icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{h.icon}</span>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  <span style={{ ...typeBadge, background: h.type === 'limit' ? '#fef3c7' : '#ede9fe', color: h.type === 'limit' ? '#92400e' : '#5b21b6' }}>
                    {h.type}
                  </span>
                  {h.unit && <span>· {h.unit}</span>}
                  {h.pointsPerLog && Number(h.pointsPerLog) > 0 && <span>· ⭐ {h.pointsPerLog}/log</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button style={smBtn} onClick={() => startEdit(h)}>Edit</button>
              <button style={smBtn} onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                Targets {h.targets && h.targets.length > 0 ? `(${h.targets.length})` : ''}
              </button>
              <button style={{ ...smBtn, color: '#9ca3af' }} onClick={() => handleArchive(h)}>Archive</button>
              <button style={{ ...smBtn, color: '#ef4444' }} onClick={() => handleDelete(h.id)}>✕</button>
            </div>
          </div>

          {expanded === h.id && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
              {(h.targets ?? []).length === 0
                ? <p style={{ ...muted, marginBottom: 8 }}>No targets set.</p>
                : (h.targets ?? []).map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#374151' }}>
                      {t.frequency} — {t.targetType === 'max' ? '≤' : '≥'} {t.targetValue}{h.unit ? ` ${h.unit}` : ''}
                    </span>
                    <button style={{ ...smBtn, color: '#ef4444', fontSize: 11 }} onClick={() => handleRemoveTarget(h.id, t.frequency)}>Remove</button>
                  </div>
                ))
              }
              {targetForm?.habitId === h.id ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <select value={targetForm.frequency} onChange={(e) => setTargetForm({ ...targetForm, frequency: e.target.value })} style={inpSm}>
                    {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                  <select value={targetForm.targetType} onChange={(e) => setTargetForm({ ...targetForm, targetType: e.target.value as 'min' | 'max' })} style={inpSm}>
                    <option value="min">Min (at least)</option>
                    <option value="max">Max (at most)</option>
                  </select>
                  <input type="number" placeholder="Value" value={targetForm.targetValue} onChange={(e) => setTargetForm({ ...targetForm, targetValue: e.target.value })} style={{ ...inpSm, width: 80 }} />
                  <button style={saveBtnSm} onClick={handleAddTarget}>Save</button>
                  <button style={smBtn} onClick={() => setTargetForm(null)}>Cancel</button>
                </div>
              ) : (
                <button style={{ ...smBtn, marginTop: 4 }} onClick={() => setTargetForm({ habitId: h.id, frequency: 'daily', targetValue: '', targetType: 'min' })}>
                  + Add target
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {archived.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ ...muted, fontSize: 12, cursor: 'pointer', marginBottom: 6 }}>Archived ({archived.length})</summary>
          {archived.map((h) => (
            <div key={h.id} style={{ ...rowCard, opacity: 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{h.icon} {h.name}</span>
                <button style={smBtn} onClick={() => handleArchive(h)}>Restore</button>
              </div>
            </div>
          ))}
        </details>
      )}

      {showForm && (
        <div style={formCard}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>{editId ? 'Edit' : 'New'} {form.type === 'limit' ? 'Limit' : 'Habit'}</h4>
          <div style={formRow}>
            <input style={inp} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input style={{ ...inp, width: 70 }} placeholder="Icon 🏃" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <div style={formRow}>
            <select style={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'habit' | 'limit' })}>
              <option value="habit">Habit (track progress)</option>
              <option value="limit">Limit (cap spending/usage)</option>
            </select>
            <input style={inp} placeholder="Unit (steps, ml, £…)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div style={formRow}>
            <input style={inp} placeholder="Unit label (optional display name)" value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
            <input style={{ ...inp, width: 140 }} type="number" placeholder="Points per log" value={form.pointsPerLog} onChange={(e) => setForm({ ...form, pointsPerLog: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={saveBtn} disabled={saving || !form.name.trim()} onClick={handleSave}>{saving ? 'Saving…' : 'Save'}</button>
            <button style={cancelBtn} onClick={() => { resetForm(); setShowForm(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={addBtn} onClick={() => { setForm((f) => ({ ...f, type: 'habit' })); setShowForm(true) }}>+ Add habit</button>
          <button style={{ ...addBtn, background: '#fef3c7', color: '#92400e' }} onClick={() => { setForm((f) => ({ ...f, type: 'limit' })); setShowForm(true) }}>+ Add limit</button>
        </div>
      )}
    </div>
  )
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
function RewardsSection({ rewards, habits, onChanged, api }: { rewards: Reward[]; habits: Habit[]; onChanged: () => Promise<void>; api: HabitsApi }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', monetaryValue: '', rewardType: 'points_spend' as 'unlock' | 'points_spend', pointsCost: '', conditionHabitId: '', conditionFrequency: 'daily' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.rewards.create({
        name: form.name.trim(),
        description: form.description || undefined,
        monetaryValue: form.monetaryValue || undefined,
        rewardType: form.rewardType,
        pointsCost: form.rewardType === 'points_spend' && form.pointsCost ? Number(form.pointsCost) : undefined,
        conditionHabitId: form.rewardType === 'unlock' && form.conditionHabitId ? form.conditionHabitId : undefined,
        conditionFrequency: form.rewardType === 'unlock' ? form.conditionFrequency : undefined,
      })
      await onChanged()
      setForm({ name: '', description: '', monetaryValue: '', rewardType: 'points_spend', pointsCost: '', conditionHabitId: '', conditionFrequency: 'daily' })
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {rewards.length === 0 && !showAdd && <p style={muted}>No rewards set up yet.</p>}
      {rewards.map((r) => (
        <div key={r.id} style={rowCard}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.rewardType === 'points_spend'
              ? <span>⭐ {r.pointsCost} points to redeem</span>
              : <span>🔓 Unlock after habit streak</span>
            }
            {r.monetaryValue && <span>· £{r.monetaryValue} value</span>}
            {r.earnedAt && <span style={{ color: '#10b981' }}>· ✓ Earned</span>}
            {r.redeemedAt && <span>· Redeemed</span>}
          </div>
        </div>
      ))}

      {showAdd && (
        <div style={formCard}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>New Reward</h4>
          <input style={{ ...inp, marginBottom: 8 }} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={{ ...inp, marginBottom: 8 }} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input style={{ ...inp, marginBottom: 8 }} placeholder="Monetary value e.g. 5.00" value={form.monetaryValue} onChange={(e) => setForm({ ...form, monetaryValue: e.target.value })} />
          <select style={{ ...inp, marginBottom: 8 }} value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value as 'unlock' | 'points_spend' })}>
            <option value="points_spend">Points spend — costs points to redeem</option>
            <option value="unlock">Unlock — earned automatically by a habit streak</option>
          </select>
          {form.rewardType === 'points_spend' && (
            <input style={{ ...inp, marginBottom: 8 }} type="number" placeholder="Points cost" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} />
          )}
          {form.rewardType === 'unlock' && (
            <div style={{ ...formRow, marginBottom: 8 }}>
              <select style={inp} value={form.conditionHabitId} onChange={(e) => setForm({ ...form, conditionHabitId: e.target.value })}>
                <option value="">Select habit…</option>
                {habits.filter((h) => !h.archived).map((h) => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
              <select style={inp} value={form.conditionFrequency} onChange={(e) => setForm({ ...form, conditionFrequency: e.target.value })}>
                {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={saveBtn} disabled={saving || !form.name.trim()} onClick={handleSave}>{saving ? 'Saving…' : 'Save'}</button>
            <button style={cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {!showAdd && (
        <button style={{ ...addBtn, marginTop: 10 }} onClick={() => setShowAdd(true)}>+ Add reward</button>
      )}
    </div>
  )
}

// ─── Categories & Budget ──────────────────────────────────────────────────────
type BudgetPeriod = 'monthly' | 'weekly' | 'yearly'

function CategoriesSection({ habits, api }: { habits: Habit[]; api: HabitsApi }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([])
  const [period, setPeriod] = useState<BudgetPeriod>('monthly')
  const [loading, setLoading] = useState(true)
  const [editBudget, setEditBudget] = useState<string | null>(null) // category id being edited
  const [budgetInput, setBudgetInput] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState({ name: '', icon: '', color: '#6366f1', type: 'expense' as Category['type'], linkedHabitId: '' })
  const [saving, setSaving] = useState(false)

  const load = async (p: BudgetPeriod) => {
    const [c, b] = await Promise.all([api.categories.list(), api.budget.get(p)])
    setCategories(c.categories)
    setBudgetLines(b.budget)
  }

  useEffect(() => { load(period).finally(() => setLoading(false)) }, [period])

  const budgetByCategory = Object.fromEntries(budgetLines.map((b) => [b.categoryId, b]))

  const handleSetBudget = async (categoryId: string) => {
    if (!budgetInput) return
    await api.budget.set(categoryId, period, budgetInput)
    setEditBudget(null); setBudgetInput('')
    await load(period)
  }

  const handleClearBudget = async (categoryId: string) => {
    const rule = budgetByCategory[categoryId]
    if (!rule) return
    await api.budget.delete(rule.id)
    await load(period)
  }

  const startEditCat = (c: Category) => {
    setCatForm({ name: c.name, icon: c.icon ?? '', color: c.color ?? '#6366f1', type: c.type as Category['type'], linkedHabitId: c.linkedHabitId ?? '' })
    setEditCatId(c.id)
    setShowAddCat(true)
  }

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return
    setSaving(true)
    try {
      const data = { name: catForm.name.trim(), icon: catForm.icon || undefined, color: catForm.color || undefined, type: catForm.type, linkedHabitId: catForm.linkedHabitId || undefined }
      if (editCatId) await api.categories.update(editCatId, data)
      else await api.categories.create(data)
      setCatForm({ name: '', icon: '', color: '#6366f1', type: 'expense', linkedHabitId: '' })
      setEditCatId(null); setShowAddCat(false)
      await load(period)
    } finally { setSaving(false) }
  }

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Delete this category? Transactions using it will become uncategorised.')) return
    await api.categories.delete(id)
    await load(period)
  }

  const grouped = {
    expense: categories.filter((c) => c.type === 'expense'),
    income: categories.filter((c) => c.type === 'income'),
    transfer: categories.filter((c) => c.type === 'transfer'),
  }

  const renderCategory = (cat: Category) => {
    const rule = budgetByCategory[cat.id]
    const isEditing = editBudget === cat.id
    const pct = rule ? Math.min(rule.spent / parseFloat(rule.limitAmount), 1) : 0
    const over = rule ? rule.spent > parseFloat(rule.limitAmount) : false

    return (
      <div key={cat.id} style={rowCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Colour swatch */}
            <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.color ?? '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {cat.icon ?? ''}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
              {cat.isSystem && <span style={{ fontSize: 11, color: '#9ca3af' }}>system</span>}
              {cat.linkedHabitId && <span style={{ fontSize: 11, color: '#8b5cf6', marginLeft: cat.isSystem ? 6 : 0 }}>linked to habit</span>}

              {/* Budget progress bar */}
              {rule && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden', width: '100%', maxWidth: 180 }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, background: over ? '#ef4444' : pct > 0.8 ? '#f59e0b' : '#16a34a', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: over ? '#ef4444' : '#9ca3af' }}>
                    £{rule.spent.toFixed(2)} / £{rule.limitAmount} {period}
                    {over && ' — over!'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {cat.type === 'expense' && (
              rule
                ? <button style={smBtn} onClick={() => handleClearBudget(cat.id)}>Clear limit</button>
                : <button style={smBtn} onClick={() => { setEditBudget(cat.id); setBudgetInput('') }}>Set limit</button>
            )}
            {!cat.isSystem && <button style={smBtn} onClick={() => startEditCat(cat)}>Edit</button>}
            {!cat.isSystem && <button style={{ ...smBtn, color: '#ef4444' }} onClick={() => handleDeleteCat(cat.id)}>✕</button>}
          </div>
        </div>

        {/* Inline budget input */}
        {isEditing && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#374151' }}>£</span>
            <input
              type="number"
              autoFocus
              placeholder="e.g. 200"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSetBudget(cat.id); if (e.key === 'Escape') setEditBudget(null) }}
              style={{ ...inpSm, width: 100 }}
            />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>/ {period}</span>
            <button style={saveBtnSm} onClick={() => handleSetBudget(cat.id)}>Save</button>
            <button style={smBtn} onClick={() => setEditBudget(null)}>Cancel</button>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <p style={{ ...muted, marginTop: 12 }}>Loading…</p>

  return (
    <div style={{ marginTop: 12 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center', marginRight: 4 }}>Budget period:</span>
        {(['monthly', 'weekly', 'yearly'] as const).map((p) => (
          <button key={p} style={{ ...smBtn, fontWeight: period === p ? 700 : 400, background: period === p ? '#1a1a1a' : '#f9fafb', color: period === p ? '#fff' : '#374151' }} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Expense categories */}
      {grouped.expense.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Spending</p>
          {grouped.expense.map(renderCategory)}
        </div>
      )}

      {/* Income categories */}
      {grouped.income.length > 0 && (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginBottom: 8 }}>
            Income ({grouped.income.length})
          </summary>
          <div style={{ marginTop: 8 }}>{grouped.income.map(renderCategory)}</div>
        </details>
      )}

      {/* Transfer categories */}
      {grouped.transfer.length > 0 && (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginBottom: 8 }}>
            Transfers ({grouped.transfer.length})
          </summary>
          <div style={{ marginTop: 8 }}>{grouped.transfer.map(renderCategory)}</div>
        </details>
      )}

      {/* Add/edit category form */}
      {showAddCat && (
        <div style={formCard}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>{editCatId ? 'Edit category' : 'New category'}</h4>
          <div style={formRow}>
            <input style={inp} placeholder="Name *" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            <input style={{ ...inp, width: 70 }} placeholder="Icon 🛒" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} />
            <input style={{ ...inp, width: 100 }} type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} title="Colour" />
          </div>
          <div style={{ ...formRow, marginTop: 8 }}>
            <select style={inp} value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value as Category['type'] })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
            <select style={inp} value={catForm.linkedHabitId} onChange={(e) => setCatForm({ ...catForm, linkedHabitId: e.target.value })}>
              <option value="">No linked habit</option>
              {habits.filter((h) => !h.archived).map((h) => (
                <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={saveBtn} disabled={saving || !catForm.name.trim()} onClick={handleSaveCat}>{saving ? 'Saving…' : 'Save'}</button>
            <button style={cancelBtn} onClick={() => { setCatForm({ name: '', icon: '', color: '#6366f1', type: 'expense', linkedHabitId: '' }); setEditCatId(null); setShowAddCat(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {!showAddCat && (
        <button style={{ ...addBtn, marginTop: 4 }} onClick={() => setShowAddCat(true)}>+ Add category</button>
      )}
    </div>
  )
}

// ─── Starling Bank ────────────────────────────────────────────────────────────
function StarlingSection({ api }: { api: HabitsApi }) {
  const [connected, setConnected] = useState<Array<{ id: string; name: string; lastSyncedAt: string | null }>>([])
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const loadStatus = async () => {
    const s = await api.starling.status()
    setConnected((s.accounts ?? []).filter((a) => a.connected))
  }

  useEffect(() => { loadStatus().catch(() => {}) }, [])

  const handleConnect = async () => {
    if (!token.trim()) return
    setConnecting(true); setMsg(null)
    try {
      const res = await api.starling.connect(token.trim())
      if (res.error) { setMsg({ text: res.error.message ?? 'Failed to connect', ok: false }); return }
      setMsg({ text: `Connected ${res.accounts?.length ?? 0} account(s). First sync complete.`, ok: true })
      setToken('')
      await loadStatus()
    } catch { setMsg({ text: 'Connection failed', ok: false }) }
    finally { setConnecting(false) }
  }

  const handleSync = async () => {
    setSyncing(true); setMsg(null)
    try {
      const res = await api.starling.sync()
      const total = (res.synced ?? []).reduce((s: number, a: { synced: number }) => s + a.synced, 0)
      setMsg({ text: `Synced ${total} new transaction(s)`, ok: true })
      await loadStatus()
    } catch { setMsg({ text: 'Sync failed', ok: false }) }
    finally { setSyncing(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {connected.length > 0 ? (
        <div>
          {connected.map((a) => (
            <div key={a.id} style={rowCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>🏦 {a.name}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                    {a.lastSyncedAt
                      ? `Last synced ${new Date(a.lastSyncedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : 'Not yet synced'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
          <p style={{ ...muted, marginTop: 4 }}>Transactions sync automatically every 15 minutes.</p>
          <button style={{ ...addBtn, marginTop: 8 }} onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing…' : '↻ Sync now'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ ...muted, marginBottom: 8 }}>
            Connect your Starling Bank account to automatically import transactions. You'll need a <strong>Personal Access Token</strong> from the Starling developer portal.
          </p>
          <input
            type="password"
            placeholder="Personal Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ ...inp, display: 'block', width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
          />
          <button style={saveBtn} disabled={connecting || !token.trim()} onClick={handleConnect}>
            {connecting ? 'Connecting…' : 'Connect Starling'}
          </button>
        </div>
      )}
      {msg && (
        <p style={{ fontSize: 13, marginTop: 8, color: msg.ok ? '#10b981' : '#ef4444' }}>{msg.text}</p>
      )}
    </div>
  )
}

// ─── CSV Import ───────────────────────────────────────────────────────────────
const CSV_FIELD_OPTIONS = ['date', 'amount', 'description', 'merchant', 'skip'] as const
type CsvField = typeof CSV_FIELD_OPTIONS[number]

function CsvImportSection({ accounts, api }: { accounts: Account[]; api: HabitsApi }) {
  const [accountId, setAccountId] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CsvField[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ inserted: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCsvRows(ev.target?.result as string)
      if (parsed.length < 2) { setError('CSV must have a header row and at least one data row'); return }
      const [header, ...data] = parsed
      setHeaders(header)
      setRows(data)
      // Auto-map common column names
      setMapping(header.map((h) => {
        const l = h.toLowerCase()
        if (l.includes('date')) return 'date'
        if (l.includes('amount') || l.includes('value') || l.includes('debit') || l.includes('credit')) return 'amount'
        if (l.includes('merchant') || l.includes('payee') || l.includes('beneficiary')) return 'merchant'
        if (l.includes('desc') || l.includes('reference') || l.includes('memo') || l.includes('narration') || l.includes('detail')) return 'description'
        return 'skip'
      }))
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!accountId) { setError('Please select an account first'); return }
    const dateIdx = mapping.indexOf('date')
    const amountIdx = mapping.indexOf('amount')
    const descIdx = mapping.indexOf('description')
    const merchantIdx = mapping.indexOf('merchant')
    if (dateIdx === -1 || amountIdx === -1 || descIdx === -1) {
      setError('Please map date, amount, and description columns before importing'); return
    }
    setImporting(true); setError('')
    try {
      const transactions = rows
        .map((row) => ({
          date: row[dateIdx] ?? '',
          amount: row[amountIdx] ?? '0',
          description: row[descIdx] ?? '',
          merchant: merchantIdx !== -1 ? (row[merchantIdx] ?? undefined) : undefined,
        }))
        .filter((r) => r.date && r.amount && r.amount !== '0')
      const res = await api.transactions.import(accountId, transactions)
      setResult(res)
      setHeaders([]); setRows([]); setMapping([])
      if (fileRef.current) fileRef.current.value = ''
    } catch { setError('Import failed') }
    finally { setImporting(false) }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p style={muted}>Upload a CSV exported from your bank to import multiple transactions at once. Merchants are auto-categorised based on your rules.</p>
      <div style={{ ...formRow, marginBottom: 12 }}>
        <select style={inp} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Select account…</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ fontSize: 13, flex: 1 }} />
      </div>

      {headers.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Map columns — {rows.length} rows detected
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {headers.map((h, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{h}</span>
                <select style={inpSm} value={mapping[i] ?? 'skip'} onChange={(e) => {
                  const next = [...mapping]; next[i] = e.target.value as CsvField; setMapping(next)
                }}>
                  {CSV_FIELD_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
                <span style={{ fontSize: 11, color: '#9ca3af', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  e.g. {rows[0]?.[i] ?? '—'}
                </span>
              </div>
            ))}
          </div>
          <button style={saveBtn} disabled={importing || !accountId} onClick={handleImport}>
            {importing ? 'Importing…' : `Import ${rows.length} rows`}
          </button>
        </div>
      )}

      {result && (
        <p style={{ fontSize: 13, color: '#10b981', marginTop: 10 }}>
          ✓ Imported {result.inserted} of {result.total} transactions
        </p>
      )}
      {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{error}</p>}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function LifestyleSettings() {
  const { apiBase } = useHabits()
  const api = createHabitsApi(apiBase)
  const [open, setOpen] = useState<string>('categories')
  const [habits, setHabits] = useState<Habit[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    const [h, r, a] = await Promise.all([
      api.habits.list(),
      api.rewards.list(),
      api.accounts.list(),
    ])
    setHabits(h.habits)
    setRewards(r.rewards)
    setAccounts(a.accounts)
  }

  useEffect(() => { reload().finally(() => setLoading(false)) }, [apiBase])

  const toggle = (s: string) => setOpen((cur) => (cur === s ? '' : s))

  if (loading) return <p style={muted}>Loading…</p>

  return (
    <div>
      <Accordion title="Categories & Budget" open={open === 'categories'} onToggle={() => toggle('categories')}>
        <CategoriesSection habits={habits} api={api} />
      </Accordion>
      <Accordion title="Habits & Limits" badge={habits.filter((h) => !h.archived).length} open={open === 'habits'} onToggle={() => toggle('habits')}>
        <HabitsSection habits={habits} onChanged={reload} api={api} />
      </Accordion>
      <Accordion title="Rewards" badge={rewards.length} open={open === 'rewards'} onToggle={() => toggle('rewards')}>
        <RewardsSection rewards={rewards} habits={habits} onChanged={reload} api={api} />
      </Accordion>
      <Accordion title="Starling Bank" open={open === 'starling'} onToggle={() => toggle('starling')}>
        <StarlingSection api={api} />
      </Accordion>
      <Accordion title="Import CSV" open={open === 'import'} onToggle={() => toggle('import')}>
        <CsvImportSection accounts={accounts} api={api} />
      </Accordion>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const muted: React.CSSProperties = { fontFamily: handFont, color: S.inkSoft, fontSize: 20, margin: 0, opacity: 0.6 }
const rowCard: React.CSSProperties = { background: S.paper, border: `1px dashed rgba(34,26,22,0.15)`, borderRadius: 4, padding: '10px 12px', marginBottom: 8, fontFamily: bodyFont }
const typeBadge: React.CSSProperties = { borderRadius: 999, padding: '2px 8px', fontFamily: monoFont, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const }
const smBtn: React.CSSProperties = { padding: '4px 10px', fontFamily: bodyFont, fontSize: 12, background: S.paperD, color: S.inkSoft, border: 'none', borderRadius: 999, cursor: 'pointer' }
const saveBtnSm: React.CSSProperties = { padding: '4px 10px', fontFamily: bodyFont, fontSize: 12, background: S.ink, color: S.paper, border: 'none', borderRadius: 999, cursor: 'pointer' }
const saveBtn: React.CSSProperties = { padding: '8px 18px', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, background: S.ink, color: S.paper, border: 'none', borderRadius: 999, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { padding: '8px 16px', fontFamily: bodyFont, fontSize: 13, background: 'transparent', color: S.inkSoft, border: `1.5px solid rgba(34,26,22,0.2)`, borderRadius: 999, cursor: 'pointer' }
const addBtn: React.CSSProperties = { padding: '7px 14px', fontFamily: bodyFont, fontSize: 13, fontWeight: 600, background: S.paperD, color: S.ink, border: 'none', borderRadius: 999, cursor: 'pointer' }
const formCard: React.CSSProperties = { background: S.paper, border: `1px dashed rgba(34,26,22,0.15)`, borderRadius: 4, padding: '14px 16px', marginTop: 10, fontFamily: bodyFont }
const formRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const inp: React.CSSProperties = { flex: 1, minWidth: 120, padding: '7px 10px', fontFamily: bodyFont, fontSize: 13, border: `1.5px solid rgba(34,26,22,0.2)`, borderRadius: 4, outline: 'none', background: '#fff', color: S.ink }
const inpSm: React.CSSProperties = { padding: '5px 8px', fontFamily: bodyFont, fontSize: 12, border: `1.5px solid rgba(34,26,22,0.2)`, borderRadius: 4, background: '#fff', minWidth: 80, color: S.ink }
