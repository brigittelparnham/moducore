/**
 * Application-layer field encryption wrappers.
 *
 * Reads ENCRYPTION_KEY from the environment and delegates to the core
 * AES-256-GCM helpers. All routes and the scheduler should use these
 * functions rather than calling the core helpers directly.
 *
 * If ENCRYPTION_KEY is not set the helpers throw immediately — startup
 * validation (env.ts) should catch this before any request is served.
 */

import { encrypt, decrypt, encryptJson, decryptJson } from './aes'

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY is not set')
  return key
}

/** Encrypt a single string field (e.g. an API token). */
export function encryptField(plaintext: string): string {
  return encrypt(plaintext, getKey())
}

/**
 * Decrypt a single string field.
 * Safe to call on already-plaintext values — passthrough if not encrypted.
 */
export function decryptField(value: string): string {
  return decrypt(value, getKey())
}

/**
 * Encrypt a config object for JSONB storage.
 * Returns { _enc: "enc:…" }.
 */
export function encryptConfig(obj: unknown): { _enc: string } {
  return encryptJson(obj, getKey())
}

/**
 * Decrypt a config object read from JSONB.
 * Safe to call on already-plaintext objects — passthrough if not encrypted.
 */
export function decryptConfig(obj: unknown): unknown {
  return decryptJson(obj, getKey())
}
