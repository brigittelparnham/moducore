export type JournalEntry = {
  id: string
  tenantId: string
  title: string | null
  content: Record<string, unknown>
  tags: string[]
  status: 'draft' | 'published' | 'private'
  publishedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
