import { createClient, type DbClient } from '@moducore/db'

let client: DbClient | null = null

export function getDb(): DbClient {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    client = createClient(url)
  }
  return client
}
