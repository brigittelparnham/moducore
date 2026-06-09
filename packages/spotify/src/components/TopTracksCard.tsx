import { useEffect, useState } from 'react'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyTrack, TimeRange } from '../types'

const S = { ink: '#221a16', inkSoft: '#3b302a', mint: '#7fd1b9' }
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'short', label: '4 wks' },
  { value: 'medium', label: '6 mo' },
  { value: 'long', label: 'all time' },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontFamily: hand, fontSize: 24, color: S.ink }}>top tracks</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)} style={pill(r.value === range)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.5, margin: 0 }}>loading…</p>
      ) : tracks.length === 0 ? (
        <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6, margin: 0 }}>no tracks synced yet.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tracks.map((track, i) => (
            <li key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', width: 16, textAlign: 'right', color: S.inkSoft, opacity: 0.4, flexShrink: 0 }}>{i + 1}</span>
              {track.album?.images?.[0]?.url && (
                <img
                  src={track.album.images[0]!.url}
                  alt={track.album.name}
                  style={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0, objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: body, fontWeight: 600, fontSize: 13, color: S.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.name}
                </div>
                <div style={{ fontFamily: body, fontSize: 12, color: S.inkSoft, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(track.artists ?? []).map((a) => a.name).join(', ')}
                </div>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, color: S.inkSoft, opacity: 0.5, flexShrink: 0 }}>{formatMs(track.duration_ms)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: 20,
  flex: 1,
  minWidth: 0,
  boxShadow: '2px 3px 0 rgba(34,26,22,0.06)',
}

const pill = (active: boolean): React.CSSProperties => ({
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.15em',
  padding: '3px 8px',
  border: `1.5px solid ${active ? '#7fd1b9' : 'rgba(34,26,22,0.15)'}`,
  borderRadius: 999,
  background: active ? '#7fd1b9' : 'transparent',
  cursor: 'pointer',
  color: active ? '#221a16' : '#3b302a',
  fontWeight: active ? 700 : 400,
})
