import { eq, lt } from 'drizzle-orm'
import type { DbClient } from '../client'
import { sessions, type NewSession, type Session } from '../schema'

export async function createSession(db: DbClient, data: NewSession): Promise<Session> {
  const [session] = await db.insert(sessions).values(data).returning()
  return session
}

/**
 * Returns the session only if it exists AND has not expired.
 * Filtering at the DB level avoids an extra round-trip for stale tokens.
 */
export async function getSessionByToken(db: DbClient, token: string): Promise<Session | undefined> {
  return db.query.sessions.findFirst({
    where: (s, { eq, and, gt }) => and(eq(s.token, token), gt(s.expiresAt, new Date())),
  })
}

export async function deleteSession(db: DbClient, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token))
}

export async function deleteUserSessions(db: DbClient, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

export async function deleteExpiredSessions(db: DbClient): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
}

export function isSessionValid(session: Session): boolean {
  return session.expiresAt > new Date()
}
