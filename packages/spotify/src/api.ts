import type { SpotifyStatus, SpotifyTrack, SpotifyArtist, SpotifyRecentlyPlayedItem, AudioFeatures, TimeRange } from './types'

export function createSpotifyApi(apiBase: string) {
  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    const data = await res.json()
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed')
    return data as T
  }

  return {
    status: () => request<SpotifyStatus>('/spotify/status'),
    saveCredentials: (body: { clientId: string; clientSecret: string }) =>
      request<{ configured: boolean; connected: boolean }>('/spotify/credentials', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    disconnect: () => request<{ ok: boolean }>('/spotify/credentials', { method: 'DELETE' }),
    getConnectUrl: () => `${apiBase}/spotify/connect`,
    getTopTracks: (range: TimeRange) =>
      request<{ data: SpotifyTrack[]; syncedAt: string | null }>(`/spotify/data/top_tracks_${range}`),
    getTopArtists: (range: TimeRange) =>
      request<{ data: SpotifyArtist[]; syncedAt: string | null }>(`/spotify/data/top_artists_${range}`),
    getRecentlyPlayed: () =>
      request<{ data: SpotifyRecentlyPlayedItem[]; syncedAt: string | null }>('/spotify/data/recently_played'),
    getAudioFeatures: () =>
      request<{ data: AudioFeatures[]; syncedAt: string | null }>('/spotify/data/audio_features'),
    getNowPlaying: () =>
      request<{ playing: { item: SpotifyTrack; is_playing: boolean; progress_ms: number } | null }>('/spotify/now-playing'),
    sync: () => request<{ ok: boolean }>('/spotify/sync', { method: 'POST' }),
  }
}
