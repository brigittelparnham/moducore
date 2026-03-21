import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type AuthUser = { id: string; name: string; email: string }
type AuthTenant = { id: string; name: string; slug: string }

type AuthContextValue = {
  user: AuthUser | null
  tenant: AuthTenant | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, tenant: null, isLoading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tenant, setTenant] = useState<AuthTenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { user: AuthUser; tenant: AuthTenant }) => {
        setUser(data.user)
        setTenant(data.tenant)
      })
      .catch(() => {
        setUser(null)
        setTenant(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return <AuthContext.Provider value={{ user, tenant, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
