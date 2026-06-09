import { NowPlaying } from './NowPlaying'
import { TopTracksCard } from './TopTracksCard'
import { TopArtistsCard } from './TopArtistsCard'
import { GenreChart } from './GenreChart'
import { VibeBoard } from './VibeBoard'

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
  coral: '#ff8a5b',
  mint: '#7fd1b9',
  lemon: '#ffd86b',
  sky: '#9aa8ff',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

export function SpotifyDashboardPage() {
  return (
    <div style={page}>
      <div style={dotGrid} />

      <div style={header}>
        <div style={{ padding: '0 20px', paddingTop: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', opacity: 0.55, textTransform: 'uppercase' as const }}>
            music
          </div>
          <h1 style={{ fontFamily: body, fontWeight: 700, fontSize: 32, letterSpacing: '-0.03em', margin: '2px 0 0', color: S.ink, lineHeight: 1 }}>
            what you've been{' '}
            <span style={{ fontFamily: hand, color: S.coral, fontSize: 40 }}>listening to.</span>
          </h1>
        </div>
        <div style={{ height: 20 }} />
      </div>

      <div style={content}>
        <NowPlaying />

        <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
          <TopTracksCard />
          <TopArtistsCard />
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
          <GenreChart />
          <VibeBoard />
        </div>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: S.paper,
  fontFamily: body,
  position: 'relative',
}
const dotGrid: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: `radial-gradient(${S.inkSoft}22 1px, transparent 1px)`,
  backgroundSize: '18px 18px',
  opacity: 0.35,
  zIndex: 0,
}
const header: React.CSSProperties = {
  background: S.paperD,
  borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
  position: 'relative',
  zIndex: 1,
}
const content: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '24px 16px',
  position: 'relative',
  zIndex: 1,
}
