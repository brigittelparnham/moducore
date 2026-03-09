import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../client'
import { journalEntries, type JournalEntry, type NewJournalEntry } from '../schema'

export async function getJournalEntriesByTenant(
  db: DbClient,
  tenantId: string
): Promise<JournalEntry[]> {
  return db.query.journalEntries.findMany({
    where: (e, { eq, isNull, and }) => and(eq(e.tenantId, tenantId), isNull(e.deletedAt)),
    orderBy: (e, { desc }) => [desc(e.updatedAt)],
  })
}

export async function getJournalEntryById(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<JournalEntry | undefined> {
  return db.query.journalEntries.findFirst({
    where: (e, { eq, isNull, and }) =>
      and(eq(e.tenantId, tenantId), eq(e.id, id), isNull(e.deletedAt)),
  })
}

export async function createJournalEntry(
  db: DbClient,
  data: Pick<NewJournalEntry, 'tenantId' | 'title' | 'content' | 'tags' | 'createdBy'>
): Promise<JournalEntry> {
  const [entry] = await db.insert(journalEntries).values(data).returning()
  return entry
}

export async function updateJournalEntry(
  db: DbClient,
  tenantId: string,
  id: string,
  data: Partial<Pick<JournalEntry, 'title' | 'content' | 'tags'>>
): Promise<JournalEntry | undefined> {
  const [updated] = await db
    .update(journalEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, id)))
    .returning()
  return updated
}

export async function publishJournalEntry(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<JournalEntry | undefined> {
  const [updated] = await db
    .update(journalEntries)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, id)))
    .returning()
  return updated
}

export async function unpublishJournalEntry(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<JournalEntry | undefined> {
  const [updated] = await db
    .update(journalEntries)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, id)))
    .returning()
  return updated
}

export async function deleteJournalEntry(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<void> {
  await db
    .update(journalEntries)
    .set({ deletedAt: new Date() })
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.id, id)))
}
