export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
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

export const api = {
  auth: {
    signup: (body: object) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },
  pages: {
    list: () => request<{ pages: Page[] }>('/pages'),
    get: (id: string) => request<{ page: Page }>(`/pages/${id}`),
    create: (body: { title: string; slug: string; content: Record<string, unknown> }) =>
      request<{ page: Page }>('/pages', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: Partial<{ title: string; slug: string; content: Record<string, unknown> }>
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
