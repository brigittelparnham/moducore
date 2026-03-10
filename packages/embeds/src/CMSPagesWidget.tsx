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
  apiUrl?: string
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '100%',
  color: '#111',
}

export function CMSPagesWidget({ token, apiUrl = 'http://localhost:3000' }: Props) {
  const [pages, setPages] = useState<Page[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/pages?token=${encodeURIComponent(token)}`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error('Invalid token or server error'))
      )
      .then((data: { pages: Page[] }) => setPages(data.pages))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (pages.length === 0) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>No published pages yet.</p></div>

  return (
    <div style={containerStyle}>
      {pages.map((page) => {
        const isOpen = expanded === page.id
        const html = page.content.html ?? (page.content.text ? `<p>${page.content.text}</p>` : '')

        return (
          <div key={page.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setExpanded(isOpen ? null : page.id)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  textAlign: 'left', fontWeight: 600, fontSize: 15, color: '#111', flex: 1,
                }}
              >
                {page.title}
              </button>
              <button
                onClick={() => setExpanded(isOpen ? null : page.id)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: 12, color: '#888', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {isOpen ? 'Collapse ↑' : 'View ↓'}
              </button>
            </div>

            {isOpen && html && (
              <div
                style={{ marginTop: 12, fontSize: 15, lineHeight: 1.7, color: '#333' }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
