import { useEffect, useState } from 'react'
import { api, type SpotifyStatus, type SpotifyTrack, type SpotifyRecentlyPlayedItem } from '../lib/api'

const SPOTIFY_APP_URL = import.meta.env.VITE_SPOTIFY_URL ?? 'http://localhost:3003'

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function SpotifyFeedPage() {
  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [recentTrack, setRecentTrack] = useState<SpotifyTrack | null>(null)
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const s = await api.spotify.status()
        setStatus(s)
        if (s.connected) {
          const [recent, top] = await Promise.allSettled([
            api.spotify.getRecentlyPlayed(),
            api.spotify.getTopTracks('short'),
          ])
          if (recent.status === 'fulfilled') {
            const items = recent.value.data as SpotifyRecentlyPlayedItem[]
            if (items?.[0]) setRecentTrack(items[0].track)
          }
          if (top.status === 'fulfilled') {
            setTopTracks((top.value.data ?? []).slice(0, 3))
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return <div style={page}><p style={muted}>Loading…</p></div>
  }

  if (!status?.configured) {
    return (
      <div style={page}>
        <h2 style={pageHeading}>Music Journal</h2>
        <p style={muted}>
          Set up your Spotify credentials in <a href="/settings" style={{ color: '#1DB954' }}>Settings</a> to get started.
        </p>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div style={page}>
        <h2 style={pageHeading}>Music Journal</h2>
        <p style={muted}>
          Credentials saved.{' '}
          <a href={api.spotify.getConnectUrl()} style={{ color: '#1DB954' }}>
            Connect your Spotify account →
          </a>
        </p>
      </div>
    )
  }

  return (
    <div style={page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Music Journal</h2>
        <a href={SPOTIFY_APP_URL} target="_blank" rel="noreferrer" style={btnGreen}>
          Open full dashboard ↗
        </a>
      </div>

      {/* Last played */}
      {recentTrack && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 10 }}>
            Last Played
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {recentTrack.album.images[0]?.url && (
              <img
                src={recentTrack.album.images[0].url}
                alt={recentTrack.album.name}
                style={{ width: 56, height: 56, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{recentTrack.name}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{recentTrack.artists.map((a) => a.name).join(', ')}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{recentTrack.album.name} · {formatMs(recentTrack.duration_ms)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 short-term tracks */}
      {topTracks.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 12 }}>
            Top Tracks This Month
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topTracks.map((track, i) => (
              <li key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, textAlign: 'right', color: '#bbb', fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                {track.album.images[0]?.url && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.artists.map((a) => a.name).join(', ')}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

const page: React.CSSProperties = { maxWidth: 700, margin: '40px auto', padding: '0 16px' }
const pageHeading: React.CSSProperties = { margin: '0 0 16px', fontSize: 22, fontWeight: 700 }
const card: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 20,
}
const btnGreen: React.CSSProperties = {
  display: 'inline-block',
  padding: '7px 14px',
  background: '#1DB954',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
}
const muted: React.CSSProperties = { color: '#888', fontSize: 14 }
