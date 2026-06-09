import type {
  Habit, HabitLog, Reward, StreakInfo,
  Account, Category, Transaction, BudgetLine,
} from './types'

export function createHabitsApi(apiBase: string) {
  const get = (path: string) =>
    fetch(`${apiBase}${path}`, { credentials: 'include' }).then((r) => r.json())

  const post = (path: string, body?: unknown) =>
    fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => r.json())

  const patch = (path: string, body: unknown) =>
    fetch(`${apiBase}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then((r) => r.json())

  const put = (path: string, body: unknown) =>
    fetch(`${apiBase}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then((r) => r.json())

  const del = (path: string) =>
    fetch(`${apiBase}${path}`, { method: 'DELETE', credentials: 'include' }).then((r) => r.json())

  return {
    habits: {
      list: (): Promise<{ habits: Habit[] }> => get('/habits'),
      get: (id: string): Promise<{ habit: Habit }> => get(`/habits/${id}`),
      create: (data: Partial<Habit>): Promise<{ habit: Habit }> => post('/habits', data),
      update: (id: string, data: Partial<Habit>): Promise<{ habit: Habit }> =>
        patch(`/habits/${id}`, data),
      delete: (id: string) => del(`/habits/${id}`),
      setTarget: (id: string, freq: string, targetValue: string, targetType: string) =>
        put(`/habits/${id}/targets/${freq}`, { targetValue, targetType }),
      removeTarget: (id: string, freq: string) => del(`/habits/${id}/targets/${freq}`),
      log: (
        id: string,
        data: { value?: string; loggedAt?: string; notes?: string }
      ): Promise<{ log: HabitLog; pointsEarned: number; rewardsUnlocked: string[] }> =>
        post(`/habits/${id}/log`, data),
      logs: (id: string, limit = 50): Promise<{ logs: HabitLog[] }> =>
        get(`/habits/${id}/logs?limit=${limit}`),
      streaks: (): Promise<{ streaks: StreakInfo[] }> => get('/habits/streaks'),
    },
    rewards: {
      list: (): Promise<{ rewards: Reward[]; points: number }> => get('/habits/rewards'),
      create: (data: Partial<Reward>): Promise<{ reward: Reward }> =>
        post('/habits/rewards', data),
      redeem: (id: string): Promise<{ reward: Reward }> =>
        post(`/habits/rewards/${id}/redeem`),
    },
    points: {
      get: (): Promise<{ total: number; ledger: Array<{ delta: number; reason: string; createdAt: string }> }> =>
        get('/habits/points'),
    },
    accounts: {
      list: (): Promise<{ accounts: Account[] }> => get('/finance/accounts'),
      get: (id: string): Promise<{ account: Account; balance: number }> =>
        get(`/finance/accounts/${id}`),
      create: (data: Partial<Account>): Promise<{ account: Account }> =>
        post('/finance/accounts', data),
      update: (id: string, data: Partial<Account>): Promise<{ account: Account }> =>
        patch(`/finance/accounts/${id}`, data),
    },
    transactions: {
      list: (opts: { accountId?: string; from?: string; to?: string; limit?: number; offset?: number } = {}): Promise<{ transactions: Transaction[] }> => {
        const params = new URLSearchParams()
        if (opts.from) params.set('from', opts.from)
        if (opts.to) params.set('to', opts.to)
        if (opts.limit) params.set('limit', String(opts.limit))
        if (opts.offset) params.set('offset', String(opts.offset))
        const path = opts.accountId
          ? `/finance/accounts/${opts.accountId}/transactions?${params}`
          : `/finance/transactions?${params}`
        return get(path)
      },
      create: (
        accountId: string,
        data: { amount: string; description: string; merchant?: string; categoryId?: string; date: string; notes?: string }
      ): Promise<{ transaction: Transaction }> =>
        post(`/finance/accounts/${accountId}/transactions`, data),
      update: (id: string, data: Partial<Transaction>): Promise<{ transaction: Transaction }> =>
        patch(`/finance/transactions/${id}`, data),
      import: (
        accountId: string,
        rows: Array<{ amount: string; description: string; merchant?: string; categoryId?: string; date: string; externalId?: string }>
      ): Promise<{ inserted: number; total: number }> =>
        post(`/finance/accounts/${accountId}/import`, { transactions: rows }),
    },
    categories: {
      list: (): Promise<{ categories: Category[] }> => get('/finance/categories'),
      create: (data: Partial<Category>): Promise<{ category: Category }> =>
        post('/finance/categories', data),
      update: (id: string, data: Partial<Category>): Promise<{ category: Category }> =>
        patch(`/finance/categories/${id}`, data),
      delete: (id: string) => del(`/finance/categories/${id}`),
    },
    budget: {
      get: (period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{ budget: BudgetLine[]; period: string; from: string; to: string }> =>
        get(`/finance/budget?period=${period}`),
      set: (categoryId: string, period: string, limitAmount: string) =>
        put('/finance/budget', { categoryId, period, limitAmount }),
      delete: (id: string) => del(`/finance/budget/${id}`),
    },
    starling: {
      status: (): Promise<{ accounts: Array<{ id: string; name: string; lastSyncedAt: string | null; connected: boolean }> }> =>
        get('/starling/status'),
      connect: (accessToken: string) => post('/starling/connect', { accessToken }),
      sync: () => post('/starling/sync'),
    },
  }
}
