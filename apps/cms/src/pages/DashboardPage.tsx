import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
  rose: '#ff9bb8',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
          workspace
        </div>
        <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', margin: '0 0 2px', color: S.ink, lineHeight: 1 }}>
          {tenant?.name ?? 'moducore'}
        </h1>
        <div style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.65 }}>{today}</div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <StatCard label="pages" value={stats.pages} to="/pages" accent={S.sky} angle={1} />
          <StatCard label="media files" value={stats.media} to="/media" accent={S.mint} angle={-0.8} />
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/pages/new"
          style={{
            fontFamily: body,
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 22px',
            background: S.ink,
            color: S.paper,
            borderRadius: 999,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          + new page
        </Link>
        <Link
          to="/media"
          style={{
            fontFamily: body,
            fontSize: 14,
            padding: '10px 22px',
            background: 'transparent',
            color: S.inkSoft,
            borderRadius: 999,
            textDecoration: 'none',
            border: `1.5px solid rgba(34,26,22,0.2)`,
          }}
        >
          upload media
        </Link>
        <Link
          to="/settings"
          style={{
            fontFamily: body,
            fontSize: 14,
            padding: '10px 22px',
            background: 'transparent',
            color: S.inkSoft,
            borderRadius: 999,
            textDecoration: 'none',
            border: `1.5px solid rgba(34,26,22,0.2)`,
          }}
        >
          settings
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, to, accent, angle }: { label: string; value: number; to: string; accent: string; angle: number }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '22px 24px',
        background: '#fffdf8',
        border: `1.5px solid rgba(34,26,22,0.1)`,
        borderRadius: 3,
        textDecoration: 'none',
        boxShadow: '2px 3px 0 rgba(34,26,22,0.06)',
        transform: `rotate(${angle}deg)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: accent,
      }} />
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 52, lineHeight: 1, color: '#221a16', marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#3b302a', opacity: 0.55 }}>{label}</div>
    </Link>
  )
}
