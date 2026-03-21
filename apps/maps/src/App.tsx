import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MapsProvider } from '@moducore/maps'
import { MapsAppPage } from './pages/MapsAppPage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CMS_URL = import.meta.env.VITE_CMS_URL ?? 'http://localhost:3001'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <p>Please log in via the CMS to access your travel data.</p>
        <a href={CMS_URL} style={{ color: '#1a1a1a', fontWeight: 600 }}>Go to CMS →</a>
      </div>
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
        </MapsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
