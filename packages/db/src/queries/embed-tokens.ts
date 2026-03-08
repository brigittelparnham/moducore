import { eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import { embedTokens, type EmbedToken, type NewEmbedToken } from '../schema'

export async function createEmbedToken(db: DbClient, data: NewEmbedToken): Promise<EmbedToken> {
  const [token] = await db.insert(embedTokens).values(data).returning()
  return token
}

export async function getEmbedTokenByToken(
  db: DbClient,
  token: string
): Promise<EmbedToken | undefined> {
  return db.query.embedTokens.findFirst({
    where: (et, { eq }) => eq(et.token, token),
  })
}

export async function getTenantEmbedTokens(
  db: DbClient,
  tenantId: string
): Promise<EmbedToken[]> {
  return db.query.embedTokens.findMany({
    where: (et, { eq, isNull, and }) => and(eq(et.tenantId, tenantId), isNull(et.revokedAt)),
  })
}

export async function revokeEmbedToken(db: DbClient, id: string): Promise<void> {
  await db
    .update(embedTokens)
    .set({ revokedAt: new Date() })
    .where(eq(embedTokens.id, id))
}

// Returns the token if valid (not revoked, not expired), otherwise undefined
export async function validateEmbedToken(
  db: DbClient,
  token: string
): Promise<EmbedToken | undefined> {
  const record = await getEmbedTokenByToken(db, token)
  if (!record) return undefined
  if (record.revokedAt) return undefined
  if (record.expiresAt && record.expiresAt < new Date()) return undefined
  return record
}
