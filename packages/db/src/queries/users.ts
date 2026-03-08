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
