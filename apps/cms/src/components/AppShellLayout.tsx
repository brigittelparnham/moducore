import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { AppSwitcher } from '@moducore/hub'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const NAV_H = 50

const S = {
  paper: '#efe6d4',
  paperD: '#e2d6bd',
  ink: '#221a16',
  inkSoft: '#3b302a',
}
const body = "'Space Grotesk', 'Instrument Sans', sans-serif"
const hand = "'Caveat', 'Patrick Hand', cursive"
const mono = "'JetBrains Mono', monospace"

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
    { to: '/pages', label: 'pages' },
    ...(installedSlugs.has('journal') ? [{ to: '/journal', label: 'journal' }] : []),
    ...(installedSlugs.has('spotify') ? [{ to: '/music', label: 'music' }] : []),
    ...(installedSlugs.has('maps') ? [{ to: '/travel', label: 'travel' }] : []),
    ...(installedSlugs.has('habits') ? [{ to: '/lifestyle', label: 'lifestyle' }] : []),
    { to: '/media', label: 'media' },
    { to: '/plugins', label: 'plugins' },
    { to: '/site', label: 'site' },
    { to: '/settings', label: 'settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#efe6d4', fontFamily: body, position: 'relative' }}>
      {/* dot grid */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `radial-gradient(rgba(34,26,22,0.13) 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
        opacity: 0.35,
        zIndex: 0,
      }} />

      {/* Fixed top nav */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: NAV_H,
        background: `${S.paperD}f0`,
        backdropFilter: 'blur(8px)',
        borderBottom: `1.5px solid rgba(34,26,22,0.12)`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100,
        gap: 20,
      }}>
        <Link
          to="/"
          style={{ fontFamily: hand, fontSize: 22, color: S.ink, textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}
        >
          {tenant?.name ?? 'moducore'}
        </Link>

        <nav style={{ display: 'flex', gap: 1, flex: 1, overflowX: 'auto' }}>
          {navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  textDecoration: 'none',
                  color: active ? S.ink : S.inkSoft,
                  opacity: active ? 1 : 0.5,
                  borderBottom: active ? `2px solid ${S.ink}` : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', color: S.inkSoft, opacity: 0.5 }}>{user?.name}</span>
          <button
            onClick={handleLogout}
            style={{
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: S.inkSoft,
              background: 'transparent',
              border: `1.5px solid rgba(34,26,22,0.2)`,
              borderRadius: 999,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            log out
          </button>
        </div>
      </header>

      <main style={{ paddingTop: NAV_H, position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
      <AppSwitcher apiBase={API_URL} />
    </div>
  )
}
