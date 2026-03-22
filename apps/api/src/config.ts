/**
 * Central configuration constants for the moducore API.
 *
 * All tuneable values live here — never scattered as magic numbers across
 * route files.  Override any value via environment variables; the defaults
 * are sensible for local development and conservative for production.
 */

// ─── Auth & sessions ──────────────────────────────────────────────────────────

/** How long a login session stays valid (rolling cookie max-age). */
export const SESSION_DURATION_DAYS =
  Number(process.env.SESSION_DURATION_DAYS) || 30

/** How long a password-reset token is valid after being issued. */
export const PASSWORD_RESET_EXPIRY_MS =
  Number(process.env.PASSWORD_RESET_EXPIRY_MS) || 60 * 60 * 1000 // 1 hour

// ─── Rate limiting ────────────────────────────────────────────────────────────

/** Window for login / forgot-password / reset-password rate limiting. */
export const AUTH_RATE_LIMIT_WINDOW_MS =
  Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000 // 15 minutes

/** Max login / password-reset attempts per window per IP. */
export const AUTH_RATE_LIMIT_MAX =
  Number(process.env.AUTH_RATE_LIMIT_MAX) || 10

/** Window for signup rate limiting. */
export const SIGNUP_RATE_LIMIT_WINDOW_MS =
  Number(process.env.SIGNUP_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000 // 1 hour

/** Max signups per window per IP. */
export const SIGNUP_RATE_LIMIT_MAX =
  Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 5

// ─── Media uploads ────────────────────────────────────────────────────────────

/** Maximum file size accepted by the media upload endpoint. */
export const UPLOAD_MAX_BYTES =
  Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024 // 10 MB

// ─── Scheduler ────────────────────────────────────────────────────────────────

/** How often the main sync job runs (connectors, Spotify, Starling). */
export const SCHEDULER_INTERVAL_MS =
  Number(process.env.SCHEDULER_INTERVAL_MS) || 15 * 60 * 1000 // 15 minutes

/** How often the journey-detection job runs. */
export const JOURNEY_INTERVAL_MS =
  Number(process.env.JOURNEY_INTERVAL_MS) || 5 * 60 * 1000 // 5 minutes

/** How often expired sessions are purged from the database. */
export const SESSION_CLEANUP_INTERVAL_MS =
  Number(process.env.SESSION_CLEANUP_INTERVAL_MS) || 24 * 60 * 60 * 1000 // 24 hours
