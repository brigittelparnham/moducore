import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Page } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function PageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { tenant } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (isNew) return
    api.pages
      .get(id!)
      .then((data) => {
        const p = data.page
        setPage(p)
        setTitle(p.title)
        setSlug(p.slug)
        setBody((p.content as { text?: string }).text ?? '')
        setSlugTouched(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [id, isNew])

  // Auto-generate slug from title while user hasn't manually edited it
  useEffect(() => {
    if (!slugTouched && isNew) {
      setSlug(slugify(title))
    }
  }, [title, slugTouched, isNew])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const content = { text: body }
      if (isNew) {
        const data = await api.pages.create({ title, slug, content })
        navigate(`/pages/${data.page.id}`, { replace: true })
      } else {
        const data = await api.pages.update(id!, { title, slug, content })
        setPage(data.page)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!page) return
    setIsSaving(true)
    setError('')
    try {
      const data = await api.pages.publish(page.id)
      setPage(data.page)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to publish')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!page) return
    setIsSaving(true)
    setError('')
    try {
      const data = await api.pages.unpublish(page.id)
      setPage(data.page)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unpublish')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/pages')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 }}
        >
          ← Back to pages
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {page && (
            <span
              style={{
                fontSize: 12,
                padding: '3px 8px',
                borderRadius: 4,
                background: page.status === 'published' ? '#dcfce7' : '#f3f4f6',
                color: page.status === 'published' ? '#166534' : '#6b7280',
              }}
            >
              {page.status}
            </span>
          )}
          {page?.status === 'published' ? (
            <button
              onClick={handleUnpublish}
              disabled={isSaving}
              style={{ padding: '7px 14px', cursor: 'pointer' }}
            >
              Unpublish
            </button>
          ) : (
            page && (
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
            disabled={isSaving || !title || !slug}
            style={{ padding: '7px 14px', cursor: 'pointer' }}
          >
            {isSaving ? 'Saving…' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Page title"
        style={{
          width: '100%',
          fontSize: 28,
          fontWeight: 700,
          border: 'none',
          borderBottom: '2px solid #eee',
          padding: '8px 0',
          marginBottom: 12,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ color: '#888', fontSize: 13 }}>Slug:</span>
        <input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setSlugTouched(true)
          }}
          placeholder="page-slug"
          style={{
            fontSize: 13,
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '4px 8px',
            fontFamily: 'monospace',
            color: '#555',
          }}
        />
        {page?.status === 'published' && (
          <a
            href={`/p/${tenant?.slug}/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: '#3b82f6' }}
          >
            View →
          </a>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your page content here…"
        style={{
          width: '100%',
          minHeight: 400,
          fontSize: 15,
          lineHeight: 1.6,
          border: '1px solid #eee',
          borderRadius: 6,
          padding: 16,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
