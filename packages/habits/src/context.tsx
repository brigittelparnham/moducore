import { createContext, useContext } from 'react'

type HabitsContextValue = { apiBase: string }
const HabitsContext = createContext<HabitsContextValue>({ apiBase: '' })

export function HabitsProvider({
  apiBase,
  children,
}: {
  apiBase: string
  children: React.ReactNode
}) {
  return <HabitsContext.Provider value={{ apiBase }}>{children}</HabitsContext.Provider>
}

export function useHabits() {
  return useContext(HabitsContext)
}
