import { useEffect, useState } from 'react'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyTrack, SpotifyRecentlyPlayedItem } from '../types'

function albumArt(track: SpotifyTrack): string {
  return track.album.images[0]?.url ?? ''
}

function artistNames(track: SpotifyTrack): string {
  return track.artists.map((a) => a.name).join(', ')
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function NowPlaying() {
  const { apiBase } = useSpotify()
  const api = createSpotifyApi(apiBase)

  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    try {
      const { playing } = await api.getNowPlaying()
      if (playing?.item) {
        setTrack(playing.item)
        setIsPlaying(playing.is_playing)
        setIsLive(true)
      } else {
        // Fall back to most recently played
        const { data } = await api.getRecentlyPlayed()
        const recent = (data as SpotifyRecentlyPlayedItem[])[0]
        if (recent) setTrack(recent.track)
        setIsLive(false)
      }
    } catch {
      // silent — not critical
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Poll every 30s
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  if (isLoading) return <div style={card}><p style={muted}>Loading…</p></div>
  if (!track) return <div style={card}><p style={muted}>Nothing played recently.</p></div>

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {albumArt(track) && (
          <img
            src={albumArt(track)}
            alt={track.album.name}
            style={{ width: 80, height: 80, borderRadius: 6, flexShrink: 0, objectFit: 'cover' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isLive && (
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, color: '#1DB954', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#1DB954',
                  display: 'inline-block',
                  animation: isPlaying ? 'pulse 1.5s infinite' : undefined,
                }} />
                {isPlaying ? 'Now Playing' : 'Paused'}
              </span>
            )}
            {!isLive && <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Last Played</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.name}
          </div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>{artistNames(track)}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{track.album.name} · {formatMs(track.duration_ms)}</div>
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 20,
}

const muted: React.CSSProperties = { color: '#888', fontSize: 14, margin: 0 }
