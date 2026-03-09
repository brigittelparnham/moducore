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
  apiUrl?: string
}

function excerpt(text: string | undefined, max = 200) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
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

export function JournalWidget({ token, apiUrl = 'http://localhost:3000' }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/journal?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Invalid token or server error'))))
      .then((data: { entries: Entry[] }) => setEntries(data.entries))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (entries.length === 0) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>No published entries yet.</p></div>

  return (
    <div style={containerStyle}>
      {entries.map((entry) => (
        <FeedCard key={entry.id} entry={entry} token={token} apiUrl={apiUrl} />
      ))}
    </div>
  )
}

function FeedCard({ entry, token, apiUrl }: { entry: Entry; token: string; apiUrl: string }) {
  const [expanded, setExpanded] = useState(false)
  const [fullText, setFullText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    const text = entry.content.text ?? ''
    // Short enough — no need to fetch, just expand
    if (text.length <= 200) {
      setFullText(text)
      setExpanded(true)
      return
    }
    // Fetch full entry content
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/embed/journal/${entry.id}?token=${encodeURIComponent(token)}`)
      const data: { entry: Entry } = await res.json()
      setFullText(data.entry.content.text ?? '')
      setExpanded(true)
    } finally {
      setIsLoading(false)
    }
  }

  const displayText = expanded && fullText !== null ? fullText : excerpt(entry.content.text)

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <button
          onClick={toggle}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textAlign: 'left', fontWeight: 600, fontSize: 15, color: '#111', flex: 1,
          }}
        >
          {entry.title || <em style={{ color: '#999', fontStyle: 'italic' }}>Untitled</em>}
        </button>
        <button
          onClick={toggle}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 12, color: '#888', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {isLoading ? '…' : expanded ? 'Collapse ↑' : 'Read more ↓'}
        </button>
      </div>

      {displayText && (
        <p style={{
          margin: '6px 0', fontSize: 13, color: '#555', lineHeight: 1.6,
          whiteSpace: expanded ? 'pre-wrap' : undefined,
        }}>
          {displayText}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#bbb' }}>
          {formatDate(entry.publishedAt ?? entry.updatedAt)}
        </span>
        {entry.tags.length > 0 && (
          <span style={{ fontSize: 11, color: '#999' }}>{entry.tags.join(', ')}</span>
        )}
      </div>
    </div>
  )
}
