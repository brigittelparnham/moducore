export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Extract a human-readable message from structured { error: { code, message } } or legacy { error: string } */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const err = (data as Record<string, unknown>).error
  if (!err) return fallback
  if (typeof err === 'string') return err                        // legacy format
  if (typeof err === 'object' && 'message' in err) return String((err as Record<string, unknown>).message)
  return fallback
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(extractErrorMessage(data, 'Request failed'))
  return data as T
}

// Multipart upload — browser sets Content-Type with boundary automatically
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(extractErrorMessage(data, 'Upload failed'))
  return data as T
}

export type Page = {
  id: string
  tenantId: string
  title: string
  slug: string
  content: Record<string, unknown>
  status: 'draft' | 'published'
  publishedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type Tenant = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro'
  createdAt: string
  updatedAt: string
}

export const api = {
  auth: {
    signup: (body: object) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    forgotPassword: (body: { email: string }) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body: { token: string; password: string }) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  },
  pages: {
    list: () => request<{ pages: Page[] }>('/pages'),
    get: (id: string) => request<{ page: Page }>(`/pages/${id}`),
    create: (body: { title: string; slug: string; content: Record<string, unknown>; style?: Record<string, unknown> }) =>
      request<{ page: Page }>('/pages', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: Partial<{ title: string; slug: string; content: Record<string, unknown>; style: Record<string, unknown> }>
    ) => request<{ page: Page }>(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    publish: (id: string) => request<{ page: Page }>(`/pages/${id}/publish`, { method: 'POST' }),
    unpublish: (id: string) =>
      request<{ page: Page }>(`/pages/${id}/unpublish`, { method: 'POST' }),
    delete: (id: string) => request<{ ok: boolean }>(`/pages/${id}`, { method: 'DELETE' }),
  },
  apps: {
    list: () => request<{ apps: AvailableApp[] }>('/apps'),
    install: (slug: string) => request<{ tenantApp: object }>(`/apps/${slug}/install`, { method: 'POST' }),
    uninstall: (slug: string) => request<{ ok: boolean }>(`/apps/${slug}/install`, { method: 'DELETE' }),
  },
  embedTokens: {
    list: () => request<{ tokens: EmbedToken[] }>('/embed-tokens'),
    create: (body: { name: string; appSlug?: string; write?: boolean; expiresAt?: string }) =>
      request<{ token: EmbedToken }>('/embed-tokens', { method: 'POST', body: JSON.stringify(body) }),
    revoke: (id: string) => request<{ ok: boolean }>(`/embed-tokens/${id}`, { method: 'DELETE' }),
  },
  connectors: {
    list: () => request<{ connectors: ConnectorRow[] }>('/connectors'),
    create: (body: { type: string; name: string; config: Record<string, string> }) =>
      request<{ connector: ConnectorRow }>('/connectors', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; config: Record<string, string>; enabled: boolean }>) =>
      request<{ connector: ConnectorRow }>(`/connectors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ ok: boolean }>(`/connectors/${id}`, { method: 'DELETE' }),
    sync: (id: string) => request<{ ok: boolean }>(`/connectors/${id}/sync`, { method: 'POST' }),
    getData: (id: string) => request<{ data: unknown; syncedAt: string | null }>(`/connectors/${id}/data`),
  },
  tenants: {
    getCurrent: () => request<{ tenant: Tenant }>('/tenants/current'),
    updateCurrent: (body: { name?: string; slug?: string }) =>
      request<{ tenant: Tenant }>('/tenants/current', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  spotify: {
    status: () => request<SpotifyStatus>('/spotify/status'),
    saveCredentials: (body: { clientId: string; clientSecret: string; redirectUri?: string }) =>
      request<{ configured: boolean; connected: boolean }>('/spotify/credentials', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    disconnect: () => request<{ ok: boolean }>('/spotify/credentials', { method: 'DELETE' }),
    getConnectUrl: () => `${API_URL}/spotify/connect`,
    sync: () => request<{ ok: boolean }>('/spotify/sync', { method: 'POST' }),
    getRecentlyPlayed: () =>
      request<{ data: SpotifyRecentlyPlayedItem[]; syncedAt: string | null }>('/spotify/data/recently_played'),
    getTopTracks: (range: 'short' | 'medium' | 'long') =>
      request<{ data: SpotifyTrack[]; syncedAt: string | null }>(`/spotify/data/top_tracks_${range}`),
  },
  media: {
    list: () => request<{ media: MediaItem[] }>('/media'),
    upload: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return upload<{ media: MediaItem }>('/media', fd)
    },
    delete: (id: string) => request<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }),
  },
}

export type AvailableApp = {
  slug: string
  name: string
  description: string | null
  installed: boolean
}

export type EmbedToken = {
  id: string
  name: string
  token: string
  appSlug: string | null
  permissions: { read: boolean; write: boolean }
  expiresAt: string | null
  createdAt: string
}

export type ConnectorRow = {
  id: string
  type: string
  name: string
  config: Record<string, string>
  enabled: boolean
  lastSyncedAt: string | null
  createdAt: string
}

export type MediaItem = {
  id: string
  tenantId: string
  filename: string
  url: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string | null
  createdAt: string
  deletedAt: string | null
}

export type SpotifyStatus = {
  configured: boolean
  connected: boolean
  spotifyDisplayName?: string
  connectedAt?: string
}

export type SpotifyTrack = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { id: string; name: string; images: { url: string }[] }
  duration_ms: number
}

export type SpotifyRecentlyPlayedItem = {
  track: SpotifyTrack
  played_at: string
}
