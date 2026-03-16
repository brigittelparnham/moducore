import { eq } from 'drizzle-orm'
import type { DbClient } from '../client'
import { users, type NewUser, type User } from '../schema'

export async function getUserById(db: DbClient, id: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: (u, { eq, isNull, and }) => and(eq(u.id, id), isNull(u.deletedAt)),
  })
}

export async function getUserByEmail(db: DbClient, email: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: (u, { eq, isNull, and }) => and(eq(u.email, email.toLowerCase()), isNull(u.deletedAt)),
  })
}

export async function createUser(db: DbClient, data: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ ...data, email: data.email.toLowerCase() })
    .returning()
  return user
}

export async function deleteUser(db: DbClient, id: string): Promise<void> {
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id))
}

export async function updateUserPassword(db: DbClient, id: string, passwordHash: string): Promise<void> {
  await db
    .update(users)
    .set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null, updatedAt: new Date() })
    .where(eq(users.id, id))
}

export async function setPasswordResetToken(
  db: DbClient,
  id: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  await db
    .update(users)
    .set({ passwordResetToken: token, passwordResetExpiresAt: expiresAt, updatedAt: new Date() })
    .where(eq(users.id, id))
}

export async function getUserByResetToken(db: DbClient, token: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: (u, { eq, isNull, and, gt }) =>
      and(
        eq(u.passwordResetToken, token),
        isNull(u.deletedAt),
        gt(u.passwordResetExpiresAt, new Date())
      ),
  })
}
