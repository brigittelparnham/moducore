import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HabitsProvider } from '@moducore/habits'
import { HabitsAppPage } from './pages/HabitsAppPage'
import { AppSwitcher, AppLoginScreen, AppActivationScreen } from '@moducore/hub'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refresh, logout } = useAuth()
  const [appInstalled, setAppInstalled] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) { setAppInstalled(null); return }
    fetch(`${API_URL}/apps`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { apps: { slug: string; installed: boolean }[] }) => {
        setAppInstalled(d.apps.some((a) => a.slug === 'habits' && a.installed))
      })
      .catch(() => setAppInstalled(true))
  }, [user])

  if (isLoading || (user && appInstalled === null)) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <AppLoginScreen
        appName="Lifestyle"
        appIcon="✨"
        accentColor="#8b5cf6"
        apiBase={API_URL}
        appSlug="habits"
        onLogin={refresh}
      />
    )
  }
  if (!appInstalled) {
    return (
      <AppActivationScreen
        appName="Lifestyle"
        appIcon="✨"
        accentColor="#8b5cf6"
        apiBase={API_URL}
        appSlug="habits"
        userName={user.name}
        onActivated={refresh}
        onSwitchAccount={async () => { await logout(); refresh() }}
      />
    )
  }
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HabitsProvider apiBase={API_URL}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><HabitsAppPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AppSwitcher apiBase={API_URL} />
        </HabitsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
