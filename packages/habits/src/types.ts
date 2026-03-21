export type HabitTarget = {
  id: string
  habitId: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  targetValue: string
  targetType: 'min' | 'max'
}

export type Habit = {
  id: string
  tenantId: string
  name: string
  icon: string | null
  color: string | null
  unit: string
  unitLabel: string | null
  type: 'habit' | 'limit'
  pointsPerLog: string | null
  notes: string | null
  archived: boolean
  createdAt: string
  updatedAt: string
  targets?: HabitTarget[]
}

export type HabitLog = {
  id: string
  habitId: string
  tenantId: string
  value: string
  loggedAt: string
  source: string
  notes: string | null
  createdAt: string
}

export type Reward = {
  id: string
  tenantId: string
  name: string
  description: string | null
  monetaryValue: string | null
  rewardType: 'unlock' | 'points_spend'
  pointsCost: number | null
  conditionHabitId: string | null
  conditionFrequency: string | null
  earnedAt: string | null
  redeemedAt: string | null
  createdAt: string
}

export type StreakInfo = {
  habitId: string
  habitName: string
  frequency: string
  current: number
  best: number
}

export type Account = {
  id: string
  tenantId: string
  name: string
  type: string
  currency: string
  startingBalance: string
  startingBalanceDate: string
  color: string | null
  provider: 'manual' | 'starling'
  starlingAccountUid: string | null
  starlingLastSyncedAt: string | null
  archived: boolean
  createdAt: string
}

export type Category = {
  id: string
  tenantId: string
  name: string
  icon: string | null
  color: string | null
  type: 'income' | 'expense' | 'transfer'
  linkedHabitId: string | null
  isSystem: boolean
  createdAt: string
}

export type Transaction = {
  id: string
  accountId: string
  tenantId: string
  amount: string
  description: string
  merchant: string | null
  categoryId: string | null
  categoryConfirmed: boolean
  date: string
  notes: string | null
  source: string
  externalId: string | null
  createdAt: string
  category?: Category | null
}

export type BudgetRule = {
  id: string
  tenantId: string
  categoryId: string
  period: 'weekly' | 'monthly' | 'yearly'
  limitAmount: string
  createdAt: string
  category?: Category | null
}

export type BudgetLine = BudgetRule & {
  spent: number
  remaining: number
}
