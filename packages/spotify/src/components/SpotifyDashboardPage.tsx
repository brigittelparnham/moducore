import { NowPlaying } from './NowPlaying'
import { TopTracksCard } from './TopTracksCard'
import { TopArtistsCard } from './TopArtistsCard'
import { GenreChart } from './GenreChart'
import { VibeBoard } from './VibeBoard'

export function SpotifyDashboardPage() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700 }}>Music Journal</h2>

      {/* Row 1: Now Playing */}
      <NowPlaying />

      {/* Row 2: Top Tracks + Top Artists */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <TopTracksCard />
        <TopArtistsCard />
      </div>

      {/* Row 3: Genre Chart + Vibe Board */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <GenreChart />
        <VibeBoard />
      </div>
    </div>
  )
}
