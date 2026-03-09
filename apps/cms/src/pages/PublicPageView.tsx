import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type PageData = {
  page: {
    title: string
    slug: string
    content: { text?: string }
    publishedAt: string
  }
  tenant: { name: string; slug: string }
}

export function PublicPageView() {
  const { tenantSlug, slug } = useParams<{ tenantSlug: string; slug: string }>()
  const [data, setData] = useState<PageData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/public/${tenantSlug}/pages/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Page not found')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [tenantSlug, slug])

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <h2 style={{ color: '#888' }}>Page not found</h2>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', color: '#888' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px' }}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{data.tenant.name}</p>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 24 }}>{data.page.title}</h1>
      <div style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333' }}>
        {data.page.content.text ?? ''}
      </div>
    </div>
  )
}
