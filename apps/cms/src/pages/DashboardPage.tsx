import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export function DashboardPage() {
  const { tenant } = useAuth()
  const [stats, setStats] = useState<{ pages: number; media: number } | null>(null)

  useEffect(() => {
    Promise.all([api.pages.list(), api.media.list()])
      .then(([pagesData, mediaData]) =>
        setStats({ pages: pagesData.pages.length, media: mediaData.media.length })
      )
      .catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>{tenant?.name}</h1>
      <p style={{ margin: '0 0 40px', color: '#888', fontSize: 14 }}>
        Your content workspace
      </p>

      {/* Quick stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
          <StatCard label="Pages" value={stats.pages} to="/pages" />
          <StatCard label="Media files" value={stats.media} to="/media" />
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          to="/pages/new"
          style={{
            padding: '10px 18px',
            background: '#111',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + New page
        </Link>
        <Link
          to="/media"
          style={{
            padding: '10px 18px',
            background: '#fff',
            color: '#111',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
            border: '1px solid #e5e7eb',
          }}
        >
          Upload media
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '20px 24px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        textDecoration: 'none',
        minWidth: 140,
        background: '#fafafa',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{label}</div>
    </Link>
  )
}
