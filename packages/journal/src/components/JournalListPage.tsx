import { useEffect, useState } from 'react'
import { useJournal } from '../context'
import { createJournalApi } from '../api'
import type { JournalEntry } from '../types'

type Props = {
  onNew: () => void
  onSelect: (id: string) => void
}

export function JournalListPage({ onNew, onSelect }: Props) {
  const { apiBase } = useJournal()
  const api = createJournalApi(apiBase)

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.list()
      .then((data) => setEntries(data.entries))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await api.delete(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Journal</h2>
        <button onClick={onNew} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          + New entry
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {isLoading && <p style={{ color: '#666' }}>Loading…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoading && entries.length === 0 && (
          <p style={{ color: '#666' }}>No entries yet. Write your first one.</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <div>
              <button
                onClick={() => onSelect(entry.id)}
                style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 15 }}
              >
                {entry.title || <em style={{ color: '#999' }}>Untitled</em>}
              </button>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: entry.status === 'published' ? '#dcfce7' : '#f3f4f6',
                  color: entry.status === 'published' ? '#166534' : '#6b7280',
                }}
              >
                {entry.status}
              </span>
              {entry.tags.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                  {entry.tags.join(', ')}
                </span>
              )}
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
