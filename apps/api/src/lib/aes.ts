/**
 * AES-256-GCM field-level encryption helpers.
 *
 * Usage:
 *   const encrypted = encrypt('my-secret', process.env.ENCRYPTION_KEY!)
 *   const plaintext = decrypt(encrypted, process.env.ENCRYPTION_KEY!)
 *
 * Encrypted values have the format:  enc:<iv_b64>:<authTag_b64>:<ciphertext_b64>
 * If a value does NOT start with "enc:", decrypt() returns it unchanged — this
 * gives safe backwards compatibility for rows written before encryption was added.
 *
 * Key: 32 random bytes, base64-encoded. Generate with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12   // 96-bit IV recommended for GCM
const TAG_BYTES = 16  // 128-bit auth tag (GCM default)
const ENC_PREFIX = 'enc:'

function parseKey(rawKey: string): Buffer {
  const key = Buffer.from(rawKey, 'base64')
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes base64-encoded (got ${key.length} bytes). ` +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }
  return key
}

/** Encrypt a plaintext string. Returns an "enc:…" tagged ciphertext. */
export function encrypt(plaintext: string, rawKey: string): string {
  const key = parseKey(rawKey)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${ENC_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypt an "enc:…" ciphertext back to plaintext.
 * If value does not start with "enc:", it is returned as-is (backwards compatibility).
 */
export function decrypt(value: string, rawKey: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value  // not encrypted — safe passthrough
  const rest = value.slice(ENC_PREFIX.length)
  const parts = rest.split(':')
  if (parts.length !== 3) throw new Error('Malformed encrypted value')
  const [ivB64, authTagB64, ciphertextB64] = parts
  const key = parseKey(rawKey)
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Encrypt a JSON-serialisable object for storage in a JSONB column.
 * Stored as: { _enc: "enc:…" }
 * Reading back: call decryptJson() — returns the original object.
 */
export function encryptJson(obj: unknown, rawKey: string): { _enc: string } {
  return { _enc: encrypt(JSON.stringify(obj), rawKey) }
}

/**
 * Decrypt a value that may have been stored by encryptJson().
 * If the object has a { _enc: "enc:…" } shape, decrypt and parse.
 * Otherwise return the value unchanged (backwards compatibility).
 */
export function decryptJson(obj: unknown, rawKey: string): unknown {
  if (
    obj !== null &&
    typeof obj === 'object' &&
    '_enc' in (obj as object) &&
    typeof (obj as Record<string, unknown>)['_enc'] === 'string'
  ) {
    const enc = (obj as Record<string, unknown>)['_enc'] as string
    return JSON.parse(decrypt(enc, rawKey))
  }
  return obj  // not encrypted — safe passthrough
}
