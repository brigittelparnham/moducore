import type { JournalEntry } from './types'

export function createJournalApi(apiBase: string) {
  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    const data = await res.json()
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed')
    return data as T
  }

  return {
    list: () => request<{ entries: JournalEntry[] }>('/journal'),
    get: (id: string) => request<{ entry: JournalEntry }>(`/journal/${id}`),
    create: (body: { title?: string; content: Record<string, unknown>; tags: string[] }) =>
      request<{ entry: JournalEntry }>('/journal', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ title: string; content: Record<string, unknown>; tags: string[] }>) =>
      request<{ entry: JournalEntry }>(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    publish: (id: string) =>
      request<{ entry: JournalEntry }>(`/journal/${id}/publish`, { method: 'POST' }),
    unpublish: (id: string) =>
      request<{ entry: JournalEntry }>(`/journal/${id}/unpublish`, { method: 'POST' }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/journal/${id}`, { method: 'DELETE' }),
  }
}
