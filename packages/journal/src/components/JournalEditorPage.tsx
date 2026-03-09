import { useEffect, useState } from 'react'
import { useJournal } from '../context'
import { createJournalApi } from '../api'
import type { JournalEntry } from '../types'

type Props = {
  entryId: string | null  // null = new entry
  onBack: () => void
  onCreated?: (id: string) => void  // called after new entry is saved
}

export function JournalEditorPage({ entryId, onBack, onCreated }: Props) {
  const { apiBase } = useJournal()
  const api = createJournalApi(apiBase)

  const isNew = entryId === null
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
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
        setBody((e.content as { text?: string }).text ?? '')
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
      const content = { text: body }
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

  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {entry && (
            <span style={{
              fontSize: 12, padding: '3px 8px', borderRadius: 4,
              background: entry.status === 'published' ? '#dcfce7' : '#f3f4f6',
              color: entry.status === 'published' ? '#166534' : '#6b7280',
            }}>
              {entry.status}
            </span>
          )}
          {entry?.status === 'published' ? (
            <button onClick={handleUnpublish} disabled={isSaving} style={{ padding: '7px 14px', cursor: 'pointer' }}>
              Unpublish
            </button>
          ) : (
            entry && (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                style={{ padding: '7px 14px', cursor: 'pointer', background: '#111', color: '#fff', border: 'none', borderRadius: 4 }}
              >
                Publish
              </button>
            )
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '7px 14px', cursor: 'pointer' }}
          >
            {isSaving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title (optional)"
        style={{
          width: '100%', fontSize: 24, fontWeight: 700, border: 'none',
          borderBottom: '2px solid #eee', padding: '8px 0', marginBottom: 12,
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma-separated)"
        style={{
          width: '100%', fontSize: 13, border: '1px solid #eee', borderRadius: 4,
          padding: '6px 10px', marginBottom: 16, boxSizing: 'border-box', outline: 'none',
        }}
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your entry…"
        style={{
          width: '100%', minHeight: 400, fontSize: 15, lineHeight: 1.7,
          border: '1px solid #eee', borderRadius: 6, padding: 16,
          resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
