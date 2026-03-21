import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Page } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { RichTextEditor } from '@moducore/ui'
import { MediaPicker } from '../components/MediaPicker'
import { BlockEditor, type Block } from '../components/BlockEditor'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

type PageContent = { html?: string; text?: string; blocks?: Block[] }
type PageStyle = {
  accentColor?: string
  backgroundColor?: string
  fontFamily?: string
  maxWidth?: number
  showHeader?: boolean
  showFooter?: boolean
  showNav?: boolean
}

function isBlockPage(content: PageContent) {
  return Array.isArray(content.blocks)
}

export function PageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { tenant } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  // Block editor state (new pages + block pages)
  const [blocks, setBlocks] = useState<Block[]>([])
  // Legacy rich text state (old HTML-only pages)
  const [legacyBody, setLegacyBody] = useState('')
  // Which editor mode we're in
  const [useBlocks, setUseBlocks] = useState(isNew)
  // Per-page style overrides
  const [style, setStyle] = useState<PageStyle>({})
  const [showStylePanel, setShowStylePanel] = useState(false)

  // MediaPicker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerResolveRef = useRef<((url: string | null) => void) | null>(null)

  useEffect(() => {
    if (isNew) return
    api.pages
      .get(id!)
      .then((data) => {
        const p = data.page
        setPage(p)
        setTitle(p.title)
        setSlug(p.slug)
        const c = p.content as PageContent
        if (isBlockPage(c)) {
          setBlocks(c.blocks!)
          setUseBlocks(true)
        } else {
          setLegacyBody(c.html ?? (c.text ? `<p>${c.text.replace(/\n/g, '</p><p>')}</p>` : ''))
          setUseBlocks(false)
        }
        if ((p as unknown as { style?: PageStyle }).style) {
          setStyle((p as unknown as { style: PageStyle }).style)
        }
        setSlugTouched(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [id, isNew])

  useEffect(() => {
    if (!slugTouched && isNew) {
      setSlug(slugify(title))
    }
  }, [title, slugTouched, isNew])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const content: PageContent = useBlocks ? { blocks } : { html: legacyBody }
      if (isNew) {
        const data = await api.pages.create({ title, slug, content, style: Object.keys(style).length ? style : undefined })
        navigate(`/pages/${data.page.id}`, { replace: true })
      } else {
        const data = await api.pages.update(id!, { title, slug, content, style: Object.keys(style).length ? style : undefined })
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

  const onPickImage = (): Promise<string | null> =>
    new Promise((resolve) => {
      pickerResolveRef.current = resolve
      setPickerOpen(true)
    })

  const handlePickerSelect = (url: string) => {
    setPickerOpen(false)
    pickerResolveRef.current?.(url)
    pickerResolveRef.current = null
  }

  const handlePickerClose = () => {
    setPickerOpen(false)
    pickerResolveRef.current?.(null)
    pickerResolveRef.current = null
  }

  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      {/* ── Toolbar ── */}
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
            <button onClick={handleUnpublish} disabled={isSaving} style={{ padding: '7px 14px', cursor: 'pointer' }}>
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

      {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      {/* ── Title ── */}
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

      {/* ── Slug + view link ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ color: '#888', fontSize: 13 }}>Slug:</span>
        <input
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
          placeholder="page-slug"
          style={{ fontSize: 13, border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontFamily: 'monospace', color: '#555' }}
        />
        {page?.status === 'published' && (
          <a href={`/p/${tenant?.slug}/${page.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3b82f6' }}>
            View →
          </a>
        )}
      </div>

      {/* ── Page style panel ── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowStylePanel((s) => !s)}
          style={{
            fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
          }}
        >
          {showStylePanel ? 'Hide' : 'Page style ▾'}
        </button>
        {showStylePanel && (
          <div style={{
            marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '14px 16px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6b7280', width: 110 }}>Accent colour</span>
              <input type="color" value={style.accentColor ?? '#111111'}
                onChange={(e) => setStyle((s) => ({ ...s, accentColor: e.target.value }))}
                style={{ width: 36, height: 30, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
              <input value={style.accentColor ?? ''} placeholder="inherit"
                onChange={(e) => setStyle((s) => ({ ...s, accentColor: e.target.value || undefined }))}
                style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, width: 90, fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6b7280', width: 110 }}>Background</span>
              <input type="color" value={style.backgroundColor ?? '#ffffff'}
                onChange={(e) => setStyle((s) => ({ ...s, backgroundColor: e.target.value }))}
                style={{ width: 36, height: 30, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
              <input value={style.backgroundColor ?? ''} placeholder="inherit"
                onChange={(e) => setStyle((s) => ({ ...s, backgroundColor: e.target.value || undefined }))}
                style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, width: 90, fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6b7280', width: 110 }}>Max width (px)</span>
              <input type="number" value={style.maxWidth ?? ''} placeholder="700"
                onChange={(e) => setStyle((s) => ({ ...s, maxWidth: e.target.value ? Number(e.target.value) : undefined }))}
                style={{ fontSize: 13, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 5, width: 90 }} />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {(['showHeader', 'showFooter', 'showNav'] as const).map((key) => (
                <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={style[key] !== false}
                    onChange={(e) => setStyle((s) => ({ ...s, [key]: e.target.checked }))}
                  />
                  {key === 'showHeader' ? 'Show header' : key === 'showFooter' ? 'Show footer' : 'Show nav'}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Editor ── */}
      {useBlocks ? (
        <BlockEditor blocks={blocks} onChange={setBlocks} onPickImage={onPickImage} />
      ) : (
        <RichTextEditor
          key={id}
          initialContent={legacyBody}
          onChange={setLegacyBody}
          placeholder="Write your page content here…"
          minHeight={400}
          onPickImage={onPickImage}
        />
      )}

      {/* Media picker modal */}
      {pickerOpen && (
        <MediaPicker onSelect={handlePickerSelect} onClose={handlePickerClose} />
      )}
    </div>
  )
}
