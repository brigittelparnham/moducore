import { useState, useEffect } from 'react'
import { getHubConfig, setHubConfig } from '../config'
import type { HubApp } from '../types'

export function HubSettings() {
  const [apps, setApps] = useState<HubApp[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApps(getHubConfig())
  }, [])

  function update(slug: string, patch: Partial<HubApp>) {
    setApps((prev) => prev.map((a) => (a.slug === slug ? { ...a, ...patch } : a)))
    setSaved(false)
  }

  function handleSave() {
    setHubConfig(apps)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {apps.map((app) => (
          <div key={app.slug} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa',
          }}>
            <span style={{ fontSize: 20 }}>{app.icon}</span>
            <span style={{ width: 80, fontSize: 13, fontWeight: 600, color: '#374151' }}>{app.name}</span>
            <input
              value={app.url}
              onChange={(e) => update(app.slug, { url: e.target.value })}
              placeholder="http://localhost:3001"
              style={{
                flex: 1, fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6,
                padding: '5px 8px', fontFamily: 'monospace',
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={app.enabled}
                onChange={(e) => update(app.slug, { enabled: e.target.checked })}
              />
              enabled
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        style={{
          padding: '8px 18px', fontSize: 13, fontWeight: 600,
          background: saved ? '#10b981' : '#111', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {saved ? 'Saved' : 'Save app URLs'}
      </button>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        These URLs are stored in your browser and used by the app switcher and day context panel.
      </p>
    </div>
  )
}
