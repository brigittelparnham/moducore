import { z } from 'zod'

export type ConnectorConfig = Record<string, string>

export type ConnectorResult<T = unknown> = {
  data: T
  fetchedAt: Date
  connectorId: string
}

// Every connector implements this interface
export type Connector<TConfig extends ConnectorConfig = ConnectorConfig, TData = unknown> = {
  type: string
  configSchema: z.ZodSchema<TConfig>
  fetch: (config: TConfig) => Promise<TData>
}
