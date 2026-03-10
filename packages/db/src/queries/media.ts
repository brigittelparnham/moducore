import { eq, and, isNull } from 'drizzle-orm'
import type { DbClient } from '../client'
import { media, type Media, type NewMedia } from '../schema'

export async function getMediaByTenant(db: DbClient, tenantId: string): Promise<Media[]> {
  return db.query.media.findMany({
    where: (m, { eq, isNull, and }) => and(eq(m.tenantId, tenantId), isNull(m.deletedAt)),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  })
}

export async function getMediaById(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<Media | undefined> {
  return db.query.media.findFirst({
    where: (m, { eq, isNull, and }) =>
      and(eq(m.tenantId, tenantId), eq(m.id, id), isNull(m.deletedAt)),
  })
}

export async function createMediaRecord(
  db: DbClient,
  data: Pick<NewMedia, 'tenantId' | 'filename' | 'url' | 'mimeType' | 'sizeBytes' | 'uploadedBy'>
): Promise<Media> {
  const [record] = await db.insert(media).values(data).returning()
  return record
}

export async function deleteMediaRecord(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<void> {
  await db
    .update(media)
    .set({ deletedAt: new Date() })
    .where(and(eq(media.tenantId, tenantId), eq(media.id, id), isNull(media.deletedAt)))
}
