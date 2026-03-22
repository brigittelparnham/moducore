/**
 * Standard API response types and helpers.
 *
 * Error shape:   { error: { code: string; message: string } }
 * Success shape: { <resourceName>: T }  (resource-named, standard REST practice)
 * List shape:    { <resourceName>: T[] }
 * Simple OK:     { ok: true }
 *
 * All route files should use the apiError() helper so errors are structured
 * consistently and the frontend can always access error.code for programmatic
 * handling and error.message for display.
 */

// ─── Error ────────────────────────────────────────────────────────────────────

export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

/**
 * Returns a structured error body.
 *
 * Usage in a Hono route:
 *   return c.json(apiError('NOT_FOUND', 'Entry not found'), 404)
 */
export function apiError(code: string, message: string): ApiErrorBody {
  return { error: { code, message } }
}

// ─── Common error codes ───────────────────────────────────────────────────────

export const ApiErrors = {
  NOT_FOUND:        (resource = 'Resource') => apiError('NOT_FOUND',        `${resource} not found`),
  UNAUTHORIZED:                             () => apiError('UNAUTHORIZED',   'Authentication required'),
  FORBIDDEN:        (msg?: string)          => apiError('FORBIDDEN',         msg ?? 'You do not have permission to perform this action'),
  BAD_REQUEST:      (msg: string)           => apiError('BAD_REQUEST',       msg),
  CONFLICT:         (msg: string)           => apiError('CONFLICT',          msg),
  INTERNAL:                                 () => apiError('INTERNAL_ERROR', 'An unexpected error occurred'),
} as const
