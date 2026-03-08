import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, tenant, role, logout } = useAuth()
  const navigate = useNavigate()

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

      <p style={{ color: '#666' }}>Dashboard — apps will be installed here in Phase 5.</p>
    </div>
  )
}
