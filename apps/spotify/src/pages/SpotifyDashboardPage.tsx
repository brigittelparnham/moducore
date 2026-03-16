import { SpotifyProvider, SpotifyDashboardPage as Dashboard } from '@moducore/spotify'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function SpotifyDashboardPage() {
  return (
    <SpotifyProvider apiBase={API_URL}>
      <Dashboard />
    </SpotifyProvider>
  )
}
