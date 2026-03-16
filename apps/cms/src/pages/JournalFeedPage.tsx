import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const DEFAULT_JOURNAL_URL = import.meta.env.VITE_JOURNAL_URL ?? 'http://localhost:3002'

type Entry = {
  id: string
  title: string | null
  content: { text?: string; html?: string }
  tags: string[]
  status: 'draft' | 'published' | 'private'
  publishedAt: string | null
  updatedAt: string
}

function extractText(content: Entry['content'], max = 180): string {
  const raw = content.html
    ? content.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : content.text ?? ''
  return raw.length > max ? raw.slice(0, max).trimEnd() + '…' : raw
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function JournalFeedPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const journalAppUrl = localStorage.getItem('moducore_journal_url') ?? DEFAULT_JOURNAL_URL

  useEffect(() => {
    fetch(`${API_URL}/journal`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { entries: Entry[] }) => setEntries(data.entries))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const published = entries.filter((e) => e.status === 'published')
  const drafts = entries.filter((e) => e.status !== 'published')

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Journal</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
            Connected feed — entries are authored in the{' '}
            <a href={journalAppUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>
              Journal app ↗
            </a>
          </p>
        </div>
        <a
          href={journalAppUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Open Journal →
        </a>
      </div>

      {isLoading && <p style={{ color: '#666' }}>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Published entries */}
      {published.length > 0 && (
        <>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>
            Published
          </h3>
          {published.map((entry) => (
            <EntryCard key={entry.id} entry={entry} journalAppUrl={journalAppUrl} />
          ))}
        </>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#bbb', marginTop: 32, marginBottom: 12 }}>
            Drafts
          </h3>
          {drafts.map((entry) => (
            <EntryCard key={entry.id} entry={entry} journalAppUrl={journalAppUrl} />
          ))}
        </>
      )}

      {!isLoading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
          <p>No entries yet.</p>
          <a href={journalAppUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>
            Write your first entry in the Journal app →
          </a>
        </div>
      )}
    </div>
  )
}

function EntryCard({ entry, journalAppUrl }: { entry: Entry; journalAppUrl: string }) {
  const body = extractText(entry.content)
  const date = entry.publishedAt ?? entry.updatedAt

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {entry.title || <em style={{ color: '#999', fontStyle: 'italic' }}>Untitled</em>}
            </span>
            {entry.tags.length > 0 && (
              <span style={{ fontSize: 11, color: '#999' }}>{entry.tags.join(', ')}</span>
            )}
          </div>
          {body && (
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{body}</p>
          )}
          <span style={{ fontSize: 11, color: '#bbb' }}>{formatDate(date)}</span>
        </div>
        <a
          href={`${journalAppUrl}/${entry.id}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: 16, fontSize: 12, color: '#3b82f6', whiteSpace: 'nowrap', textDecoration: 'none' }}
        >
          Edit in Journal →
        </a>
      </div>
    </div>
  )
}
