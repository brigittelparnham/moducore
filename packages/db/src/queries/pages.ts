import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../client'
import { pages, type Page, type NewPage } from '../schema'

export async function getPagesByTenant(db: DbClient, tenantId: string): Promise<Page[]> {
  return db.query.pages.findMany({
    where: (p, { eq, isNull, and }) => and(eq(p.tenantId, tenantId), isNull(p.deletedAt)),
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  })
}

export async function getPageById(
  db: DbClient,
  tenantId: string,
  id: string
): Promise<Page | undefined> {
  return db.query.pages.findFirst({
    where: (p, { eq, isNull, and }) =>
      and(eq(p.tenantId, tenantId), eq(p.id, id), isNull(p.deletedAt)),
  })
}

export async function getPublishedPageBySlug(
  db: DbClient,
  tenantId: string,
  slug: string
): Promise<Page | undefined> {
  return db.query.pages.findFirst({
    where: (p, { eq, isNull, and }) =>
      and(
        eq(p.tenantId, tenantId),
        eq(p.slug, slug),
        eq(p.status, 'published'),
        isNull(p.deletedAt)
      ),
  })
}

export async function isPageSlugAvailable(
  db: DbClient,
  tenantId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await db.query.pages.findFirst({
    where: (p, { eq, ne, isNull, and }) => {
      const conditions = [eq(p.tenantId, tenantId), eq(p.slug, slug), isNull(p.deletedAt)]
      if (excludeId) conditions.push(ne(p.id, excludeId))
      return and(...(conditions as [typeof conditions[0], ...typeof conditions]))
    },
    columns: { id: true },
  })
  return existing === undefined
}

export async function createPage(
  db: DbClient,
  data: Pick<NewPage, 'tenantId' | 'title' | 'slug' | 'content' | 'createdBy'>
): Promise<Page> {
  const [page] = await db.insert(pages).values(data).returning()
  return page
}

export async function updatePage(
  db: DbClient,
  tenantId: string,
  id: string,
  data: Partial<Pick<Page, 'title' | 'slug' | 'content'>>
): Promise<Page | undefined> {
  const [updated] = await db
    .update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(pages.tenantId, tenantId), eq(pages.id, id)))
    .returning()
  return updated
}

export async function publishPage(db: DbClient, tenantId: string, id: string): Promise<Page | undefined> {
  const [updated] = await db
    .update(pages)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(pages.tenantId, tenantId), eq(pages.id, id)))
    .returning()
  return updated
}

export async function unpublishPage(db: DbClient, tenantId: string, id: string): Promise<Page | undefined> {
  const [updated] = await db
    .update(pages)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(and(eq(pages.tenantId, tenantId), eq(pages.id, id)))
    .returning()
  return updated
}

export async function deletePage(db: DbClient, tenantId: string, id: string): Promise<void> {
  await db
    .update(pages)
    .set({ deletedAt: new Date() })
    .where(and(eq(pages.tenantId, tenantId), eq(pages.id, id)))
}
