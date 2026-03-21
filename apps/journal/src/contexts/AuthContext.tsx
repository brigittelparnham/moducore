import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type AuthUser = { id: string; name: string; email: string }
type AuthTenant = { id: string; name: string; slug: string }

type AuthContextValue = {
  user: AuthUser | null
  tenant: AuthTenant | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null, tenant: null, isLoading: true,
  login: async () => {}, logout: async () => {}, refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tenant, setTenant] = useState<AuthTenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data: { user: AuthUser; tenant: AuthTenant } = await res.json()
      setUser(data.user)
      setTenant(data.tenant)
    } catch {
      setUser(null)
      setTenant(null)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? 'Invalid credentials')
    }
    await refresh()
  }

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setTenant(null)
  }

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, tenant, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
