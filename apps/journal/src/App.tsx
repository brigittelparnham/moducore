import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { JournalProvider, JournalListPage, JournalEditorPage } from '@moducore/journal'
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
        setAppInstalled(d.apps.some((a) => a.slug === 'journal' && a.installed))
      })
      .catch(() => setAppInstalled(true)) // fail open
  }, [user])

  if (isLoading || (user && appInstalled === null)) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <AppLoginScreen
        appName="Journal"
        appIcon="📓"
        accentColor="#f59e0b"
        apiBase={API_URL}
        appSlug="journal"
        onLogin={refresh}
      />
    )
  }
  if (!appInstalled) {
    return (
      <AppActivationScreen
        appName="Journal"
        appIcon="📓"
        accentColor="#f59e0b"
        apiBase={API_URL}
        appSlug="journal"
        userName={user.name}
        onActivated={refresh}
        onSwitchAccount={async () => { await logout(); refresh() }}
      />
    )
  }
  return <>{children}</>
}

function JournalListRoute() {
  const navigate = useNavigate()
  return (
    <JournalListPage
      onNew={() => navigate('/new')}
      onSelect={(id) => navigate(`/${id}`)}
    />
  )
}

function JournalEditorRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  return (
    <JournalEditorPage
      entryId={id ?? null}
      onBack={() => navigate('/')}
      onCreated={(newId) => navigate(`/${newId}`, { replace: true })}
    />
  )
}

function NewEntryRoute() {
  const navigate = useNavigate()
  return (
    <JournalEditorPage
      entryId={null}
      onBack={() => navigate('/')}
      onCreated={(newId) => navigate(`/${newId}`, { replace: true })}
    />
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <JournalProvider apiBase={API_URL}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><JournalListRoute /></ProtectedRoute>} />
            <Route path="/new" element={<ProtectedRoute><NewEntryRoute /></ProtectedRoute>} />
            <Route path="/:id" element={<ProtectedRoute><JournalEditorRoute /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AppSwitcher apiBase={API_URL} />
        </JournalProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
