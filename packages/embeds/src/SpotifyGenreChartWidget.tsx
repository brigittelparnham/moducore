import { useEffect, useState } from 'react'

type GenreEntry = { genre: string; count: number }

type Props = {
  token: string
  apiUrl?: string
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  maxWidth: '100%',
  color: '#111',
}

export function SpotifyGenreChartWidget({ token, apiUrl = 'http://localhost:3000' }: Props) {
  const [genres, setGenres] = useState<GenreEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No embed token provided')
      setIsLoading(false)
      return
    }
    fetch(`${apiUrl}/embed/spotify/genres?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Invalid token or server error'))))
      .then((data: { genres: GenreEntry[] }) => setGenres(data.genres))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [token, apiUrl])

  if (isLoading) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>Loading…</p></div>
  if (error) return <div style={containerStyle}><p style={{ color: '#c00', fontSize: 14 }}>{error}</p></div>
  if (genres.length === 0) return <div style={containerStyle}><p style={{ color: '#888', fontSize: 14 }}>No genre data yet.</p></div>

  const max = genres[0]?.count ?? 1

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#1DB954', marginBottom: 12 }}>
        Genre Mix
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {genres.map((entry, i) => (
          <div key={entry.genre} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 110, fontSize: 12, color: '#333', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.genre}
            </span>
            <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${(entry.count / max) * 100}%`,
                height: '100%',
                background: '#1DB954',
                borderRadius: 4,
                opacity: 1 - i * 0.06,
              }} />
            </div>
            <span style={{ width: 20, fontSize: 11, color: '#999', flexShrink: 0 }}>{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
