import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Page } from '../lib/api'

export function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.pages
      .list()
      .then((data) => setPages(data.pages))
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return
    try {
      await api.pages.delete(id)
      setPages((prev) => prev.filter((p) => p.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete page')
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Pages</h2>
        <button
          onClick={() => navigate('/pages/new')}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          + New page
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {isLoading && <p style={{ color: '#666' }}>Loading…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoading && pages.length === 0 && (
          <p style={{ color: '#666' }}>No pages yet. Create your first one.</p>
        )}
        {pages.map((page) => (
          <div
            key={page.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <div>
              <Link
                to={`/pages/${page.id}`}
                style={{ fontWeight: 600, textDecoration: 'none', color: '#111' }}
              >
                {page.title}
              </Link>
              <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>/{page.slug}</span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: page.status === 'published' ? '#dcfce7' : '#f3f4f6',
                  color: page.status === 'published' ? '#166534' : '#6b7280',
                }}
              >
                {page.status}
              </span>
            </div>
            <button
              onClick={() => handleDelete(page.id)}
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
