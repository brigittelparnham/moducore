import { useEffect, useState } from 'react'
import { useSpotify } from '../context'
import { createSpotifyApi } from '../api'
import type { SpotifyTrack, SpotifyRecentlyPlayedItem } from '../types'

const S = {
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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
        const { data } = await api.getRecentlyPlayed()
        const recent = (data as SpotifyRecentlyPlayedItem[])[0]
        if (recent) setTrack(recent.track)
        setIsLive(false)
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  if (isLoading) return (
    <div style={card}>
      <p style={{ fontFamily: hand, fontSize: 22, color: S.inkSoft, opacity: 0.5, margin: 0 }}>loading…</p>
    </div>
  )
  if (!track) return (
    <div style={card}>
      <p style={{ fontFamily: hand, fontSize: 20, color: S.inkSoft, opacity: 0.6, margin: 0 }}>nothing played recently.</p>
    </div>
  )

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {albumArt(track) && (
          <img
            src={albumArt(track)}
            alt={track.album.name}
            style={{ width: 80, height: 80, borderRadius: 2, flexShrink: 0, objectFit: 'cover', boxShadow: '2px 3px 0 rgba(34,26,22,0.12)' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {isLive && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: S.mint, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: S.mint,
                  display: 'inline-block',
                }} />
                {isPlaying ? 'now playing' : 'paused'}
              </span>
            )}
            {!isLive && (
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: S.inkSoft, opacity: 0.5 }}>last played</span>
            )}
          </div>
          <div style={{ fontFamily: hand, fontSize: 28, color: S.ink, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.name}
          </div>
          <div style={{ fontFamily: body, fontSize: 14, color: S.inkSoft, marginTop: 2 }}>{artistNames(track)}</div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: S.inkSoft, opacity: 0.55, marginTop: 2 }}>
            {track.album.name} · {formatMs(track.duration_ms)}
          </div>
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fffdf8',
  border: `1.5px solid rgba(34,26,22,0.1)`,
  borderRadius: 3,
  padding: 20,
  boxShadow: '2px 3px 0 rgba(34,26,22,0.06)',
}
