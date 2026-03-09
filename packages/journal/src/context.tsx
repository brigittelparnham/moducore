import { createContext, useContext, type ReactNode } from 'react'

type JournalContextValue = {
  apiBase: string
}

const JournalContext = createContext<JournalContextValue>({ apiBase: 'http://localhost:3000' })

export function JournalProvider({ apiBase, children }: { apiBase: string; children: ReactNode }) {
  return <JournalContext.Provider value={{ apiBase }}>{children}</JournalContext.Provider>
}

export function useJournal() {
  return useContext(JournalContext)
}
