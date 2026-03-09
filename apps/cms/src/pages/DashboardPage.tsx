import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export function DashboardPage() {
  const { user, tenant, role, logout } = useAuth()
  const navigate = useNavigate()
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.apps.list()
      .then((data) => setInstalledSlugs(new Set(data.apps.filter((a) => a.installed).map((a) => a.slug))))
      .catch(() => {/* non-fatal */})
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{tenant?.name}</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>
            {user?.name} · {role}
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          Log out
        </button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Link to="/pages" style={{ fontWeight: 600, textDecoration: 'none', color: '#111' }}>
          Pages →
        </Link>
        {installedSlugs.has('journal') && (
          <Link to="/journal" style={{ fontWeight: 600, textDecoration: 'none', color: '#111' }}>
            Journal →
          </Link>
        )}
        <Link to="/settings" style={{ fontWeight: 600, textDecoration: 'none', color: '#666' }}>
          Settings
        </Link>
      </nav>
    </div>
  )
}
