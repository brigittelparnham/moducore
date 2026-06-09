import { useEffect, useState } from 'react'
import { useJournal } from '../context'
import { createJournalApi } from '../api'
import type { JournalEntry } from '../types'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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
    <div style={page}>
      <div style={dotGrid} />

      <div style={header}>
        <div style={{ padding: '0 20px', paddingTop: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55, textTransform: 'uppercase' as const }}>
            journal
          </div>
          <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', margin: '2px 0 0', color: S.ink, lineHeight: 1 }}>
            words you've{' '}
            <span style={{ fontFamily: hand, color: S.lemon, fontSize: 40 }}>written.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px 0' }}>
          <button onClick={onNew} style={newBtn}>+ new entry</button>
        </div>
        <div style={{ height: 16 }} />
      </div>

      <div style={content}>
        {isLoading && (
          <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5 }}>loading…</p>
        )}
        {error && (
          <p style={{ fontFamily: body, fontSize: 14, color: S.coral }}>{error}</p>
        )}
        {!isLoading && entries.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontFamily: hand, fontSize: 32, color: S.ink, marginBottom: 8 }}>nothing yet ↘</div>
            <p style={{ fontFamily: body, fontSize: 14, color: S.inkSoft, opacity: 0.7, margin: 0 }}>
              write your first entry to get started.
            </p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((entry) => (
            <div key={entry.id} style={entryCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => onSelect(entry.id)}
                  style={{ fontFamily: hand, fontSize: 22, color: S.ink, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', lineHeight: 1.2, display: 'block', width: '100%' }}
                >
                  {entry.title || <em style={{ opacity: 0.45 }}>untitled</em>}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={statusBadge(entry.status)}>{entry.status}</span>
                  {entry.tags.length > 0 && (
                    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: S.inkSoft, opacity: 0.5 }}>
                      {entry.tags.join(' · ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', color: S.inkSoft, opacity: 0.35, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px 0', alignSelf: 'flex-start' }}
              >
                delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function statusBadge(status: string): React.CSSProperties {
  const published = status === 'published'
  return {
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: 999,
    background: published ? '#7fd1b9' : 'rgba(34,26,22,0.1)',
    color: '#221a16',
  }
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#efe6d4',
  fontFamily: "'Space Grotesk', 'Instrument Sans', sans-serif",
  position: 'relative',
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  zIndex: 0,
}
const header: React.CSSProperties = {
  background: '#e2d6bd',
  borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
  position: 'relative',
  zIndex: 1,
}
const content: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px',
  position: 'relative',
  zIndex: 1,
}
const newBtn: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  padding: '9px 20px',
  background: '#221a16',
  color: '#efe6d4',
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
}
const entryCard: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  boxShadow: '1px 2px 0 rgba(34,26,22,0.05)',
}
const emptyState: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: '32px 24px',
  textAlign: 'center',
  marginBottom: 16,
}
