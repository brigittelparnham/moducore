import { useEffect, useState } from 'react'

type Track = {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
}

type Props = {
  token: string
  apiUrl?: string
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '100%',
  color: '#111',
}

export function SpotifyNowPlayingWidget({ token, apiUrl = 'http://localhost:3000' }: Props) {
  const [track, setTrack] = useState<Track | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/spotify/now-playing?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Invalid token or server error'))))
      .then((data: { track: Track | null }) => setTrack(data.track))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (!track) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Nothing played recently.</p></div>

  return (
    <div style={{ ...containerStyle, display: 'flex', gap: 12, alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      {track.album.images[0]?.url && (
        <img
          src={track.album.images[0].url}
          alt={track.album.name}
          style={{ width: 56, height: 56, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#1DB954', marginBottom: 4 }}>
          Last Played
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</div>
        <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artists.map((a) => a.name).join(', ')}
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>{track.album.name} · {formatMs(track.duration_ms)}</div>
      </div>
    </div>
  )
}
