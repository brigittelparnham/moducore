/**
 * Environment variable validation.
 *
 * Validates all required and optional env vars at startup using Zod.
 * If any required variable is missing the process exits immediately with
 * a clear error listing every missing variable — before any port is opened
 * or DB connection attempted.
 *
 * Import this module once, at the very top of index.ts, before anything else.
 */

import { z } from 'zod'

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),

  // Encryption (AES-256-GCM key, 32 bytes base64)
  // Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().optional().default('moducore <noreply@moducore.io>'),

  // Webhooks (secret-gated public endpoints)
  HABITS_HEALTH_SECRET: z.string().min(1, 'HABITS_HEALTH_SECRET is required'),
  LOCATION_INGEST_SECRET: z.string().min(1, 'LOCATION_INGEST_SECRET is required'),

  // Optional third-party integrations
  TFL_APP_KEY: z.string().optional(),
  SPOTIFY_APP_URL: z.string().url().optional().default('http://localhost:3003'),

  // App URLs (used for CORS)
  CMS_URL: z.string().url().optional().default('http://localhost:3001'),
  JOURNAL_URL: z.string().url().optional().default('http://localhost:3002'),
  MAPS_APP_URL: z.string().url().optional().default('http://localhost:3004'),
  HABITS_APP_URL: z.string().url().optional().default('http://localhost:3005'),

  // Node runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
})

const result = EnvSchema.safeParse(process.env)

if (!result.success) {
  const missing = result.error.errors
    .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
    .join('\n')
  console.error(
    `\n[env] ❌ Missing or invalid environment variables:\n${missing}\n\n` +
    `Copy apps/api/.env.example to apps/api/.env and fill in the required values.\n`
  )
  process.exit(1)
}

export const env = result.data
