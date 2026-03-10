import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { PagesPage } from './pages/PagesPage'
import { PageEditorPage } from './pages/PageEditorPage'
import { PublicPageView } from './pages/PublicPageView'
import { SettingsPage } from './pages/SettingsPage'
import { JournalFeedPage } from './pages/JournalFeedPage'
import { MediaPage } from './pages/MediaPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/p/:tenantSlug/:slug" element={<PublicPageView />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/pages" element={<ProtectedRoute><PagesPage /></ProtectedRoute>} />
          <Route path="/pages/:id" element={<ProtectedRoute><PageEditorPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Journal — connected read-only feed, authoring happens in apps/journal */}
          <Route path="/journal" element={<ProtectedRoute><JournalFeedPage /></ProtectedRoute>} />

          <Route path="/media" element={<ProtectedRoute><MediaPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
