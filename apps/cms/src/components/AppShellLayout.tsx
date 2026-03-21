import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { AppSwitcher } from '@moducore/hub'

const NAV_H = 52

export function AppShellLayout() {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.apps
      .list()
      .then((d) => setInstalledSlugs(new Set(d.apps.filter((a) => a.installed).map((a) => a.slug))))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (prefix: string) => location.pathname === prefix || location.pathname.startsWith(prefix + '/')

  const navLinks = [
    { to: '/pages', label: 'Pages' },
    ...(installedSlugs.has('journal') ? [{ to: '/journal', label: 'Journal' }] : []),
    ...(installedSlugs.has('spotify') ? [{ to: '/music', label: 'Music' }] : []),
    ...(installedSlugs.has('maps') ? [{ to: '/travel', label: 'Travel' }] : []),
    ...(installedSlugs.has('habits') ? [{ to: '/lifestyle', label: 'Lifestyle' }] : []),
    { to: '/media', label: 'Media' },
    { to: '/settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* ── Fixed top nav ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: NAV_H,
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 100,
          gap: 24,
        }}
      >
        {/* Brand / home */}
        <Link
          to="/"
          style={{ fontWeight: 700, fontSize: 14, color: '#111', textDecoration: 'none', flexShrink: 0 }}
        >
          {tenant?.name ?? 'moducore'}
        </Link>

        {/* Section nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#111' : '#666',
                  background: active ? '#f3f4f6' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#888' }}>{user?.name}</span>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 13,
              color: '#666',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 5,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ paddingTop: NAV_H }}>
        <Outlet />
      </main>
      <AppSwitcher />
    </div>
  )
}
