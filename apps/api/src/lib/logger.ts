/**
 * Structured logger for the moducore API.
 *
 * - Development: pretty-printed, colourised output via pino-pretty
 * - Production:  newline-delimited JSON — pipe to any log aggregator
 *
 * Usage:
 *   import { logger } from './lib/logger'
 *   logger.info({ tenantId }, 'Page created')
 *   logger.warn({ err }, 'External API validation failed')
 *   logger.error({ err, requestId }, 'Unhandled route error')
 */

import pino from 'pino'

const isDev = (process.env.NODE_ENV ?? 'development') !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // pino-pretty is a dev-only transport — not installed in production images
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
})
