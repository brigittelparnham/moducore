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

export function SpotifyTopTracksWidget({ token, apiUrl = 'http://localhost:3000' }: Props) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/spotify/top-tracks?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Invalid token or server error'))))
      .then((data: { tracks: Track[] }) => setTracks(data.tracks))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (tracks.length === 0) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>No top tracks synced yet.</p></div>

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#1DB954', marginBottom: 12 }}>
        Top Tracks
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tracks.map((track, i) => (
          <li key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 16, textAlign: 'right', color: '#bbb', fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
            {track.album.images[0]?.url && (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.artists.map((a) => a.name).join(', ')}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>{formatMs(track.duration_ms)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
