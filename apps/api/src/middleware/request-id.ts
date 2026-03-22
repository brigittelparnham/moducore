/**
 * Request ID middleware.
 *
 * Generates a unique `x-request-id` for every incoming request, sets it as
 * a response header, and stores it on Hono context so route handlers and
 * logger calls can correlate logs back to a single request.
 *
 * If the client already sends an `x-request-id` header (e.g. from a reverse
 * proxy), that value is forwarded unchanged. This lets you trace a request
 * from client → proxy → API in a single hop.
 */

import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'crypto'
import type { AppVariables } from '../types'

export const requestIdMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? randomUUID()
    c.set('requestId', requestId)
    c.header('x-request-id', requestId)
    await next()
  }
)
