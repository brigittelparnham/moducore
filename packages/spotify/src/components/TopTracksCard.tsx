import { useEffect, useState } from 'react'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyTrack, TimeRange } from '../types'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'short', label: '4 weeks' },
  { value: 'medium', label: '6 months' },
  { value: 'long', label: 'All time' },
]

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function TopTracksCard() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)

  const [range, setRange] = useState<TimeRange>('short')
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    api.getTopTracks(range)
      .then(({ data }) => setTracks((data ?? []).slice(0, 5)))
      .catch(() => setTracks([]))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, range])

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={heading}>Top Tracks</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={r.value === range ? pillActive : pill}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={muted}>Loading…</p>
      ) : tracks.length === 0 ? (
        <p style={muted}>No tracks synced yet.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tracks.map((track, i) => (
            <li key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 20, textAlign: 'right', color: '#999', fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
              {track.album?.images?.[0]?.url && (
                <img
                  src={track.album.images[0]!.url}
                  alt={track.album.name}
                  style={{ width: 44, height: 44, borderRadius: 4, flexShrink: 0, objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.name}
                </div>
                <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(track.artists ?? []).map((a) => a.name).join(', ')}
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>{formatMs(track.duration_ms)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 20,
  flex: 1,
  minWidth: 0,
}

const heading: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 }

const pill: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: 12,
  border: '1px solid #d1d5db',
  borderRadius: 20,
  background: 'transparent',
  cursor: 'pointer',
  color: '#555',
}

const pillActive: React.CSSProperties = {
  ...pill,
  background: '#1DB954',
  border: '1px solid #1DB954',
  color: '#fff',
  fontWeight: 600,
}

const muted: React.CSSProperties = { color: '#888', fontSize: 14, margin: 0 }
