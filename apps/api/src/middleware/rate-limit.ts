/**
 * Rate-limiting middleware for sensitive auth endpoints.
 *
 * Uses an in-memory store (suitable for single-process deployments).
 * For multi-instance production deployments, swap the store for Redis.
 *
 * Key is the client IP, falling back to a catch-all so the limiter
 * always fires even behind a proxy that strips headers.
 */

import { rateLimiter } from 'hono-rate-limiter'
import {
  AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX,
  SIGNUP_RATE_LIMIT_WINDOW_MS, SIGNUP_RATE_LIMIT_MAX,
} from '../config'

function ipKey(c: Parameters<typeof rateLimiter>[0]['keyGenerator'] extends (c: infer C) => unknown ? C : never): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

/**
 * Login and password-reset: 10 attempts per 15 minutes per IP.
 * Aggressive enough to block brute force, forgiving enough for fat fingers.
 */
export const authLimiter = rateLimiter({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-6',
  keyGenerator: ipKey,
})

/**
 * Signup: 5 accounts per hour per IP.
 * Prevents mass account creation while allowing normal usage.
 */
export const signupLimiter = rateLimiter({
  windowMs: SIGNUP_RATE_LIMIT_WINDOW_MS,
  limit: SIGNUP_RATE_LIMIT_MAX,
  standardHeaders: 'draft-6',
  keyGenerator: ipKey,
})
