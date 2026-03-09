import { useEffect, useState } from 'react'

type Entry = {
  id: string
  title: string | null
  content: { text?: string }
  tags: string[]
  publishedAt: string | null
  updatedAt: string
}

type Props = {
  token: string
  entryId: string
  apiUrl?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '100%',
  color: '#111',
}

export function JournalEntryWidget({ token, entryId, apiUrl = 'http://localhost:3000' }: Props) {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !entryId) {
      setError(!token ? 'No embed token provided' : 'No entry-id provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/journal/${entryId}?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status === 404 ? 'Entry not found' : 'Failed to load'))))
      .then((data: { entry: Entry }) => setEntry(data.entry))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, entryId, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (!entry) return null

  return (
    <div style={containerStyle}>
      {entry.title && (
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{entry.title}</h2>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: '#bbb' }}>
          {formatDate(entry.publishedAt ?? entry.updatedAt)}
        </span>
        {entry.tags.length > 0 && (
          <span style={{ fontSize: 12, color: '#999' }}>{entry.tags.join(', ')}</span>
        )}
      </div>
      {entry.content.text && (
        <div style={{ fontSize: 15, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {entry.content.text}
        </div>
      )}
    </div>
  )
}
