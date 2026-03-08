import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'

type AuthUser = { id: string; name: string; email: string }
type AuthTenant = { id: string; name: string; slug: string }

type AuthContextValue = {
  user: AuthUser | null
  tenant: AuthTenant | null
  role: string | null
  isLoading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tenant, setTenant] = useState<AuthTenant | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    try {
      const data = await api.auth.me() as { user: AuthUser; tenant: AuthTenant; role: string }
      setUser(data.user)
      setTenant(data.tenant)
      setRole(data.role)
    } catch {
      setUser(null)
      setTenant(null)
      setRole(null)
    }
  }

  const logout = async () => {
    await api.auth.logout()
    setUser(null)
    setTenant(null)
    setRole(null)
  }

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, tenant, role, isLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
