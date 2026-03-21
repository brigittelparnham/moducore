import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MapsProvider } from '@moducore/maps'
import { MapsAppPage } from './pages/MapsAppPage'
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
        setAppInstalled(d.apps.some((a) => a.slug === 'maps' && a.installed))
      })
      .catch(() => setAppInstalled(true))
  }, [user])

  if (isLoading || (user && appInstalled === null)) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <AppLoginScreen
        appName="Maps"
        appIcon="🗺️"
        accentColor="#ef4444"
        apiBase={API_URL}
        appSlug="maps"
        onLogin={refresh}
      />
    )
  }
  if (!appInstalled) {
    return (
      <AppActivationScreen
        appName="Maps"
        appIcon="🗺️"
        accentColor="#ef4444"
        apiBase={API_URL}
        appSlug="maps"
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
        <MapsProvider apiBase={API_URL}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><MapsAppPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AppSwitcher apiBase={API_URL} />
        </MapsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
