import { createContext, useContext, type ReactNode } from 'react'

type MapsContextValue = { apiBase: string }

const MapsContext = createContext<MapsContextValue | null>(null)

export function MapsProvider({ apiBase, children }: { apiBase: string; children: ReactNode }) {
  return <MapsContext.Provider value={{ apiBase }}>{children}</MapsContext.Provider>
}

export function useMaps(): MapsContextValue {
  const ctx = useContext(MapsContext)
  if (!ctx) throw new Error('useMaps must be used inside MapsProvider')
  return ctx
}
