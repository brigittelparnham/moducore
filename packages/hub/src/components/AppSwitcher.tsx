import { useState, useEffect, useRef } from 'react'
import { getHubConfig, getCurrentAppSlug } from '../config'
import type { HubApp } from '../types'

export function AppSwitcher() {
  const [open, setOpen] = useState(false)
  const [apps, setApps] = useState<HubApp[]>([])
  const currentSlug = getCurrentAppSlug()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setApps(getHubConfig().filter((a) => a.enabled))
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={panelRef} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 52, right: 0,
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: 200,
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            moducore apps
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {apps.map((app) => {
              const isCurrent = app.slug === currentSlug
              return (
                <a
                  key={app.slug}
                  href={app.url}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                    background: isCurrent ? `${app.color}15` : 'transparent',
                    border: isCurrent ? `1px solid ${app.color}40` : '1px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${app.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>{app.icon}</span>
                  <span style={{
                    fontSize: 14, fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? app.color : '#111',
                  }}>{app.name}</span>
                  {isCurrent && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: app.color, fontWeight: 500 }}>here</span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title="App switcher"
        style={{
          width: 40, height: 40, borderRadius: 20,
          background: '#111', color: '#fff', border: 'none',
          cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        ⊞
      </button>
    </div>
  )
}
