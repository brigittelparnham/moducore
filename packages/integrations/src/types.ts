import { z } from 'zod'

export type ConnectorConfig = Record<string, string>

export type ConnectorResult<T = unknown> = {
  data: T
  fetchedAt: Date
  connectorId: string
}

// Every connector adapter implements this interface
// Named ConnectorAdapter to avoid collision with the DB Connector row type
export type ConnectorAdapter<TConfig extends ConnectorConfig = ConnectorConfig, TData = unknown> = {
  type: string
  configSchema: z.ZodSchema<TConfig>
  fetch: (config: TConfig) => Promise<TData>
}
