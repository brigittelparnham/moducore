import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createAccount, updateAccount, getAccounts, seedDefaultCategories } from '@moducore/db'
import { getDb } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { getStarlingAccounts, getStarlingBalance, syncStarlingAccount } from '../lib/starling'
import { encryptField, decryptField } from '../lib/secrets'
import type { AppVariables } from '../types'

export const starlingRoutes = new Hono<{ Variables: AppVariables }>()

// Connect Starling account via Personal Access Token
starlingRoutes.post(
  '/connect',
  requireAuth,
  zValidator('json', z.object({
    accessToken: z.string().min(1),
  })),
  async (c) => {
    const db = getDb()
    const tenant = c.get('tenant')!
    const { accessToken } = c.req.valid('json')

    // Validate token by fetching accounts
    let starlingAccounts
    try {
      starlingAccounts = await getStarlingAccounts(accessToken)
    } catch {
      return c.json({ error: 'Invalid Starling token or API error' }, 400)
    }

    if (!starlingAccounts.length) {
      return c.json({ error: 'No accounts found on this token' }, 400)
    }

    // Create or update moducore accounts for each Starling account
    const existingAccounts = await getAccounts(db, tenant.id)
    const created = []

    for (const sa of starlingAccounts) {
      const existing = existingAccounts.find((a) => a.starlingAccountUid === sa.accountUid)
      if (existing) {
        await updateAccount(db, tenant.id, existing.id, { starlingAccessToken: encryptField(accessToken) })
        created.push({ ...existing, updated: true })
        continue
      }

      // Get current balance to set as starting balance
      let startingBalance = '0'
      try {
        const bal = await getStarlingBalance(accessToken, sa.accountUid)
        startingBalance = String(bal.effectiveBalance.minorUnits / 100)
      } catch (e) {
        console.warn(`[starling] Failed to fetch starting balance for account ${sa.accountUid}:`, e instanceof Error ? e.message : e)
      }

      const account = await createAccount(db, tenant.id, {
        name: sa.name || 'Starling',
        type: sa.accountType === 'SAVINGS' ? 'savings' : 'current',
        currency: sa.currency,
        startingBalance,
        startingBalanceDate: new Date().toISOString().slice(0, 10),
        color: '#7b5ea7', // Starling purple
        provider: 'starling',
        starlingAccountUid: sa.accountUid,
        starlingAccessToken: encryptField(accessToken),
      })
      created.push(account)
    }

    await seedDefaultCategories(db, tenant.id)

    // Kick off first sync
    const syncResults = []
    for (const acc of created) {
      if ('starlingAccountUid' in acc && acc.starlingAccountUid && acc.starlingAccessToken) {
        try {
          const result = await syncStarlingAccount(
            db, tenant.id, acc.id, accessToken, acc.starlingAccountUid
          )
          syncResults.push({ accountId: acc.id, ...result })
        } catch (e) {
          console.warn(`[starling] Initial sync failed for account ${acc.id}:`, e instanceof Error ? e.message : e)
        }
      }
    }

    return c.json({ accounts: created, synced: syncResults })
  }
)

// Manual sync trigger
starlingRoutes.post('/sync', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const accounts = await getAccounts(db, tenant.id)
  const starlingAccounts = accounts.filter(
    (a) => a.provider === 'starling' && a.starlingAccountUid && a.starlingAccessToken
  )

  const results = await Promise.allSettled(
    starlingAccounts.map((a) =>
      syncStarlingAccount(db, tenant.id, a.id, decryptField(a.starlingAccessToken!), a.starlingAccountUid!)
        .then((r) => ({ accountId: a.id, name: a.name, ...r }))
    )
  )

  const synced = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<{ accountId: string; name: string; synced: number }>).value)
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message ?? 'Unknown error')

  return c.json({ synced, errors })
})

// Status check
starlingRoutes.get('/status', requireAuth, async (c) => {
  const db = getDb()
  const tenant = c.get('tenant')!
  const accounts = await getAccounts(db, tenant.id)
  const starlingAccounts = accounts
    .filter((a) => a.provider === 'starling')
    .map((a) => ({
      id: a.id,
      name: a.name,
      lastSyncedAt: a.starlingLastSyncedAt,
      connected: !!a.starlingAccessToken,
    }))
  return c.json({ accounts: starlingAccounts })
})
