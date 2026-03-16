import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SpotifyConnectPage } from './pages/SpotifyConnectPage'
import { SpotifyDashboardPage } from './pages/SpotifyDashboardPage'

const CMS_URL = import.meta.env.VITE_CMS_URL ?? 'http://localhost:3001'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <p>Please log in via the CMS to access your music journal.</p>
        <a href={CMS_URL} style={{ color: '#1DB954' }}>Go to CMS →</a>
      </div>
    )
  }
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><SpotifyDashboardPage /></ProtectedRoute>} />
          <Route path="/connect" element={<ProtectedRoute><SpotifyConnectPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
