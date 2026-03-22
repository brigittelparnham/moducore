/**
 * Converts a DB row type (which may have Date fields) to the JSON-serialized
 * shape that arrives at the frontend after `JSON.parse(JSON.stringify(...))`.
 *
 * Usage:
 *   type SerializedPage = Serialized<Page>   // Date → string
 *
 * Use this instead of `as unknown as Page` casts in API response handlers
 * so the compiler knows dates have been stringified.
 */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
    ? string | null
    : T[K] extends Date | undefined
    ? string | undefined
    : T[K] extends object
    ? Serialized<T[K]>
    : T[K]
}

export type AppSlug = 'cms' | 'journal'

export type UserRole = 'owner' | 'admin' | 'member'

export type ContentStatus = 'draft' | 'published'

export type TenantContext = {
  tenantId: string
  userId: string
  role: UserRole
}
