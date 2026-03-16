import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShellLayout } from './components/AppShellLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { PagesPage } from './pages/PagesPage'
import { PageEditorPage } from './pages/PageEditorPage'
import { PublicPageView } from './pages/PublicPageView'
import { SettingsPage } from './pages/SettingsPage'
import { JournalFeedPage } from './pages/JournalFeedPage'
import { SpotifyFeedPage } from './pages/SpotifyFeedPage'
import { MediaPage } from './pages/MediaPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/p/:tenantSlug/:slug" element={<PublicPageView />} />

          {/* ── Authenticated routes — all wrapped in AppShell ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppShellLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/pages" element={<PagesPage />} />
            <Route path="/pages/:id" element={<PageEditorPage />} />
            <Route path="/journal" element={<JournalFeedPage />} />
            <Route path="/music" element={<SpotifyFeedPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
