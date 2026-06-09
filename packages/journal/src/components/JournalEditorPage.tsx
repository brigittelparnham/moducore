import { useEffect, useState } from 'react'
import { useJournal } from '../context'
import { createJournalApi } from '../api'
import type { JournalEntry } from '../types'
import { RichTextEditor } from '@moducore/ui'
import { DayContextPanel } from './DayContextPanel'

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
  entryId: string | null
  onBack: () => void
  onCreated?: (id: string) => void
}

export function JournalEditorPage({ entryId, onBack, onCreated }: Props) {
  const { apiBase } = useJournal()
  const api = createJournalApi(apiBase)

  const isNew = entryId === null
  const [title, setTitle] = useState('')
  const [body2, setBody2] = useState('')
  const [tags, setTags] = useState('')
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew) return
    api.get(entryId!)
      .then((data) => {
        const e = data.entry
        setEntry(e)
        setTitle(e.title ?? '')
        const c = e.content as { html?: string; text?: string }
        setBody2(c.html ?? (c.text ? `<p>${c.text.replace(/\n/g, '</p><p>')}</p>` : ''))
        setTags(e.tags.join(', '))
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, isNew])

  const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean)

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const content = { html: body2 }
      if (isNew) {
        const data = await api.create({ title: title || undefined, content, tags: parsedTags })
        setEntry(data.entry)
        onCreated?.(data.entry.id)
      } else {
        const data = await api.update(entryId!, { title: title || undefined, content, tags: parsedTags })
        setEntry(data.entry)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!entry) return
    setIsSaving(true)
    try {
      const data = await api.publish(entry.id)
      setEntry(data.entry)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to publish')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!entry) return
    setIsSaving(true)
    try {
      const data = await api.unpublish(entry.id)
      setEntry(data.entry)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unpublish')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: S.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: hand, fontSize: 28, color: S.inkSoft, opacity: 0.5 }}>loading…</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: S.paper, fontFamily: body, position: 'relative' }}>
      {/* dot grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`, backgroundSize: '18px 18px', opacity: 0.35, zIndex: 0 }} />

      {/* toolbar */}
      <div style={{ background: S.paperD, borderBottom: `1.5px solid rgba(34,26,22,0.12)`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <button
          onClick={onBack}
          style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', background: 'none', border: 'none', cursor: 'pointer', color: S.inkSoft, opacity: 0.65, padding: 0 }}
        >
          ← back
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {entry && (
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', padding: '2px 8px', borderRadius: 999, background: entry.status === 'published' ? S.mint : 'rgba(34,26,22,0.1)', color: S.ink }}>
              {entry.status}
            </span>
          )}
          {entry?.status === 'published' ? (
            <button onClick={handleUnpublish} disabled={isSaving} style={secondaryBtn(isSaving)}>
              unpublish
            </button>
          ) : (
            entry && (
              <button onClick={handlePublish} disabled={isSaving} style={primaryBtn(isSaving)}>
                publish
              </button>
            )
          )}
          <button onClick={handleSave} disabled={isSaving} style={primaryBtn(isSaving)}>
            {isSaving ? 'saving…' : isNew ? 'create' : 'save'}
          </button>
        </div>
      </div>

      {/* editor body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
        {error && (
          <p style={{ fontFamily: body, fontSize: 13, color: S.coral, marginBottom: 16 }}>{error}</p>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="entry title…"
          style={{
            width: '100%',
            fontFamily: hand,
            fontSize: 36,
            color: S.ink,
            border: 'none',
            borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
            padding: '6px 0',
            marginBottom: 14,
            outline: 'none',
            boxSizing: 'border-box',
            background: 'transparent',
          }}
        />

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags, comma-separated"
          style={{
            width: '100%',
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            border: `1.5px solid rgba(34,26,22,0.15)`,
            borderRadius: 3,
            padding: '7px 12px',
            marginBottom: 20,
            boxSizing: 'border-box',
            outline: 'none',
            background: '#fffdf8',
            color: S.inkSoft,
          }}
        />

        {entry && (
          <DayContextPanel
            date={entry.createdAt.slice(0, 10)}
            apiBase={apiBase}
          />
        )}

        <RichTextEditor
          key={entryId ?? 'new'}
          initialContent={body2}
          onChange={setBody2}
          placeholder="write your entry…"
          minHeight={400}
        />
      </div>
    </div>
  )
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 16px',
  background: disabled ? 'rgba(34,26,22,0.35)' : '#221a16',
  color: '#efe6d4',
  border: 'none',
  borderRadius: 999,
  cursor: disabled ? 'not-allowed' : 'pointer',
  letterSpacing: '-0.01em',
})

const secondaryBtn = (disabled: boolean): React.CSSProperties => ({
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: '7px 16px',
  background: 'transparent',
  color: '#3b302a',
  border: `1.5px solid rgba(34,26,22,0.2)`,
  borderRadius: 999,
  cursor: disabled ? 'not-allowed' : 'pointer',
})
