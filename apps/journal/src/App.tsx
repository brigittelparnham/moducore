import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { JournalProvider, JournalListPage, JournalEditorPage } from '@moducore/journal'
import { AppSwitcher } from '@moducore/hub'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CMS_URL = import.meta.env.VITE_CMS_URL ?? 'http://localhost:3001'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <p style={{ padding: 40, color: '#666' }}>Loading…</p>
  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <p>Please log in via the CMS to access the journal.</p>
        <a href={CMS_URL} style={{ color: '#3b82f6' }}>Go to CMS →</a>
      </div>
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
          <AppSwitcher />
        </JournalProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
