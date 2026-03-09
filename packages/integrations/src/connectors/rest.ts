import { z } from 'zod'
import type { ConnectorAdapter } from '../types'

export type RestConfig = {
  url: string
  headers?: string // JSON string of key-value headers, e.g. '{"Authorization":"Bearer xxx"}'
}

export const restConnector: ConnectorAdapter<RestConfig, unknown> = {
  type: 'rest',
  configSchema: z.object({
    url: z.string().url('Must be a valid URL'),
    headers: z.string().optional(),
  }),
  async fetch(config) {
    let headers: Record<string, string> = {}
    if (config.headers) {
      try {
        headers = JSON.parse(config.headers)
      } catch {
        throw new Error('headers must be valid JSON')
      }
    }
    const res = await fetch(config.url, { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${config.url}`)
    return res.json()
  },
}
