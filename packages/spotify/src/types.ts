export type SpotifyImage = { url: string; width: number | null; height: number | null }

export type SpotifyArtistSimple = { id: string; name: string }

export type SpotifyAlbum = {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
}

export type SpotifyTrack = {
  id: string
  name: string
  artists: SpotifyArtistSimple[]
  album: SpotifyAlbum
  duration_ms: number
  explicit: boolean
  preview_url: string | null
  popularity?: number
}

export type SpotifyArtist = {
  id: string
  name: string
  genres: string[]
  images: SpotifyImage[]
  popularity?: number
}

export type SpotifyRecentlyPlayedItem = {
  track: SpotifyTrack
  played_at: string
}

export type AudioFeatures = {
  id: string
  danceability: number   // 0–1
  energy: number         // 0–1
  valence: number        // 0–1 (mood: sad → happy)
  acousticness: number   // 0–1
  instrumentalness: number // 0–1
  tempo: number          // BPM
  key: number            // 0–11
  mode: number           // 0=minor, 1=major
  time_signature: number
  loudness: number       // dB
  speechiness: number    // 0–1
  liveness: number       // 0–1
}

export type SpotifyStatus = {
  configured: boolean
  connected: boolean
  spotifyDisplayName?: string
  connectedAt?: string
}

export type TimeRange = 'short' | 'medium' | 'long'
