import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

type Page = {
  id: string
  title: string
  slug: string
  content: { html?: string; text?: string }
  publishedAt: string | null
  updatedAt: string
}

type Props = {
  token: string
  slug: string
  apiUrl?: string
  showTitle?: boolean
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '100%',
  color: '#111',
}

// Minimal styles for rendered HTML content (injected once)
const CONTENT_STYLES = `
  .moducore-cms-content { font-size: 15px; line-height: 1.7; color: #333; }
  .moducore-cms-content h1 { font-size: 1.8em; font-weight: 700; margin: 0.8em 0 0.4em; }
  .moducore-cms-content h2 { font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.4em; }
  .moducore-cms-content h3 { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.4em; }
  .moducore-cms-content p { margin: 0 0 0.75em; }
  .moducore-cms-content ul, .moducore-cms-content ol { padding-left: 1.5em; margin: 0 0 0.75em; }
  .moducore-cms-content blockquote { border-left: 3px solid #ddd; padding-left: 1em; color: #666; font-style: italic; margin: 0 0 0.75em; }
  .moducore-cms-content code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
  .moducore-cms-content pre { background: #f4f4f4; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 0 0 0.75em; }
  .moducore-cms-content pre code { background: none; padding: 0; }
  .moducore-cms-content hr { border: none; border-top: 1px solid #eee; margin: 1.5em 0; }
`

let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  stylesInjected = true
  const style = document.createElement('style')
  style.textContent = CONTENT_STYLES
  document.head.appendChild(style)
}

export function CMSPageWidget({ token, slug, apiUrl = 'http://localhost:3000', showTitle = true }: Props) {
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    injectStyles()

    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    if (!slug) {
      setError('No slug provided')
      setIsLoading(false)
      return
    }

    fetch(`${apiUrl}/embed/pages/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`)
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error(res.status === 404 ? 'Page not found' : 'Failed to load'))
      )
      .then((data: { page: Page }) => setPage(data.page))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, slug, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (!page) return null

  const html = page.content.html ?? (page.content.text ? `<p>${page.content.text}</p>` : '')

  return (
    <div style={containerStyle}>
      {showTitle && (
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>{page.title}</h1>
      )}
      {html ? (
        <div
          className="moducore-cms-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      ) : (
        <p style={{ color: '#888', fontSize: 14 }}>No content.</p>
      )}
    </div>
  )
}
