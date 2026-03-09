import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type AvailableApp } from '../lib/api'

export function SettingsPage() {
  const navigate = useNavigate()
  const [apps, setApps] = useState<AvailableApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.apps.list()
      .then((data) => setApps(data.apps))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const toggle = async (app: AvailableApp) => {
    setBusy(app.slug)
    setError('')
    try {
      if (app.installed) {
        await api.apps.uninstall(app.slug)
      } else {
        await api.apps.install(app.slug)
      }
      setApps((prev) =>
        prev.map((a) => (a.slug === app.slug ? { ...a, installed: !a.installed } : a))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <div />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3 style={{ marginBottom: 16 }}>Apps</h3>
      {isLoading && <p style={{ color: '#666' }}>Loading…</p>}
      {apps.map((app) => (
        <div
          key={app.slug}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0', borderBottom: '1px solid #eee',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{app.name}</div>
            {app.description && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{app.description}</div>}
          </div>
          <button
            onClick={() => toggle(app)}
            disabled={busy === app.slug}
            style={{
              padding: '6px 14px', cursor: 'pointer', borderRadius: 4,
              background: app.installed ? '#fff' : '#111',
              color: app.installed ? '#111' : '#fff',
              border: app.installed ? '1px solid #ccc' : 'none',
            }}
          >
            {busy === app.slug ? '…' : app.installed ? 'Uninstall' : 'Install'}
          </button>
        </div>
      ))}
    </div>
  )
}
