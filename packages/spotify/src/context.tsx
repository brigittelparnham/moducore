import { createContext, useContext, type ReactNode } from 'react'

type SpotifyContextValue = {
  apiBase: string
}

const SpotifyContext = createContext<SpotifyContextValue>({ apiBase: 'http://localhost:3000' })

export function SpotifyProvider({ apiBase, children }: { apiBase: string; children: ReactNode }) {
  return <SpotifyContext.Provider value={{ apiBase }}>{children}</SpotifyContext.Provider>
}

export function useSpotify() {
  return useContext(SpotifyContext)
}
